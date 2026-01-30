import json
import logging
import os
import time
from datetime import datetime, timezone
from uuid import uuid4

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
from prometheus_client import CONTENT_TYPE_LATEST, Counter, Histogram, generate_latest
from sqlalchemy import select

from app.routers.auth import router as auth_router
from app.deps import get_session_factory
from app.models import User
from app.security import hash_password

SERVICE_NAME = os.getenv("SERVICE_NAME", "auth-service")
SERVICE_VERSION = os.getenv("SERVICE_VERSION", "0.1.0")
ENVIRONMENT = os.getenv("ENVIRONMENT", "local")
LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO")
CORS_ORIGINS = os.getenv("CORS_ORIGINS", "*")
ENABLE_CORS = os.getenv("ENABLE_CORS", "false").lower() in ("1", "true", "yes")

logging.basicConfig(level=LOG_LEVEL, format="%(message)s")
logger = logging.getLogger(SERVICE_NAME)

app = FastAPI(title=SERVICE_NAME, version=SERVICE_VERSION)

if ENABLE_CORS:
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


app.include_router(auth_router)


def _seed_demo_users_if_needed() -> None:
    if ENVIRONMENT != "local":
        return

    if os.getenv("SEED_DEMO_USERS", "true").lower() not in {"1", "true", "yes"}:
        return

    session_factory = get_session_factory()
    now = datetime.now(timezone.utc)

    demo_users = [
        {
            "email": "admin@example.com",
            "role": "admin",
            "can_assign_leads": True,
            "can_manage_unassigned_leads": True,
        },
        {
            "email": "subscriber@example.com",
            "role": "subscriber",
            "can_assign_leads": False,
            "can_manage_unassigned_leads": False,
        },
        {
            "email": "technician@example.com",
            "role": "technician",
            "can_assign_leads": False,
            "can_manage_unassigned_leads": False,
        },
    ]

    db = session_factory()
    try:
        for u in demo_users:
            existing = db.execute(select(User).where(User.email == u["email"])).scalar_one_or_none()
            if existing:
                continue

            user = User(
                email=u["email"],
                phone=None,
                password_hash=hash_password("password123"),
                is_active=True,
                is_verified=True,
                role=u["role"],
                subscriber_id=None,
                can_assign_leads=bool(u["can_assign_leads"]),
                can_manage_unassigned_leads=bool(u["can_manage_unassigned_leads"]),
                created_at=now,
                updated_at=now,
                last_login_at=None,
            )
            db.add(user)

        db.commit()
    finally:
        db.close()


@app.on_event("startup")
def _on_startup() -> None:
    _seed_demo_users_if_needed()


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


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        app,
        host="0.0.0.0",
        port=int(os.getenv("SERVICE_PORT", "8000")),
        log_level=LOG_LEVEL.lower(),
    )
