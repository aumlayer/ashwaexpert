import json
import logging
import os
import time
from datetime import datetime, timezone
from uuid import UUID
from uuid import uuid4

from fastapi import Depends, FastAPI, Header, HTTPException, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
from prometheus_client import CONTENT_TYPE_LATEST, Counter, Histogram, generate_latest
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.deps import get_db
from app.models import Subscriber
from app.schemas import InternalCreateFromAuthRequest, SubscriberMeResponse, SubscriberUpdateRequest

SERVICE_NAME = os.getenv("SERVICE_NAME", "subscriber-service")
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


# Note: DB schema is created via Alembic migrations (see `scripts/migrate.sh`).


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
        raise HTTPException(status_code=401, detail="Missing user identity")
    try:
        return UUID(x_user_id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail="Invalid user id") from e


@app.get("/api/v1/subscribers/me", response_model=SubscriberMeResponse)
async def get_me(
    x_user_id: str | None = Header(default=None, alias="X-User-Id"),
    db: Session = Depends(get_db),
):
    user_id = _require_user_id(x_user_id)
    subscriber = db.execute(select(Subscriber).where(Subscriber.user_id == user_id)).scalar_one_or_none()
    if not subscriber:
        raise HTTPException(status_code=404, detail="Subscriber profile not found")
    return SubscriberMeResponse(
        id=subscriber.id,
        user_id=subscriber.user_id,
        first_name=subscriber.first_name,
        last_name=subscriber.last_name,
        email=subscriber.email,
        phone=subscriber.phone,
        company_name=subscriber.company_name,
        gst_number=subscriber.gst_number,
        pan_number=subscriber.pan_number,
        is_active=subscriber.is_active,
        created_at=subscriber.created_at,
        updated_at=subscriber.updated_at,
    )


@app.put("/api/v1/subscribers/me", response_model=SubscriberMeResponse)
async def update_me(
    req: SubscriberUpdateRequest,
    x_user_id: str | None = Header(default=None, alias="X-User-Id"),
    db: Session = Depends(get_db),
):
    user_id = _require_user_id(x_user_id)
    subscriber = db.execute(select(Subscriber).where(Subscriber.user_id == user_id)).scalar_one_or_none()
    if not subscriber:
        raise HTTPException(status_code=404, detail="Subscriber profile not found")

    for field, value in req.model_dump(exclude_unset=True).items():
        setattr(subscriber, field, value)
    subscriber.updated_at = datetime.now(timezone.utc)
    db.add(subscriber)
    db.commit()
    db.refresh(subscriber)
    return SubscriberMeResponse(
        id=subscriber.id,
        user_id=subscriber.user_id,
        first_name=subscriber.first_name,
        last_name=subscriber.last_name,
        email=subscriber.email,
        phone=subscriber.phone,
        company_name=subscriber.company_name,
        gst_number=subscriber.gst_number,
        pan_number=subscriber.pan_number,
        is_active=subscriber.is_active,
        created_at=subscriber.created_at,
        updated_at=subscriber.updated_at,
    )


@app.post("/api/v1/subscribers/internal/from-auth", status_code=status.HTTP_201_CREATED)
async def internal_create_from_auth(
    req: InternalCreateFromAuthRequest,
    x_internal_api_key: str | None = Header(default=None, alias="X-Internal-API-Key"),
    db: Session = Depends(get_db),
):
    expected = os.getenv("INTERNAL_API_KEY", "")
    if not expected or x_internal_api_key != expected:
        raise HTTPException(status_code=403, detail="Forbidden")

    existing = db.execute(select(Subscriber).where(Subscriber.user_id == req.user_id)).scalar_one_or_none()
    if existing:
        return {"id": str(existing.id), "message": "Already exists"}

    now = datetime.now(timezone.utc)
    subscriber = Subscriber(
        user_id=req.user_id,
        first_name=req.first_name or "Unknown",
        last_name=req.last_name or "Unknown",
        email=str(req.email),
        phone=req.phone,
        company_name=None,
        gst_number=None,
        pan_number=None,
        is_active=True,
        created_at=now,
        updated_at=now,
    )
    db.add(subscriber)
    db.commit()
    db.refresh(subscriber)
    return {"id": str(subscriber.id)}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        app,
        host="0.0.0.0",
        port=int(os.getenv("SERVICE_PORT", "8000")),
        log_level=LOG_LEVEL.lower(),
    )
