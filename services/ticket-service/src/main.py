import json
import logging
import os
import time
from datetime import datetime, timezone
from datetime import timedelta
from uuid import UUID
from uuid import uuid4

import httpx
from fastapi import Depends, FastAPI, Header, HTTPException, Query, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
from prometheus_client import CONTENT_TYPE_LATEST, Counter, Histogram, generate_latest
from sqlalchemy import and_, func, select, text
from sqlalchemy.orm import Session

from app.deps import get_db
from app.models import SlaConfig, Ticket, TicketStatusHistory
from app.schemas import (
    SlaConfigResponse,
    SlaConfigUpsertRequest,
    TicketCreateRequest,
    TicketDetailResponse,
    TicketListResponse,
    TicketResponse,
    TicketStatusHistoryResponse,
    TicketStatusUpdateRequest,
)

SERVICE_NAME = os.getenv("SERVICE_NAME", "ticket-service")
SERVICE_VERSION = os.getenv("SERVICE_VERSION", "0.1.0")
ENVIRONMENT = os.getenv("ENVIRONMENT", "local")
LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO")
CORS_ORIGINS = os.getenv("CORS_ORIGINS", "*")
NOTIFICATION_SERVICE_URL = os.getenv("NOTIFICATION_SERVICE_URL", "")
AUTH_SERVICE_URL = os.getenv("AUTH_SERVICE_URL", "")
INTERNAL_API_KEY = os.getenv("INTERNAL_API_KEY", "")
INTERNAL_API_KEY = os.getenv("INTERNAL_API_KEY", "")

logging.basicConfig(level=LOG_LEVEL, format="%(message)s")
logger = logging.getLogger(SERVICE_NAME)

app = FastAPI(title=SERVICE_NAME, version=SERVICE_VERSION)

