import json
import logging
import os
import time
from datetime import datetime, timezone
from uuid import UUID
from uuid import uuid4

import httpx
from fastapi import Depends, FastAPI, Header, HTTPException, Query, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
from prometheus_client import CONTENT_TYPE_LATEST, Counter, Histogram, generate_latest
from sqlalchemy import and_, func, select, text
from sqlalchemy.orm import Session

from app.deps import get_db
from app.models import TicketAssignment
from app.schemas import AssignmentCreateRequest, AssignmentListResponse, AssignmentResponse

SERVICE_NAME = os.getenv("SERVICE_NAME", "assignment-service")
SERVICE_VERSION = os.getenv("SERVICE_VERSION", "0.1.0")
ENVIRONMENT = os.getenv("ENVIRONMENT", "local")
LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO")
CORS_ORIGINS = os.getenv("CORS_ORIGINS", "*")
TICKET_SERVICE_URL = os.getenv("TICKET_SERVICE_URL", "")
NOTIFICATION_SERVICE_URL = os.getenv("NOTIFICATION_SERVICE_URL", "")
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


def _assignment_to_response(a: TicketAssignment) -> AssignmentResponse:
    return AssignmentResponse(
        id=a.id,
        ticket_id=a.ticket_id,
        subscriber_id=a.subscriber_id,
        technician_id=a.technician_id,
        status=a.status,  # type: ignore[arg-type]
        assigned_by_user_id=a.assigned_by_user_id,
        notes=a.notes,
        assigned_at=a.assigned_at,
        updated_at=a.updated_at,
    )


async def _get_ticket_subscriber_id(db: Session, ticket_id: UUID) -> UUID:
    """Cross-schema lookup to get subscriber_id from ticket."""
    row = db.execute(
        text("SELECT subscriber_id FROM ticket.tickets WHERE id = :tid LIMIT 1"),
        {"tid": str(ticket_id)},
    ).fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="Ticket not found")
    return UUID(str(row[0]))


async def _update_ticket_assignment(
    ticket_id: UUID,
    technician_id: UUID | None,
    correlation_id: str,
) -> None:
    """Call ticket-service internal endpoint to update assigned_technician_id."""
    if not TICKET_SERVICE_URL or not INTERNAL_API_KEY:
        logger.warning("TICKET_SERVICE_URL or INTERNAL_API_KEY not configured; skipping ticket update")
        return

    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            resp = await client.patch(
                f"{TICKET_SERVICE_URL}/api/v1/tickets/internal/{ticket_id}/assign-technician",
                headers={
                    "X-Internal-API-Key": INTERNAL_API_KEY,
                    "x-correlation-id": correlation_id,
                },
                params={"technician_id": str(technician_id)} if technician_id else {},
            )
            if resp.status_code not in (200, 201):
                logger.warning("Ticket update returned %d: %s", resp.status_code, resp.text)
    except Exception as e:
        logger.warning("Failed to update ticket assignment: %s", e)
        # Don't fail assignment creation if ticket update fails (best-effort)


async def _notify_job_assigned(
    technician_id: UUID,
    ticket_id: UUID,
    correlation_id: str,
) -> None:
    """Send job_assigned notification to technician (best-effort)."""
    if not NOTIFICATION_SERVICE_URL or not INTERNAL_API_KEY:
        return

    # Get technician email/phone from auth-service (simplified: we'd need user lookup)
    # For now, we'll skip the recipient lookup and let notification-service handle it
    # or we can add it later. For MVP: log that notification should be sent.
    try:
        async with httpx.AsyncClient(timeout=3.0) as client:
            await client.post(
                f"{NOTIFICATION_SERVICE_URL}/api/v1/notifications/internal/send",
                headers={
                    "X-Internal-API-Key": INTERNAL_API_KEY,
                    "x-correlation-id": correlation_id,
                },
                json={
                    "template_key": "job_assigned",
                    "channel": "email",  # or sms; for now email
                    "recipient": "",  # Would need to lookup from auth-service
                    "context": {
                        "ticket_id": str(ticket_id),
                        "technician_id": str(technician_id),
                    },
                },
            )
    except Exception as e:
        logger.warning("Notification send failed (best-effort): %s", e)


