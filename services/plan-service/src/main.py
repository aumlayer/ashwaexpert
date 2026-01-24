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
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.deps import get_db
from app.models import Plan
from app.schemas import PlanCreateRequest, PlanListResponse, PlanResponse, PlanUpdateRequest

SERVICE_NAME = os.getenv("SERVICE_NAME", "plan-service")
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


def _require_admin(x_user_role: str | None) -> None:
    if (x_user_role or "") != "admin":
        raise HTTPException(status_code=403, detail="Forbidden")


def _plan_to_response(p: Plan) -> PlanResponse:
    return PlanResponse(
        id=p.id,
        plan_code=p.plan_code,
        name=p.name,
        category=p.category,  # type: ignore[arg-type]
        billing_period=p.billing_period,  # type: ignore[arg-type]
        price_amount=float(p.price_amount),
        price_currency=p.price_currency,
        trial_days=p.trial_days,
        active=p.active,
        limits=p.limits,
        created_at=p.created_at,
        updated_at=p.updated_at,
    )


@app.get("/api/v1/plans", response_model=PlanListResponse)
async def list_plans(
    db: Session = Depends(get_db),
    active: bool | None = Query(default=True),
    category: str | None = Query(default=None),
    billing_period: str | None = Query(default=None),
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=20, ge=1, le=100),
):
    stmt = select(Plan)
    count_stmt = select(func.count()).select_from(Plan)
    if active is not None:
        stmt = stmt.where(Plan.active.is_(active))
        count_stmt = count_stmt.where(Plan.active.is_(active))
    if category:
        stmt = stmt.where(Plan.category == category)
        count_stmt = count_stmt.where(Plan.category == category)
    if billing_period:
        stmt = stmt.where(Plan.billing_period == billing_period)
        count_stmt = count_stmt.where(Plan.billing_period == billing_period)

    total = int(db.execute(count_stmt).scalar_one())
    rows = (
        db.execute(stmt.order_by(Plan.created_at.desc()).offset((page - 1) * limit).limit(limit))
        .scalars()
        .all()
    )
    return PlanListResponse(items=[_plan_to_response(p) for p in rows], total=total)


@app.get("/api/v1/plans/{plan_id}", response_model=PlanResponse)
async def get_plan(plan_id: UUID, db: Session = Depends(get_db)):
    p = db.get(Plan, plan_id)
    if not p:
        raise HTTPException(status_code=404, detail="Plan not found")
    return _plan_to_response(p)


@app.post("/api/v1/plans", response_model=PlanResponse, status_code=status.HTTP_201_CREATED)
async def create_plan(
    req: PlanCreateRequest,
    db: Session = Depends(get_db),
    x_user_role: str | None = Header(default=None),
):
    _require_admin(x_user_role)
    existing = db.execute(select(Plan).where(Plan.plan_code == req.plan_code)).scalar_one_or_none()
    if existing:
        raise HTTPException(status_code=409, detail="Plan code already exists")
    now = datetime.now(timezone.utc)
    p = Plan(
        plan_code=req.plan_code,
        name=req.name,
        category=req.category,
        billing_period=req.billing_period,
        price_amount=req.price_amount,
        price_currency=req.price_currency,
        trial_days=req.trial_days,
        active=req.active,
        limits=req.limits,
        created_at=now,
        updated_at=now,
    )
    db.add(p)
    db.commit()
    db.refresh(p)
    return _plan_to_response(p)


@app.patch("/api/v1/plans/{plan_id}", response_model=PlanResponse)
async def update_plan(
    plan_id: UUID,
    req: PlanUpdateRequest,
    db: Session = Depends(get_db),
    x_user_role: str | None = Header(default=None),
):
    _require_admin(x_user_role)
    p = db.get(Plan, plan_id)
    if not p:
        raise HTTPException(status_code=404, detail="Plan not found")
    if req.name is not None:
        p.name = req.name
    if req.price_amount is not None:
        p.price_amount = req.price_amount
    if req.trial_days is not None:
        p.trial_days = req.trial_days
    if req.active is not None:
        p.active = req.active
    if req.limits is not None:
        p.limits = req.limits
    p.updated_at = datetime.now(timezone.utc)
    db.add(p)
    db.commit()
    db.refresh(p)
    return _plan_to_response(p)


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        app,
        host="0.0.0.0",
        port=int(os.getenv("SERVICE_PORT", "8000")),
        log_level=LOG_LEVEL.lower(),
    )
