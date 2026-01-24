import json
import logging
import os
import time
from datetime import datetime, timezone
from uuid import UUID
from uuid import uuid4

from fastapi import Depends, FastAPI, Header, HTTPException, Query, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
from prometheus_client import CONTENT_TYPE_LATEST, Counter, Histogram, generate_latest
from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session

from app.deps import get_db
from app.models import Lead, LeadActivity
from app.schemas import (
    CreateLeadRequest,
    LeadActivityCreateRequest,
    LeadActivityListResponse,
    LeadActivityResponse,
    LeadAssignRequest,
    LeadListResponse,
    LeadResponse,
    LeadStatusUpdateRequest,
)

SERVICE_NAME = os.getenv("SERVICE_NAME", "lead-service")
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


def _parse_user_id(x_user_id: str | None) -> UUID | None:
    if not x_user_id:
        return None
    try:
        return UUID(x_user_id)
    except Exception:
        return None


def _parse_bool_header(val: str | None) -> bool:
    return str(val or "").strip().lower() in {"1", "true", "yes", "y"}


def _allowed_next_statuses(current: str) -> set[str]:
    # Domain-friendly lead lifecycle (rentals/services/AMC)
    transitions: dict[str, set[str]] = {
        "new": {"contacted", "closed_lost"},
        "contacted": {"qualified", "on_hold", "closed_lost"},
        "qualified": {"proposal", "scheduled_visit", "on_hold", "closed_lost"},
        "proposal": {"scheduled_visit", "on_hold", "closed_won", "closed_lost"},
        "scheduled_visit": {"in_progress", "on_hold", "closed_won", "closed_lost"},
        "in_progress": {"on_hold", "closed_won", "closed_lost"},
        "on_hold": {
            "contacted",
            "qualified",
            "proposal",
            "scheduled_visit",
            "in_progress",
            "closed_lost",
        },
        "closed_won": set(),
        "closed_lost": set(),
    }
    return transitions.get(current, set())


def _can_manage_lead(
    *,
    actor_role: str,
    actor_id: UUID,
    lead: Lead,
    can_manage_unassigned_leads: bool,
) -> bool:
    if actor_role == "admin":
        return True
    if lead.assigned_to and lead.assigned_to == actor_id:
        return True
    if can_manage_unassigned_leads:
        return True
    return False


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


@app.post("/api/v1/leads", response_model=LeadResponse, status_code=201)
async def create_lead(req: CreateLeadRequest, db: Session = Depends(get_db)):
    now = datetime.now(timezone.utc)
    lead = Lead(
        name=req.name,
        email=str(req.email),
        phone=req.phone,
        company=req.company,
        customer_type=req.customer_type,
        service_category=req.service_category,
        state=req.state,
        city=req.city,
        locality=req.locality,
        preferred_datetime=req.preferred_datetime,
        appliance_category=req.appliance_category,
        appliance_brand=req.appliance_brand,
        appliance_model=req.appliance_model,
        urgency=req.urgency,
        preferred_contact_method=req.preferred_contact_method,
        message=req.message,
        source=req.source,
        status="new",
        priority="medium",
        assigned_to=None,
        created_at=now,
        updated_at=now,
        closed_at=None,
    )
    db.add(lead)
    db.commit()
    db.refresh(lead)

    activity = LeadActivity(
        lead_id=lead.id,
        activity_type="created",
        description="Lead created",
        performed_by=None,
        created_at=now,
    )
    db.add(activity)
    db.commit()

    return LeadResponse(
        id=lead.id,
        name=lead.name,
        email=lead.email,  # type: ignore[arg-type]
        phone=lead.phone,
        company=lead.company,
        customer_type=lead.customer_type,  # type: ignore[arg-type]
        service_category=lead.service_category,  # type: ignore[arg-type]
        state=lead.state,
        city=lead.city,
        locality=lead.locality,
        preferred_datetime=lead.preferred_datetime,
        appliance_category=lead.appliance_category,  # type: ignore[arg-type]
        appliance_brand=lead.appliance_brand,
        appliance_model=lead.appliance_model,
        urgency=lead.urgency,  # type: ignore[arg-type]
        preferred_contact_method=lead.preferred_contact_method,  # type: ignore[arg-type]
        message=lead.message,
        source=lead.source,  # type: ignore[arg-type]
        status=lead.status,  # type: ignore[arg-type]
        priority=lead.priority,  # type: ignore[arg-type]
        assigned_to=lead.assigned_to,
        created_at=lead.created_at,
        updated_at=lead.updated_at,
    )


