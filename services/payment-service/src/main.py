import json
import logging
import os
import time
from datetime import datetime, timezone
from uuid import UUID
from uuid import uuid4

import httpx
from fastapi import Depends, FastAPI, Header, HTTPException, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
from prometheus_client import CONTENT_TYPE_LATEST, Counter, Histogram, generate_latest
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.deps import get_db
from app.models import PaymentGatewayConfig, PaymentIntent
from app.schemas import (
    GatewayConfigResponse,
    GatewayConfigUpsertRequest,
    InternalCreateIntentRequest,
    MockWebhookRequest,
    PaymentInitiateResponse,
    PaymentIntentResponse,
)

SERVICE_NAME = os.getenv("SERVICE_NAME", "payment-service")
SERVICE_VERSION = os.getenv("SERVICE_VERSION", "0.1.0")
ENVIRONMENT = os.getenv("ENVIRONMENT", "local")
LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO")
CORS_ORIGINS = os.getenv("CORS_ORIGINS", "*")
SUBSCRIPTION_SERVICE_URL = os.getenv("SUBSCRIPTION_SERVICE_URL", "")
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


@app.get("/metrics")
async def metrics() -> Response:
    return Response(generate_latest(), media_type=CONTENT_TYPE_LATEST)


def _require_internal(x_internal_api_key: str | None) -> None:
    if not INTERNAL_API_KEY or x_internal_api_key != INTERNAL_API_KEY:
        raise HTTPException(status_code=401, detail="Invalid internal key")


def _require_admin(x_user_role: str | None) -> None:
    if (x_user_role or "") != "admin":
        raise HTTPException(status_code=403, detail="Forbidden")


