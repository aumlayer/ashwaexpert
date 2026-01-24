import json
import logging
import os
import time
from datetime import datetime, timezone
from datetime import timedelta
from uuid import UUID
from uuid import uuid4

from fastapi import Depends, FastAPI, Header, HTTPException, Query, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
from prometheus_client import CONTENT_TYPE_LATEST, Counter, Histogram, generate_latest
from sqlalchemy import and_, func, select, text
from sqlalchemy.orm import Session

from app.deps import get_db
from app.models import Ticket
from app.schemas import TicketCreateRequest, TicketListResponse, TicketResponse

SERVICE_NAME = os.getenv("SERVICE_NAME", "ticket-service")
SERVICE_VERSION = os.getenv("SERVICE_VERSION", "0.1.0")
ENVIRONMENT = os.getenv("ENVIRONMENT", "local")
LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO")
CORS_ORIGINS = os.getenv("CORS_ORIGINS", "*")

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
        created_at=t.created_at,
        updated_at=t.updated_at,
    )


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


@app.post("/api/v1/tickets", response_model=TicketResponse, status_code=status.HTTP_201_CREATED)
async def create_ticket(
    req: TicketCreateRequest,
    db: Session = Depends(get_db),
    x_user_id: str | None = Header(default=None),
    x_user_role: str | None = Header(default=None),
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
        created_at=now,
        updated_at=now,
    )
    db.add(t)
    db.commit()
    db.refresh(t)
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


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        app,
        host="0.0.0.0",
        port=int(os.getenv("SERVICE_PORT", "8000")),
        log_level=LOG_LEVEL.lower(),
    )