@app.get("/api/v1/leads/{lead_id}", response_model=LeadResponse)
async def get_lead(lead_id: UUID, db: Session = Depends(get_db)):
    lead = db.get(Lead, lead_id)
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
    return LeadResponse(
        id=lead.id,
        name=lead.name,
        email=lead.email,  # type: ignore[arg-type]
        phone=lead.phone,
        company=lead.company,
        customer_type=lead.customer_type,  # type: ignore[arg-type]
        service_category=lead.service_category,  # type: ignore[arg-type]
        state=lead.state,
        city=lead.city,
        locality=lead.locality,
        preferred_datetime=lead.preferred_datetime,
        appliance_category=lead.appliance_category,  # type: ignore[arg-type]
        appliance_brand=lead.appliance_brand,
        appliance_model=lead.appliance_model,
        urgency=lead.urgency,  # type: ignore[arg-type]
        preferred_contact_method=lead.preferred_contact_method,  # type: ignore[arg-type]
        message=lead.message,
        source=lead.source,  # type: ignore[arg-type]
        status=lead.status,  # type: ignore[arg-type]
        priority=lead.priority,  # type: ignore[arg-type]
        assigned_to=lead.assigned_to,
        created_at=lead.created_at,
        updated_at=lead.updated_at,
    )


@app.patch("/api/v1/leads/{lead_id}/assign", response_model=LeadResponse)
async def assign_lead(
    lead_id: UUID,
    req: LeadAssignRequest,
    db: Session = Depends(get_db),
    x_user_id: str | None = Header(default=None),
    x_user_role: str | None = Header(default=None),
    x_can_assign_leads: str | None = Header(default=None),
):
    actor_id = _parse_user_id(x_user_id)
    if not actor_id:
        raise HTTPException(status_code=400, detail="Missing or invalid X-User-Id")
    role = str(x_user_role or "")
    can_assign = _parse_bool_header(x_can_assign_leads)
    if role != "admin" and not can_assign:
        raise HTTPException(status_code=403, detail="Forbidden")

    lead = db.get(Lead, lead_id)
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")

    now = datetime.now(timezone.utc)
    lead.assigned_to = req.assigned_to
    lead.updated_at = now
    db.add(lead)

    desc = f"Assigned to {req.assigned_to}" if req.assigned_to else "Unassigned lead"
    db.add(
        LeadActivity(
            lead_id=lead.id,
            activity_type="assigned",
            description=desc,
            performed_by=actor_id,
            created_at=now,
        )
    )
    db.commit()
    db.refresh(lead)

    return LeadResponse(
        id=lead.id,
        name=lead.name,
        email=lead.email,  # type: ignore[arg-type]
        phone=lead.phone,
        company=lead.company,
        customer_type=lead.customer_type,  # type: ignore[arg-type]
        service_category=lead.service_category,  # type: ignore[arg-type]
        state=lead.state,
        city=lead.city,
        locality=lead.locality,
        preferred_datetime=lead.preferred_datetime,
        appliance_category=lead.appliance_category,  # type: ignore[arg-type]
        appliance_brand=lead.appliance_brand,
        appliance_model=lead.appliance_model,
        urgency=lead.urgency,  # type: ignore[arg-type]
        preferred_contact_method=lead.preferred_contact_method,  # type: ignore[arg-type]
        message=lead.message,
        source=lead.source,  # type: ignore[arg-type]
        status=lead.status,  # type: ignore[arg-type]
        priority=lead.priority,  # type: ignore[arg-type]
        assigned_to=lead.assigned_to,
        created_at=lead.created_at,
        updated_at=lead.updated_at,
    )