@app.post("/api/v1/assignments", response_model=AssignmentResponse, status_code=201)
async def create_assignment(
    req: AssignmentCreateRequest,
    db: Session = Depends(get_db),
    x_user_id: str | None = Header(default=None),
    x_user_role: str | None = Header(default=None),
    request: Request = None,
):
    _require_role(x_user_role, {"admin"})
    user_id = _require_user_id(x_user_id)

    # Check if ticket exists and get subscriber_id
    subscriber_id = await _get_ticket_subscriber_id(db, req.ticket_id)

    # Check for existing active assignment
    existing = db.execute(
        select(TicketAssignment).where(
            TicketAssignment.ticket_id == req.ticket_id,
            TicketAssignment.status.in_(["assigned", "accepted", "in_progress"]),
        )
    ).scalar_one_or_none()
    if existing:
        raise HTTPException(status_code=409, detail="Ticket already has an active assignment")

    now = datetime.now(timezone.utc)
    assignment = TicketAssignment(
        ticket_id=req.ticket_id,
        subscriber_id=subscriber_id,
        technician_id=req.technician_id,
        status="assigned",
        assigned_by_user_id=user_id,
        notes=req.notes,
        assigned_at=now,
        updated_at=now,
    )
    db.add(assignment)
    db.commit()
    db.refresh(assignment)

    # Update ticket-service (best-effort)
    correlation_id = getattr(request.state, "correlation_id", str(uuid4()))
    await _update_ticket_assignment(req.ticket_id, req.technician_id, correlation_id)

    # Notify technician (best-effort)
    await _notify_job_assigned(req.technician_id, req.ticket_id, correlation_id)

    return _assignment_to_response(assignment)


@app.post("/api/v1/assignments/{assignment_id}/unassign", response_model=AssignmentResponse)
async def unassign(
    assignment_id: UUID,
    db: Session = Depends(get_db),
    x_user_id: str | None = Header(default=None),
    x_user_role: str | None = Header(default=None),
    request: Request = None,
):
    _require_role(x_user_role, {"admin"})
    _require_user_id(x_user_id)

    assignment = db.get(TicketAssignment, assignment_id)
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")

    now = datetime.now(timezone.utc)
    assignment.status = "unassigned"
    assignment.updated_at = now
    db.add(assignment)
    db.commit()
    db.refresh(assignment)

    # Update ticket-service (clear technician)
    correlation_id = getattr(request.state, "correlation_id", str(uuid4()))
    await _update_ticket_assignment(assignment.ticket_id, None, correlation_id)

    return _assignment_to_response(assignment)


@app.get("/api/v1/assignments/admin", response_model=AssignmentListResponse)
async def admin_list_assignments(
    db: Session = Depends(get_db),
    x_user_role: str | None = Header(default=None),
    technician_id: UUID | None = Query(default=None),
    status: str | None = Query(default=None),
    ticket_id: UUID | None = Query(default=None),
    date_from: datetime | None = Query(default=None),
    date_to: datetime | None = Query(default=None),
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
):
    _require_role(x_user_role, {"admin"})

    stmt = select(TicketAssignment)
    filters = []
    if technician_id:
        filters.append(TicketAssignment.technician_id == technician_id)
    if status:
        filters.append(TicketAssignment.status == status)
    if ticket_id:
        filters.append(TicketAssignment.ticket_id == ticket_id)
    if date_from:
        filters.append(TicketAssignment.assigned_at >= date_from)
    if date_to:
        filters.append(TicketAssignment.assigned_at <= date_to)
    if filters:
        stmt = stmt.where(and_(*filters))

    total = int(db.execute(select(func.count()).select_from(stmt.subquery())).scalar_one())
    rows = db.execute(stmt.order_by(TicketAssignment.assigned_at.desc()).limit(limit).offset(offset)).scalars().all()
    return AssignmentListResponse(items=[_assignment_to_response(a) for a in rows], total=total)