origins = [o.strip() for o in CORS_ORIGINS.split(",") if o.strip()] or ["*"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"] if "*" in origins else origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

REQUEST_COUNT = Counter(
    "http_requests_total",
    "Total HTTP requests",
    ["service", "method", "path", "status_code"],
)
REQUEST_LATENCY = Histogram(
    "http_request_duration_seconds",
    "HTTP request latency in seconds",
    ["service", "method", "path"],
)


def _get_correlation_id(request: Request) -> str:
    return (
        request.headers.get("x-correlation-id")
        or request.headers.get("x-request-id")
        or str(uuid4())
    )


def _log_event(request: Request, status_code: int, duration: float) -> None:
    event = {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "service": SERVICE_NAME,
        "environment": ENVIRONMENT,
        "method": request.method,
        "path": request.url.path,
        "status_code": status_code,
        "duration_ms": round(duration * 1000, 2),
        "correlation_id": getattr(request.state, "correlation_id", ""),
        "client_ip": request.client.host if request.client else "",
    }
    logger.info(json.dumps(event))


@app.middleware("http")
async def metrics_and_logging(request: Request, call_next):
    start = time.time()
    correlation_id = _get_correlation_id(request)
    request.state.correlation_id = correlation_id
    response = None
    try:
        response = await call_next(request)
        response.headers["X-Correlation-ID"] = correlation_id
        return response
    finally:
        duration = time.time() - start
        status_code = response.status_code if response else 500
        REQUEST_COUNT.labels(
            service=SERVICE_NAME,
            method=request.method,
            path=request.url.path,
            status_code=str(status_code),
        ).inc()
        REQUEST_LATENCY.labels(
            service=SERVICE_NAME, method=request.method, path=request.url.path
        ).observe(duration)
        _log_event(request, status_code, duration)


@app.get("/health")
async def health() -> dict:
    return {
        "status": "healthy",
        "service": SERVICE_NAME,
        "version": SERVICE_VERSION,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


@app.get("/ready")
async def ready() -> dict:
    return {
        "status": "ready",
        "service": SERVICE_NAME,
        "version": SERVICE_VERSION,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


@app.get("/live")
async def live() -> dict:
    return {
        "status": "live",
        "service": SERVICE_NAME,
        "version": SERVICE_VERSION,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


@app.get("/metrics")
async def metrics() -> Response:
    return Response(generate_latest(), media_type=CONTENT_TYPE_LATEST)


def _require_user_id(x_user_id: str | None) -> UUID:
    if not x_user_id:
        raise HTTPException(status_code=401, detail="Missing X-User-Id")
    try:
        return UUID(x_user_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid X-User-Id")


def _require_role(x_user_role: str | None, allowed: set[str]) -> None:
    if (x_user_role or "") not in allowed:
        raise HTTPException(status_code=403, detail="Forbidden")


def _require_internal(x_internal_api_key: str | None) -> None:
    if not INTERNAL_API_KEY or x_internal_api_key != INTERNAL_API_KEY:
        raise HTTPException(status_code=401, detail="Invalid internal key")


def _ticket_to_response(t: Ticket) -> TicketResponse:
    return TicketResponse(
        id=t.id,
        ticket_number=t.ticket_number,
        subscriber_id=t.subscriber_id,
        subscription_id=t.subscription_id,
        ticket_type=t.ticket_type,  # type: ignore[arg-type]
        priority=t.priority,  # type: ignore[arg-type]
        status=t.status,  # type: ignore[arg-type]
        title=t.title,
        description=t.description,
        location_address=t.location_address,
        assigned_technician_id=getattr(t, "assigned_technician_id", None),
        sla_due_at=getattr(t, "sla_due_at", None),
        created_at=t.created_at,
        updated_at=t.updated_at,
    )


def _compute_sla_due_at(db: Session, ticket_type: str, priority: str, created_at: datetime) -> datetime | None:
    """Compute SLA due date based on config. Returns None if no active config found."""
    config = db.execute(
        select(SlaConfig).where(
            SlaConfig.ticket_type == ticket_type,
            SlaConfig.priority == priority,
            SlaConfig.is_active.is_(True),
        )
    ).scalar_one_or_none()
    if not config:
        return None
    return created_at + timedelta(hours=config.due_hours)


def _allowed_status_transitions(current: str) -> set[str]:
    """Returns allowed next statuses from current status."""
    transitions: dict[str, set[str]] = {
        "created": {"assigned", "cancelled"},
        "assigned": {"in_progress", "cancelled"},
        "in_progress": {"completed"},
        "completed": {"closed"},
        "closed": set(),
        "cancelled": set(),
    }
    return transitions.get(current, set())


def _can_transition_status(
    *,
    current_status: str,
    new_status: str,
    actor_role: str,
    is_assigned_to_actor: bool,
) -> tuple[bool, str]:
    """Returns (allowed, reason)."""
    allowed = _allowed_status_transitions(current_status)
    if new_status not in allowed:
        return False, f"Invalid transition: {current_status} -> {new_status}"

    # Role-based rules
    if actor_role == "admin":
        # Admin can: created->assigned, completed->closed, any->cancelled
        if new_status == "assigned" and current_status == "created":
            return True, ""
        if new_status == "closed" and current_status == "completed":
            return True, ""
        if new_status == "cancelled":
            return True, ""
        return False, "Admin can only assign, close, or cancel"

    if actor_role == "technician":
        # Technician can: assigned->in_progress, in_progress->completed (must be assigned to them)
        if not is_assigned_to_actor:
            return False, "Technician can only update tickets assigned to them"
        if new_status == "in_progress" and current_status == "assigned":
            return True, ""
        if new_status == "completed" and current_status == "in_progress":
            return True, ""
        return False, "Technician can only start (assigned->in_progress) or complete (in_progress->completed)"

    if actor_role == "subscriber":
        # Subscriber cannot change status (unless you allow cancel within short window; for now: no)
        return False, "Subscriber cannot change ticket status"

    return False, "Unknown role"


def _month_window(now: datetime) -> tuple[datetime, datetime]:
    start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    if start.month == 12:
        end = start.replace(year=start.year + 1, month=1)
    else:
        end = start.replace(month=start.month + 1)
    return start, end


def _get_subscriber_id(db: Session, user_id: UUID) -> UUID:
    # Cross-schema lookup (subscriber-service owns this table)
    row = db.execute(
        text("SELECT id FROM subscriber.subscribers WHERE user_id = :uid LIMIT 1"),
        {"uid": str(user_id)},
    ).fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="Subscriber profile not found")
    return UUID(str(row[0]))


def _get_active_subscription_and_limits(db: Session, user_id: UUID) -> tuple[UUID | None, dict]:
    row = db.execute(
        text(
            """
            SELECT s.id as subscription_id, p.limits as limits
            FROM subscription.subscriptions s
            JOIN plan.plans p ON p.id = s.plan_id
            WHERE s.user_id = :uid AND s.status = 'active'
            ORDER BY s.created_at DESC
            LIMIT 1
            """
        ),
        {"uid": str(user_id)},
    ).fetchone()
    if not row:
        return None, {}
    subscription_id = UUID(str(row[0])) if row[0] else None
    limits = row[1] if isinstance(row[1], dict) else {}
    return subscription_id, limits


def _enforce_service_requests_per_month(db: Session, *, subscriber_id: UUID, limits: dict) -> None:
    raw_limit = limits.get("service_requests_per_month")
    try:
        limit = int(raw_limit) if raw_limit is not None else None
    except Exception:
        limit = None
    if not limit or limit <= 0:
        return

    now = datetime.now(timezone.utc)
    start, end = _month_window(now)
    used = int(
        db.execute(
            select(func.count())
            .select_from(Ticket)
            .where(
                and_(
                    Ticket.subscriber_id == subscriber_id,
                    Ticket.created_at >= start,
                    Ticket.created_at < end,
                )
            )
        ).scalar_one()
    )
    if used >= limit:
        raise HTTPException(status_code=403, detail="Monthly service request limit reached")


def _gen_ticket_number(now: datetime) -> str:
    # Simple unique ticket number (not sequential), good enough for Phase 4.
    return f"TKT-{now.year}-{uuid4().hex[:8].upper()}"


async def _notify_ticket_created(
    ticket_id: UUID,
    ticket_number: str,
    ticket_type: str,
    subscriber_id: UUID,
    correlation_id: str,
) -> None:
    """Send ticket_created notification to subscriber (best-effort)."""
    if not NOTIFICATION_SERVICE_URL or not INTERNAL_API_KEY:
        return

    # Get subscriber email from subscriber-service (cross-schema lookup)
    # For MVP: we can skip recipient lookup and log; or add later
    try:
        # Simplified: would need to lookup subscriber email/phone
        # For now, log that notification should be sent
        logger.info("Ticket created notification should be sent for ticket %s", ticket_number)
        # Uncomment when recipient lookup is available:
        # async with httpx.AsyncClient(timeout=3.0) as client:
        #     await client.post(
        #         f"{NOTIFICATION_SERVICE_URL}/api/v1/notifications/internal/send",
        #         headers={"X-Internal-API-Key": INTERNAL_API_KEY, "x-correlation-id": correlation_id},
        #         json={
        #             "template_key": "ticket_created",
        #             "channel": "email",
        #             "recipient": email,
        #             "context": {"ticket_number": ticket_number, "ticket_type": ticket_type},
        #         },
        #     )
    except Exception as e:
        logger.warning("Notification send failed (best-effort): %s", e)


async def _notify_job_completed(
    ticket_id: UUID,
    ticket_number: str,
    subscriber_id: UUID,
    correlation_id: str,
) -> None:
    """Send job_completed notification to subscriber (best-effort)."""
    if not NOTIFICATION_SERVICE_URL or not INTERNAL_API_KEY:
        return

    try:
        logger.info("Job completed notification should be sent for ticket %s", ticket_number)
        # Similar to _notify_ticket_created - would need recipient lookup
    except Exception as e:
        logger.warning("Notification send failed (best-effort): %s", e)


@app.post("/api/v1/tickets", response_model=TicketResponse, status_code=status.HTTP_201_CREATED)
async def create_ticket(
    req: TicketCreateRequest,
    db: Session = Depends(get_db),
    x_user_id: str | None = Header(default=None),
    x_user_role: str | None = Header(default=None),
    request: Request = None,
):
    _require_role(x_user_role, {"subscriber", "admin"})
    user_id = _require_user_id(x_user_id)

    subscriber_id = _get_subscriber_id(db, user_id)
    subscription_id, limits = _get_active_subscription_and_limits(db, user_id)
    _enforce_service_requests_per_month(db, subscriber_id=subscriber_id, limits=limits)

    now = datetime.now(timezone.utc)
    # Retry a few times to avoid extremely rare ticket_number collision
    ticket_number = ""
    for _ in range(5):
        candidate = _gen_ticket_number(now)
        exists = db.execute(select(Ticket).where(Ticket.ticket_number == candidate)).scalar_one_or_none()
        if not exists:
            ticket_number = candidate
            break
    if not ticket_number:
        raise HTTPException(status_code=500, detail="Failed to generate ticket number")

    sla_due_at = _compute_sla_due_at(db, req.ticket_type, req.priority, now)

    t = Ticket(
        ticket_number=ticket_number,
        subscriber_id=subscriber_id,
        subscription_id=subscription_id,
        ticket_type=req.ticket_type,
        priority=req.priority,
        status="created",
        title=req.title,
        description=req.description,
        location_address=req.location_address,
        assigned_technician_id=None,
        sla_due_at=sla_due_at,
        created_at=now,
        updated_at=now,
    )
    db.add(t)
    db.commit()
    db.refresh(t)

    # Record initial status in history
    hist = TicketStatusHistory(
        ticket_id=t.id,
        from_status=None,
        to_status="created",
        actor_user_id=user_id,
        actor_role=str(x_user_role or ""),
        notes=None,
        created_at=now,
    )
    db.add(hist)
    db.commit()
    db.refresh(t)

    # Notify subscriber on ticket creation (best-effort)
    correlation_id = getattr(request.state, "correlation_id", str(uuid4()))
    await _notify_ticket_created(t.id, t.ticket_number, t.ticket_type, subscriber_id, correlation_id)

    return _ticket_to_response(t)


@app.get("/api/v1/tickets/me", response_model=TicketListResponse)
async def list_my_tickets(
    db: Session = Depends(get_db),
    x_user_id: str | None = Header(default=None),
    x_user_role: str | None = Header(default=None),
    status: str | None = Query(default=None),
    ticket_type: str | None = Query(default=None),
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
):
    _require_role(x_user_role, {"subscriber"})
    user_id = _require_user_id(x_user_id)
    subscriber_id = _get_subscriber_id(db, user_id)

    stmt = select(Ticket).where(Ticket.subscriber_id == subscriber_id)
    filters = []
    if status:
        filters.append(Ticket.status == status)
    if ticket_type:
        filters.append(Ticket.ticket_type == ticket_type)
    if filters:
        stmt = stmt.where(and_(*filters))

    total = int(db.execute(select(func.count()).select_from(stmt.subquery())).scalar_one())
    rows = db.execute(stmt.order_by(Ticket.created_at.desc()).limit(limit).offset(offset)).scalars().all()
    return TicketListResponse(items=[_ticket_to_response(t) for t in rows], total=total)


@app.get("/api/v1/tickets/{ticket_id}", response_model=TicketDetailResponse)
async def get_ticket(
    ticket_id: UUID,
    db: Session = Depends(get_db),
    x_user_id: str | None = Header(default=None),
    x_user_role: str | None = Header(default=None),
    include_history: bool = Query(default=False),
):
    user_id = _require_user_id(x_user_id)
    role = str(x_user_role or "")

    t = db.get(Ticket, ticket_id)
    if not t:
        raise HTTPException(status_code=404, detail="Ticket not found")

    # Authorization
    if role == "subscriber":
        subscriber_id = _get_subscriber_id(db, user_id)
        if t.subscriber_id != subscriber_id:
            raise HTTPException(status_code=403, detail="Forbidden")
    elif role == "technician":
        if not t.assigned_technician_id or t.assigned_technician_id != user_id:
            raise HTTPException(status_code=403, detail="Forbidden")
    elif role != "admin":
        raise HTTPException(status_code=403, detail="Forbidden")

    status_history = None
    if include_history:
        hist_rows = db.execute(
            select(TicketStatusHistory)
            .where(TicketStatusHistory.ticket_id == ticket_id)
            .order_by(TicketStatusHistory.created_at.asc())
        ).scalars().all()
        status_history = [
            TicketStatusHistoryResponse(
                id=h.id,
                ticket_id=h.ticket_id,
                from_status=h.from_status,
                to_status=h.to_status,
                actor_user_id=h.actor_user_id,
                actor_role=h.actor_role,
                notes=h.notes,
                created_at=h.created_at,
            )
            for h in hist_rows
        ]

    resp = _ticket_to_response(t)
    return TicketDetailResponse(**resp.model_dump(), status_history=status_history)


@app.patch("/api/v1/tickets/{ticket_id}", response_model=TicketResponse)
async def update_ticket_status(
    ticket_id: UUID,
    req: TicketStatusUpdateRequest,
    db: Session = Depends(get_db),
    x_user_id: str | None = Header(default=None),
    x_user_role: str | None = Header(default=None),
    request: Request = None,
):
    user_id = _require_user_id(x_user_id)
    role = str(x_user_role or "")

    t = db.get(Ticket, ticket_id)
    if not t:
        raise HTTPException(status_code=404, detail="Ticket not found")

    # Authorization
    is_assigned_to_actor = bool(t.assigned_technician_id and t.assigned_technician_id == user_id)
    if role == "subscriber":
        subscriber_id = _get_subscriber_id(db, user_id)
        if t.subscriber_id != subscriber_id:
            raise HTTPException(status_code=403, detail="Forbidden")
    elif role == "technician":
        if not is_assigned_to_actor:
            raise HTTPException(status_code=403, detail="Forbidden")
    elif role != "admin":
        raise HTTPException(status_code=403, detail="Forbidden")

    # Validate transition
    allowed, reason = _can_transition_status(
        current_status=t.status,
        new_status=req.status,
        actor_role=role,
        is_assigned_to_actor=is_assigned_to_actor,
    )
    if not allowed:
        raise HTTPException(status_code=400, detail=reason)

    # Require completion_notes for technician completing
    if req.status == "completed" and role == "technician" and not req.completion_notes:
        raise HTTPException(status_code=400, detail="completion_notes required when completing ticket")

    now = datetime.now(timezone.utc)
    old_status = t.status
    t.status = req.status
    t.updated_at = now
    db.add(t)

    # Record status history
    hist = TicketStatusHistory(
        ticket_id=t.id,
        from_status=old_status,
        to_status=req.status,
        actor_user_id=user_id,
        actor_role=role,
        notes=req.completion_notes if req.status == "completed" else None,
        created_at=now,
    )
    db.add(hist)
    db.commit()
    db.refresh(t)

    # Notify on completion
    if req.status == "completed":
        correlation_id = getattr(request.state, "correlation_id", str(uuid4()))
        await _notify_job_completed(t.id, t.ticket_number, t.subscriber_id, correlation_id)

    return _ticket_to_response(t)


@app.get("/api/v1/tickets/admin", response_model=TicketListResponse)
async def admin_list_tickets(
    db: Session = Depends(get_db),
    x_user_role: str | None = Header(default=None),
    status: str | None = Query(default=None),
    ticket_type: str | None = Query(default=None),
    priority: str | None = Query(default=None),
    subscriber_id: UUID | None = Query(default=None),
    assigned_technician_id: UUID | None = Query(default=None),
    date_from: datetime | None = Query(default=None),
    date_to: datetime | None = Query(default=None),
    sla_due_before: datetime | None = Query(default=None),
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
):
    _require_role(x_user_role, {"admin"})

    stmt = select(Ticket)
    filters = []
    if status:
        filters.append(Ticket.status == status)
    if ticket_type:
        filters.append(Ticket.ticket_type == ticket_type)
    if priority:
        filters.append(Ticket.priority == priority)
    if subscriber_id:
        filters.append(Ticket.subscriber_id == subscriber_id)
    if assigned_technician_id:
        filters.append(Ticket.assigned_technician_id == assigned_technician_id)
    if date_from:
        filters.append(Ticket.created_at >= date_from)
    if date_to:
        filters.append(Ticket.created_at <= date_to)
    if sla_due_before:
        filters.append(Ticket.sla_due_at.is_not(None))
        filters.append(Ticket.sla_due_at <= sla_due_before)
    if filters:
        stmt = stmt.where(and_(*filters))

    total = int(db.execute(select(func.count()).select_from(stmt.subquery())).scalar_one())
    rows = db.execute(stmt.order_by(Ticket.created_at.desc()).limit(limit).offset(offset)).scalars().all()
    return TicketListResponse(items=[_ticket_to_response(t) for t in rows], total=total)


@app.patch("/api/v1/tickets/internal/{ticket_id}/assign-technician", response_model=TicketResponse)
async def internal_assign_technician(
    ticket_id: UUID,
    technician_id: UUID | None = Query(default=None),
    db: Session = Depends(get_db),
    x_internal_api_key: str | None = Header(default=None, alias="X-Internal-API-Key"),
):
    """Internal endpoint for assignment-service to update assigned_technician_id and optionally status."""
    _require_internal(x_internal_api_key)

    t = db.get(Ticket, ticket_id)
    if not t:
        raise HTTPException(status_code=404, detail="Ticket not found")

    now = datetime.now(timezone.utc)
    old_status = t.status
    old_tech_id = t.assigned_technician_id

    if technician_id:
        t.assigned_technician_id = technician_id
        # Auto-transition: created -> assigned if currently created
        if t.status == "created":
            t.status = "assigned"
    else:
        t.assigned_technician_id = None
        # Revert to created if was assigned
        if t.status == "assigned":
            t.status = "created"

    t.updated_at = now
    db.add(t)

    # Record status history if status changed
    if old_status != t.status:
        hist = TicketStatusHistory(
            ticket_id=t.id,
            from_status=old_status,
            to_status=t.status,
            actor_user_id=None,  # System action
            actor_role="system",
            notes=f"Technician assignment: {technician_id}" if technician_id else "Technician unassigned",
            created_at=now,
        )
        db.add(hist)

    db.commit()
    db.refresh(t)
    return _ticket_to_response(t)


@app.get("/api/v1/tickets/admin/sla-configs", response_model=list[SlaConfigResponse])
async def admin_list_sla_configs(
    db: Session = Depends(get_db),
    x_user_role: str | None = Header(default=None),
):
    _require_role(x_user_role, {"admin"})
    rows = db.execute(select(SlaConfig).order_by(SlaConfig.ticket_type, SlaConfig.priority)).scalars().all()
    return [
        SlaConfigResponse(
            id=c.id,
            ticket_type=c.ticket_type,
            priority=c.priority,
            due_hours=c.due_hours,
            is_active=c.is_active,
            created_at=c.created_at,
            updated_at=c.updated_at,
        )
        for c in rows
    ]


@app.put("/api/v1/tickets/admin/sla-configs", response_model=SlaConfigResponse)
async def admin_upsert_sla_config(
    req: SlaConfigUpsertRequest,
    db: Session = Depends(get_db),
    x_user_role: str | None = Header(default=None),
):
    _require_role(x_user_role, {"admin"})

    existing = db.execute(
        select(SlaConfig).where(
            SlaConfig.ticket_type == req.ticket_type,
            SlaConfig.priority == req.priority,
        )
    ).scalar_one_or_none()

    now = datetime.now(timezone.utc)
    if existing:
        existing.due_hours = req.due_hours
        existing.is_active = req.is_active
        existing.updated_at = now
        db.add(existing)
        db.commit()
        db.refresh(existing)
        return SlaConfigResponse(
            id=existing.id,
            ticket_type=existing.ticket_type,
            priority=existing.priority,
            due_hours=existing.due_hours,
            is_active=existing.is_active,
            created_at=existing.created_at,
            updated_at=existing.updated_at,
        )

    new_config = SlaConfig(
        ticket_type=req.ticket_type,
        priority=req.priority,
        due_hours=req.due_hours,
        is_active=req.is_active,
        created_at=now,
        updated_at=now,
    )
    db.add(new_config)
    db.commit()
    db.refresh(new_config)
    return SlaConfigResponse(
        id=new_config.id,
        ticket_type=new_config.ticket_type,
        priority=new_config.priority,
        due_hours=new_config.due_hours,
        is_active=new_config.is_active,
        created_at=new_config.created_at,
        updated_at=new_config.updated_at,
    )


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        app,
        host="0.0.0.0",
        port=int(os.getenv("SERVICE_PORT", "8000")),
        log_level=LOG_LEVEL.lower(),
    )