@app.patch("/api/v1/leads/{lead_id}/status", response_model=LeadResponse)
async def update_lead_status(
    lead_id: UUID,
    req: LeadStatusUpdateRequest,
    db: Session = Depends(get_db),
    x_user_id: str | None = Header(default=None),
    x_user_role: str | None = Header(default=None),
    x_can_manage_unassigned_leads: str | None = Header(default=None),
):
    actor_id = _parse_user_id(x_user_id)
    if not actor_id:
        raise HTTPException(status_code=400, detail="Missing or invalid X-User-Id")

    lead = db.get(Lead, lead_id)
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")

    role = str(x_user_role or "")
    can_manage_unassigned = _parse_bool_header(x_can_manage_unassigned_leads)
    if not _can_manage_lead(
        actor_role=role,
        actor_id=actor_id,
        lead=lead,
        can_manage_unassigned_leads=can_manage_unassigned,
    ):
        raise HTTPException(status_code=403, detail="Forbidden")

    allowed_next = _allowed_next_statuses(str(lead.status))
    if req.status != lead.status and req.status not in allowed_next:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid status transition: {lead.status} -> {req.status}",
        )

    now = datetime.now(timezone.utc)
    old_status = lead.status
    lead.status = req.status
    lead.updated_at = now
    if req.status in {"closed_won", "closed_lost"}:
        lead.closed_at = now
    else:
        lead.closed_at = None
    db.add(lead)

    db.add(
        LeadActivity(
            lead_id=lead.id,
            activity_type="status_changed",
            description=f"Status changed: {old_status} -> {req.status}",
            performed_by=actor_id,
            created_at=now,
        )
    )
    db.commit()
    db.refresh(lead)

    return LeadResponse(
        id=lead.id,
        name=lead.name,
        email=lead.email,  # type: ignore[arg-type]
        phone=lead.phone,
        company=lead.company,
        customer_type=lead.customer_type,  # type: ignore[arg-type]
        service_category=lead.service_category,  # type: ignore[arg-type]
        state=lead.state,
        city=lead.city,
        locality=lead.locality,
        preferred_datetime=lead.preferred_datetime,
        appliance_category=lead.appliance_category,  # type: ignore[arg-type]
        appliance_brand=lead.appliance_brand,
        appliance_model=lead.appliance_model,
        urgency=lead.urgency,  # type: ignore[arg-type]
        preferred_contact_method=lead.preferred_contact_method,  # type: ignore[arg-type]
        message=lead.message,
        source=lead.source,  # type: ignore[arg-type]
        status=lead.status,  # type: ignore[arg-type]
        priority=lead.priority,  # type: ignore[arg-type]
        assigned_to=lead.assigned_to,
        created_at=lead.created_at,
        updated_at=lead.updated_at,
    )


@app.post(
    "/api/v1/leads/{lead_id}/activities",
    response_model=LeadActivityResponse,
    status_code=status.HTTP_201_CREATED,
)
async def add_lead_activity(
    lead_id: UUID,
    req: LeadActivityCreateRequest,
    db: Session = Depends(get_db),
    x_user_id: str | None = Header(default=None),
    x_user_role: str | None = Header(default=None),
    x_can_manage_unassigned_leads: str | None = Header(default=None),
):
    actor_id = _parse_user_id(x_user_id)
    if not actor_id:
        raise HTTPException(status_code=400, detail="Missing or invalid X-User-Id")

    lead = db.get(Lead, lead_id)
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")

    role = str(x_user_role or "")
    can_manage_unassigned = _parse_bool_header(x_can_manage_unassigned_leads)
    if not _can_manage_lead(
        actor_role=role,
        actor_id=actor_id,
        lead=lead,
        can_manage_unassigned_leads=can_manage_unassigned,
    ):
        raise HTTPException(status_code=403, detail="Forbidden")

    now = datetime.now(timezone.utc)
    act = LeadActivity(
        lead_id=lead.id,
        activity_type=req.activity_type,
        description=req.description,
        performed_by=actor_id,
        created_at=now,
    )
    db.add(act)
    lead.updated_at = now
    db.add(lead)
    db.commit()
    db.refresh(act)

    return LeadActivityResponse(
        id=act.id,
        lead_id=act.lead_id,
        activity_type=act.activity_type,  # type: ignore[arg-type]
        description=act.description,
        performed_by=act.performed_by,
        created_at=act.created_at,
    )


@app.get("/api/v1/leads/{lead_id}/activities", response_model=LeadActivityListResponse)
async def list_lead_activities(
    lead_id: UUID,
    db: Session = Depends(get_db),
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=20, ge=1, le=100),
):
    lead = db.get(Lead, lead_id)
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")

    stmt = select(LeadActivity).where(LeadActivity.lead_id == lead_id)
    count_stmt = select(func.count()).select_from(LeadActivity).where(LeadActivity.lead_id == lead_id)
    total = int(db.execute(count_stmt).scalar_one())

    stmt = stmt.order_by(LeadActivity.created_at.desc()).offset((page - 1) * limit).limit(limit)
    rows = db.execute(stmt).scalars().all()
    items = [
        LeadActivityResponse(
            id=a.id,
            lead_id=a.lead_id,
            activity_type=a.activity_type,  # type: ignore[arg-type]
            description=a.description,
            performed_by=a.performed_by,
            created_at=a.created_at,
        )
        for a in rows
    ]
    return LeadActivityListResponse(items=items, total=total, page=page, limit=limit)