@app.get("/api/v1/assignments/me", response_model=AssignmentListResponse)
async def list_my_assignments(
    db: Session = Depends(get_db),
    x_user_id: str | None = Header(default=None),
    x_user_role: str | None = Header(default=None),
    status: str | None = Query(default=None),
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
):
    _require_role(x_user_role, {"technician"})
    technician_id = _require_user_id(x_user_id)

    stmt = select(TicketAssignment).where(TicketAssignment.technician_id == technician_id)
    if status:
        stmt = stmt.where(TicketAssignment.status == status)
    else:
        # Default: show active assignments (assigned, accepted, in_progress)
        stmt = stmt.where(TicketAssignment.status.in_(["assigned", "accepted", "in_progress"]))

    total = int(db.execute(select(func.count()).select_from(stmt.subquery())).scalar_one())
    rows = db.execute(stmt.order_by(TicketAssignment.assigned_at.desc()).limit(limit).offset(offset)).scalars().all()
    return AssignmentListResponse(items=[_assignment_to_response(a) for a in rows], total=total)


@app.post("/api/v1/assignments/{assignment_id}/accept", response_model=AssignmentResponse)
async def accept_assignment(
    assignment_id: UUID,
    db: Session = Depends(get_db),
    x_user_id: str | None = Header(default=None),
    x_user_role: str | None = Header(default=None),
    request: Request = None,
):
    _require_role(x_user_role, {"technician"})
    technician_id = _require_user_id(x_user_id)

    assignment = db.get(TicketAssignment, assignment_id)
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")
    if assignment.technician_id != technician_id:
        raise HTTPException(status_code=403, detail="Forbidden")
    if assignment.status != "assigned":
        raise HTTPException(status_code=400, detail="Assignment not in assigned status")

    now = datetime.now(timezone.utc)
    assignment.status = "accepted"
    assignment.updated_at = now
    db.add(assignment)
    db.commit()
    db.refresh(assignment)

    # Optional: trigger ticket status change assigned->in_progress
    # For now, we keep accept separate from start; technician will update ticket status separately
    # If you want accept==start, uncomment:
    # correlation_id = getattr(request.state, "correlation_id", str(uuid4()))
    # await _update_ticket_status_via_internal(assignment.ticket_id, "in_progress", correlation_id)

    return _assignment_to_response(assignment)


@app.post("/api/v1/assignments/{assignment_id}/reject", response_model=AssignmentResponse)
async def reject_assignment(
    assignment_id: UUID,
    db: Session = Depends(get_db),
    x_user_id: str | None = Header(default=None),
    x_user_role: str | None = Header(default=None),
    request: Request = None,
):
    _require_role(x_user_role, {"technician"})
    technician_id = _require_user_id(x_user_id)

    assignment = db.get(TicketAssignment, assignment_id)
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")
    if assignment.technician_id != technician_id:
        raise HTTPException(status_code=403, detail="Forbidden")
    if assignment.status not in {"assigned", "accepted"}:
        raise HTTPException(status_code=400, detail="Assignment not in assignable status")

    now = datetime.now(timezone.utc)
    assignment.status = "rejected"
    assignment.updated_at = now
    db.add(assignment)
    db.commit()
    db.refresh(assignment)

    # Clear technician assignment in ticket-service
    correlation_id = getattr(request.state, "correlation_id", str(uuid4()))
    await _update_ticket_assignment(assignment.ticket_id, None, correlation_id)

    return _assignment_to_response(assignment)


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        app,
        host="0.0.0.0",
        port=int(os.getenv("SERVICE_PORT", "8000")),
        log_level=LOG_LEVEL.lower(),
    )