def _require_user_id(x_user_id: str | None) -> UUID:
    if not x_user_id:
        raise HTTPException(status_code=401, detail="Missing X-User-Id")
    try:
        return UUID(x_user_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid X-User-Id")


def _intent_to_response(i: PaymentIntent) -> PaymentIntentResponse:
    return PaymentIntentResponse(
        id=i.id,
        user_id=i.user_id,
        reference_type=i.reference_type,
        reference_id=i.reference_id,
        amount=float(i.amount),
        currency=i.currency,
        status=i.status,  # type: ignore[arg-type]
        provider=i.provider,
        created_at=i.created_at,
        updated_at=i.updated_at,
    )


@app.post("/api/v1/payments/internal/intents", response_model=PaymentIntentResponse, status_code=status.HTTP_201_CREATED)
async def internal_create_intent(
    req: InternalCreateIntentRequest,
    db: Session = Depends(get_db),
    x_internal_api_key: str | None = Header(default=None, alias="X-Internal-API-Key"),
):
    _require_internal(x_internal_api_key)
    now = datetime.now(timezone.utc)
    intent = PaymentIntent(
        user_id=req.user_id,
        reference_type=req.reference_type,
        reference_id=req.reference_id,
        amount=req.amount,
        currency=req.currency,
        status="created",
        provider="mock",
        meta=req.meta,
        created_at=now,
        updated_at=now,
    )
    db.add(intent)
    db.commit()
    db.refresh(intent)
    return _intent_to_response(intent)


@app.get("/api/v1/payments/admin/gateway-config", response_model=GatewayConfigResponse)
async def admin_get_gateway_config(
    db: Session = Depends(get_db),
    x_user_role: str | None = Header(default=None),
):
    _require_admin(x_user_role)
    row = (
        db.execute(select(PaymentGatewayConfig).where(PaymentGatewayConfig.is_active.is_(True)))
        .scalars()
        .first()
    )
    if not row:
        now = datetime.now(timezone.utc)
        row = PaymentGatewayConfig(provider="mock", mode="sandbox", is_active=True, credentials=None, updated_at=now)
        db.add(row)
        db.commit()
        db.refresh(row)
    return GatewayConfigResponse(
        provider=row.provider,  # type: ignore[arg-type]
        mode=row.mode,  # type: ignore[arg-type]
        is_active=bool(row.is_active),
        updated_at=row.updated_at,
    )


@app.put("/api/v1/payments/admin/gateway-config", response_model=GatewayConfigResponse)
async def admin_upsert_gateway_config(
    req: GatewayConfigUpsertRequest,
    db: Session = Depends(get_db),
    x_user_role: str | None = Header(default=None),
):
    _require_admin(x_user_role)
    now = datetime.now(timezone.utc)
    # Deactivate all
    for cfg in db.execute(select(PaymentGatewayConfig)).scalars().all():
        cfg.is_active = False
        cfg.updated_at = now
        db.add(cfg)

    # Create new active config
    active = PaymentGatewayConfig(
        provider=req.provider,
        mode=req.mode,
        is_active=True,
        credentials=req.credentials,
        updated_at=now,
    )
    db.add(active)
    db.commit()
    db.refresh(active)
    return GatewayConfigResponse(
        provider=active.provider,  # type: ignore[arg-type]
        mode=active.mode,  # type: ignore[arg-type]
        is_active=bool(active.is_active),
        updated_at=active.updated_at,
    )


@app.post("/api/v1/payments/me/intents/{intent_id}/initiate", response_model=PaymentInitiateResponse)
async def initiate_payment(
    intent_id: UUID,
    db: Session = Depends(get_db),
    x_user_id: str | None = Header(default=None),
    x_user_role: str | None = Header(default=None),
):
    if (x_user_role or "") != "subscriber":
        raise HTTPException(status_code=403, detail="Forbidden")
    user_id = _require_user_id(x_user_id)
    intent = db.get(PaymentIntent, intent_id)
    if not intent or intent.user_id != user_id:
        raise HTTPException(status_code=404, detail="Payment intent not found")
    if intent.status != "created":
        raise HTTPException(status_code=400, detail="Payment intent not in created state")

    cfg = (
        db.execute(select(PaymentGatewayConfig).where(PaymentGatewayConfig.is_active.is_(True)))
        .scalars()
        .first()
    )
    provider = (cfg.provider if cfg else "mock") or "mock"
    mode = (cfg.mode if cfg else "sandbox") or "sandbox"

    # Provider-specific initiation scaffold. Real SDK integration will fill these.
    if provider == "cashfree":
        payload = {
            "provider": "cashfree",
            "mode": mode,
            "amount": float(intent.amount),
            "currency": intent.currency,
            "reference_id": intent.reference_id,
        }
        note = "Cashfree initiation scaffold (configure keys in admin; SDK integration pending)."
    elif provider == "razorpay":
        payload = {
            "provider": "razorpay",
            "mode": mode,
            "amount": float(intent.amount),
            "currency": intent.currency,
            "reference_id": intent.reference_id,
        }
        note = "Razorpay initiation scaffold (configure keys in admin; SDK integration pending)."
    else:
        payload = {
            "provider": "mock",
            "mode": "sandbox",
            "next_action": "Call /api/v1/payments/webhooks/mock with intent_id to simulate payment",
        }
        note = "Mock gateway selected."

    # Persist chosen provider on intent for visibility
    intent.provider = provider
    intent.updated_at = datetime.now(timezone.utc)
    db.add(intent)
    db.commit()

    return PaymentInitiateResponse(
        intent_id=intent.id,
        provider=provider,  # type: ignore[arg-type]
        mode=mode,  # type: ignore[arg-type]
        checkout_payload=payload,
        note=note,
    )


@app.post("/api/v1/payments/webhooks/mock", response_model=PaymentIntentResponse)
async def mock_webhook(
    req: MockWebhookRequest,
    db: Session = Depends(get_db),
):
    # Local-dev helper endpoint to simulate provider callbacks.
    intent = db.get(PaymentIntent, req.intent_id)
    if not intent:
        raise HTTPException(status_code=404, detail="Payment intent not found")
    intent.status = req.status
    intent.updated_at = datetime.now(timezone.utc)
    db.add(intent)
    db.commit()
    db.refresh(intent)

    # Notify subscription-service if this intent belongs to an order.
    if (
        intent.status == "paid"
        and intent.reference_type == "subscription_order"
        and SUBSCRIPTION_SERVICE_URL
        and INTERNAL_API_KEY
    ):
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                await client.post(
                    f"{SUBSCRIPTION_SERVICE_URL}/api/v1/subscriptions/internal/orders/{intent.reference_id}/mark-paid",
                    headers={"X-Internal-API-Key": INTERNAL_API_KEY},
                    json={"payment_intent_id": str(intent.id)},
                )
        except Exception:
            # Best-effort (idempotent call on subscription-service side)
            pass

    return _intent_to_response(intent)


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        app,
        host="0.0.0.0",
        port=int(os.getenv("SERVICE_PORT", "8000")),
        log_level=LOG_LEVEL.lower(),
    )