@app.get("/api/v1/leads", response_model=LeadListResponse)
async def list_leads(
    db: Session = Depends(get_db),
    status: str | None = Query(default=None),
    source: str | None = Query(default=None),
    assigned_to: UUID | None = Query(default=None),
    q: str | None = Query(default=None, description="Search by name/email/company/phone"),
    customer_type: str | None = Query(default=None),
    service_category: str | None = Query(default=None),
    state: str | None = Query(default=None),
    city: str | None = Query(default=None),
    locality: str | None = Query(default=None),
    appliance_category: str | None = Query(default=None),
    urgency: str | None = Query(default=None),
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=20, ge=1, le=100),
):
    stmt = select(Lead)
    count_stmt = select(func.count()).select_from(Lead)

    if status:
        stmt = stmt.where(Lead.status == status)
        count_stmt = count_stmt.where(Lead.status == status)
    if source:
        stmt = stmt.where(Lead.source == source)
        count_stmt = count_stmt.where(Lead.source == source)
    if assigned_to:
        stmt = stmt.where(Lead.assigned_to == assigned_to)
        count_stmt = count_stmt.where(Lead.assigned_to == assigned_to)
    if q:
        like = f"%{q}%"
        stmt = stmt.where(
            or_(
                Lead.name.ilike(like),
                Lead.email.ilike(like),
                Lead.company.ilike(like),
                Lead.phone.ilike(like),
            )
        )
        count_stmt = count_stmt.where(
            or_(
                Lead.name.ilike(like),
                Lead.email.ilike(like),
                Lead.company.ilike(like),
                Lead.phone.ilike(like),
            )
        )
    if customer_type:
        stmt = stmt.where(Lead.customer_type == customer_type)
        count_stmt = count_stmt.where(Lead.customer_type == customer_type)
    if service_category:
        stmt = stmt.where(Lead.service_category == service_category)
        count_stmt = count_stmt.where(Lead.service_category == service_category)
    if state:
        stmt = stmt.where(Lead.state == state)
        count_stmt = count_stmt.where(Lead.state == state)
    if city:
        stmt = stmt.where(Lead.city == city)
        count_stmt = count_stmt.where(Lead.city == city)
    if locality:
        stmt = stmt.where(Lead.locality == locality)
        count_stmt = count_stmt.where(Lead.locality == locality)
    if appliance_category:
        stmt = stmt.where(Lead.appliance_category == appliance_category)
        count_stmt = count_stmt.where(Lead.appliance_category == appliance_category)
    if urgency:
        stmt = stmt.where(Lead.urgency == urgency)
        count_stmt = count_stmt.where(Lead.urgency == urgency)

    total = int(db.execute(count_stmt).scalar_one())
    stmt = stmt.order_by(Lead.created_at.desc()).offset((page - 1) * limit).limit(limit)
    rows = db.execute(stmt).scalars().all()

    items = [
        LeadResponse(
            id=l.id,
            name=l.name,
            email=l.email,  # type: ignore[arg-type]
            phone=l.phone,
            company=l.company,
            customer_type=l.customer_type,  # type: ignore[arg-type]
            service_category=l.service_category,  # type: ignore[arg-type]
            state=l.state,
            city=l.city,
            locality=l.locality,
            preferred_datetime=l.preferred_datetime,
            appliance_category=l.appliance_category,  # type: ignore[arg-type]
            appliance_brand=l.appliance_brand,
            appliance_model=l.appliance_model,
            urgency=l.urgency,  # type: ignore[arg-type]
            preferred_contact_method=l.preferred_contact_method,  # type: ignore[arg-type]
            message=l.message,
            source=l.source,  # type: ignore[arg-type]
            status=l.status,  # type: ignore[arg-type]
            priority=l.priority,  # type: ignore[arg-type]
            assigned_to=l.assigned_to,
            created_at=l.created_at,
            updated_at=l.updated_at,
        )
        for l in rows
    ]

    return LeadListResponse(items=items, total=total, page=page, limit=limit)


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        app,
        host="0.0.0.0",
        port=int(os.getenv("SERVICE_PORT", "8000")),
        log_level=LOG_LEVEL.lower(),
    )
