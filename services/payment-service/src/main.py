import base64
import hashlib
import hmac
import json
import logging
import os
import time
from datetime import datetime, timezone
from typing import Optional
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
from app.models import PaymentAttempt, PaymentGatewayConfig, PaymentIntent, PaymentWebhookEvent
from app.schemas import (
    GatewayOrderCreateRequest,
    GatewayOrderCreateResponse,
    GatewayConfigResponse,
    GatewayConfigUpsertRequest,
    InternalCreateIntentRequest,
    MockWebhookRequest,
    OfflineMarkOrderPaidRequest,
    PaymentInitiateResponse,
    PaymentIntentResponse,
    RetryRequest,
)

SERVICE_NAME = os.getenv("SERVICE_NAME", "payment-service")
SERVICE_VERSION = os.getenv("SERVICE_VERSION", "0.1.0")
ENVIRONMENT = os.getenv("ENVIRONMENT", "local")
LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO")
CORS_ORIGINS = os.getenv("CORS_ORIGINS", "*")
SUBSCRIPTION_SERVICE_URL = os.getenv("SUBSCRIPTION_SERVICE_URL", "")
BILLING_SERVICE_URL = os.getenv("BILLING_SERVICE_URL", "")
INTERNAL_API_KEY = os.getenv("INTERNAL_API_KEY", "")
CASHFREE_WEBHOOK_SECRET = os.getenv("CASHFREE_WEBHOOK_SECRET", "")
CASHFREE_API_BASE = os.getenv("CASHFREE_API_BASE", "")
RECONCILE_PENDING_SECONDS = int(os.getenv("RECONCILE_PENDING_SECONDS", "900"))

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


def _require_internal(x_internal_api_key: Optional[str]) -> None:
    if not INTERNAL_API_KEY or x_internal_api_key != INTERNAL_API_KEY:
        raise HTTPException(status_code=401, detail="Invalid internal key")


def _require_admin(x_user_role: Optional[str]) -> None:
    if (x_user_role or "") != "admin":
        raise HTTPException(status_code=403, detail="Forbidden")


def _require_user_id(x_user_id: Optional[str]) -> UUID:
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
    x_internal_api_key: Optional[str] = Header(default=None, alias="X-Internal-API-Key"),
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
    x_user_role: Optional[str] = Header(default=None),
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
    x_user_role: Optional[str] = Header(default=None),
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
    x_user_id: Optional[str] = Header(default=None),
    x_user_role: Optional[str] = Header(default=None),
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


from typing import Optional


def _active_gateway(db: Session) -> Optional[PaymentGatewayConfig]:
    return (
        db.execute(select(PaymentGatewayConfig).where(PaymentGatewayConfig.is_active.is_(True)))
        .scalars()
        .first()
    )


def _cashfree_base_url(cfg: Optional[PaymentGatewayConfig]) -> str:
    if CASHFREE_API_BASE:
        return CASHFREE_API_BASE.rstrip("/")
    creds = (cfg.credentials or {}) if cfg else {}
    base = str(creds.get("api_base") or "").strip()
    if base:
        return base.rstrip("/")
    mode = (cfg.mode if cfg else "sandbox") or "sandbox"
    host = "https://sandbox.cashfree.com" if mode == "sandbox" else "https://api.cashfree.com"
    return f"{host}/pg"


def _cashfree_headers(cfg: PaymentGatewayConfig) -> dict[str, str]:
    creds = cfg.credentials or {}
    client_id = str(creds.get("client_id") or creds.get("app_id") or "")
    client_secret = str(creds.get("client_secret") or creds.get("secret_key") or "")
    api_version = str(creds.get("api_version") or "2022-09-01")
    if not client_id or not client_secret:
        raise HTTPException(status_code=400, detail="Cashfree credentials not configured")
    return {
        "x-client-id": client_id,
        "x-client-secret": client_secret,
        "x-api-version": api_version,
        "content-type": "application/json",
    }


async def _cashfree_create_order(
    *,
    db: Session,
    intent: PaymentIntent,
    operation: str,
    idempotency_key: Optional[str],
    correlation_id: str,
    return_url: Optional[str],
) -> GatewayOrderCreateResponse:
    cfg = _active_gateway(db)
    provider = (cfg.provider if cfg else "mock") or "mock"
    if provider != "cashfree":
        raise HTTPException(status_code=400, detail="Active gateway provider is not cashfree")
    if not cfg:
        raise HTTPException(status_code=400, detail="No active gateway config")

    # Idempotency: if attempt exists, return it
    if idempotency_key:
        existing = (
            db.execute(
                select(PaymentAttempt).where(
                    PaymentAttempt.intent_id == intent.id,
                    PaymentAttempt.operation == operation,
                    PaymentAttempt.idempotency_key == idempotency_key,
                )
            )
            .scalars()
            .first()
        )
        if existing:
            pay_url = None
            if isinstance(existing.raw_response, dict):
                pay_url = existing.raw_response.get("payment_link") or existing.raw_response.get("pay_url")
            return GatewayOrderCreateResponse(
                intent_id=intent.id,
                provider="cashfree",
                gateway_order_id=existing.gateway_order_id,
                payment_session_id=existing.payment_session_id,
                pay_url=pay_url,
                status=intent.status,  # type: ignore[arg-type]
            )

    base = _cashfree_base_url(cfg)
    headers = _cashfree_headers(cfg)

    creds = cfg.credentials or {}
    notify_url = str(creds.get("notify_url") or "")
    final_return_url = return_url or str(creds.get("return_url") or "")

    # Use a per-attempt order_id to support retries safely
    order_id = f"{intent.id}"
    if operation == "retry":
        # monotonic-ish retry suffix
        order_id = f"{intent.id}-r{int(time.time())}"

    payload = {
        "order_id": order_id,
        "order_amount": float(intent.amount),
        "order_currency": intent.currency,
        "customer_details": {
            "customer_id": str(intent.user_id),
        },
        "order_meta": {
            **({"return_url": final_return_url} if final_return_url else {}),
            **({"notify_url": notify_url} if notify_url else {}),
        },
    }
    request_hash = hashlib.sha256(json.dumps(payload, sort_keys=True).encode("utf-8")).hexdigest()

    now = datetime.now(timezone.utc)
    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.post(
                f"{base}/orders",
                headers={**headers, "x-correlation-id": correlation_id},
                json=payload,
            )
        data = resp.json() if resp.headers.get("content-type", "").startswith("application/json") else {}
    except Exception as e:
        data = {"error": str(e)}
        resp = None

    status_val = "failed"
    gateway_order_id = None
    payment_session_id = None
    pay_url = None

    if resp and resp.status_code in (200, 201):
        gateway_order_id = str(data.get("cf_order_id") or data.get("order_id") or order_id)
        payment_session_id = str(data.get("payment_session_id") or data.get("paymentSessionId") or "")
        pay_url = data.get("payment_link") or data.get("pay_url")
        status_val = "pending"
        intent.status = "pending"
    else:
        intent.status = "failed"

    intent.provider = "cashfree"
    intent.updated_at = now
    db.add(intent)

    attempt = PaymentAttempt(
        intent_id=intent.id,
        operation=operation,
        idempotency_key=idempotency_key,
        gateway_order_id=gateway_order_id,
        payment_session_id=payment_session_id,
        request_hash=request_hash,
        raw_request=payload,
        raw_response=data if isinstance(data, dict) else {"raw": data},
        status=status_val,
        created_at=now,
    )
    db.add(attempt)
    db.commit()

    return GatewayOrderCreateResponse(
        intent_id=intent.id,
        provider="cashfree",
        gateway_order_id=gateway_order_id,
        payment_session_id=payment_session_id,
        pay_url=pay_url,
        status=intent.status,  # type: ignore[arg-type]
    )


@app.post("/api/v1/payments/intents/{intent_id}/create-gateway-order", response_model=GatewayOrderCreateResponse)
async def create_gateway_order(
    intent_id: UUID,
    req: GatewayOrderCreateRequest,
    db: Session = Depends(get_db),
    x_user_id: Optional[str] = Header(default=None),
    x_user_role: Optional[str] = Header(default=None),
    request: Request = None,
):
    user_id = _require_user_id(x_user_id)
    role = str(x_user_role or "")
    intent = db.get(PaymentIntent, intent_id)
    if not intent:
        raise HTTPException(status_code=404, detail="Payment intent not found")
    if role == "subscriber" and intent.user_id != user_id:
        raise HTTPException(status_code=403, detail="Forbidden")
    if role not in {"subscriber", "admin"}:
        raise HTTPException(status_code=403, detail="Forbidden")

    if intent.status not in {"created", "failed", "expired"}:
        raise HTTPException(status_code=400, detail="Intent not eligible for gateway order creation")

    correlation_id = getattr(request.state, "correlation_id", str(uuid4()))
    return await _cashfree_create_order(
        db=db,
        intent=intent,
        operation="create",
        idempotency_key=req.idempotency_key,
        correlation_id=correlation_id,
        return_url=req.return_url,
    )


@app.post("/api/v1/payments/intents/{intent_id}/retry", response_model=GatewayOrderCreateResponse)
async def retry_gateway_order(
    intent_id: UUID,
    req: RetryRequest,
    db: Session = Depends(get_db),
    x_user_id: Optional[str] = Header(default=None),
    x_user_role: Optional[str] = Header(default=None),
    request: Request = None,
):
    user_id = _require_user_id(x_user_id)
    role = str(x_user_role or "")
    intent = db.get(PaymentIntent, intent_id)
    if not intent:
        raise HTTPException(status_code=404, detail="Payment intent not found")
    if role == "subscriber" and intent.user_id != user_id:
        raise HTTPException(status_code=403, detail="Forbidden")
    if role not in {"subscriber", "admin"}:
        raise HTTPException(status_code=403, detail="Forbidden")

    if intent.status not in {"failed", "expired"}:
        raise HTTPException(status_code=400, detail="Retry allowed only for failed/expired intents")

    correlation_id = getattr(request.state, "correlation_id", str(uuid4()))
    return await _cashfree_create_order(
        db=db,
        intent=intent,
        operation="retry",
        idempotency_key=req.idempotency_key,
        correlation_id=correlation_id,
        return_url=None,
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


def _verify_cashfree_signature(raw_body: bytes, timestamp: str, signature: str) -> bool:
    if not CASHFREE_WEBHOOK_SECRET:
        return False
    msg = (timestamp or "").encode("utf-8") + raw_body
    expected = base64.b64encode(
        hmac.new(
            CASHFREE_WEBHOOK_SECRET.encode("utf-8"),
            msg,
            hashlib.sha256,
        ).digest()
    ).decode("ascii")
    return hmac.compare_digest(expected, signature or "")


@app.post("/api/v1/payments/webhooks/cashfree")
async def cashfree_webhook(request: Request, db: Session = Depends(get_db)):
    raw_body = await request.body()
    ts = request.headers.get("x-webhook-timestamp", "")
    sig = request.headers.get("x-webhook-signature", "")

    if CASHFREE_WEBHOOK_SECRET and not _verify_cashfree_signature(raw_body, ts, sig):
        logger.warning("Cashfree webhook signature verification failed")
        raise HTTPException(status_code=401, detail="Invalid signature")

    try:
        data = json.loads(raw_body.decode("utf-8"))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid JSON: {e}")

    # Extract order_id (our subscription order id) and status from Cashfree payload
    order = (data.get("data") or {}).get("order") or data.get("order") or {}
    order_id = str(order.get("order_id") or order.get("orderId") or "")
    order_status = str(order.get("order_status") or order.get("orderStatus") or order.get("payment_status") or "").upper()
    cf_order_id = str(order.get("cf_order_id") or order.get("cfOrderId") or "")
    event_id = cf_order_id or hashlib.sha256(raw_body).hexdigest()

    if not order_id:
        logger.warning("Cashfree webhook: no order_id in payload")
        return {"status": "ignored", "reason": "no order_id"}

    # Idempotency: already processed?
    existing = db.execute(
        select(PaymentWebhookEvent).where(
            PaymentWebhookEvent.provider == "cashfree",
            PaymentWebhookEvent.event_id == event_id,
        )
    ).scalar_one_or_none()
    if existing:
        return {"status": "ok", "duplicate": True}

    now = datetime.now(timezone.utc)
    db.add(PaymentWebhookEvent(provider="cashfree", event_id=event_id, raw_payload=data, created_at=now))
    db.commit()

    # Find PaymentIntent by reference
    intent = db.execute(
        select(PaymentIntent).where(
            PaymentIntent.reference_type == "subscription_order",
            PaymentIntent.reference_id == order_id,
        )
    ).scalar_one_or_none()

    if intent:
        intent.status = "paid" if order_status in ("PAID", "ACTIVE", "PAYMENT_SUCCESS", "SUCCESS") else "failed"
        intent.updated_at = now
        db.add(intent)
        db.commit()
        db.refresh(intent)

        if intent.status == "paid" and SUBSCRIPTION_SERVICE_URL and INTERNAL_API_KEY:
            try:
                async with httpx.AsyncClient(timeout=10.0) as client:
                    await client.post(
                        f"{SUBSCRIPTION_SERVICE_URL}/api/v1/subscriptions/internal/orders/{order_id}/mark-paid",
                        headers={"X-Internal-API-Key": INTERNAL_API_KEY},
                        json={"payment_intent_id": str(intent.id)},
                    )
            except Exception as e:
                logger.warning("mark-paid after Cashfree webhook failed: %s", e)

    return {"status": "ok"}


@app.post("/api/v1/payments/internal/jobs/reconcile-due")
async def reconcile_due(
    db: Session = Depends(get_db),
    x_internal_api_key: Optional[str] = Header(default=None, alias="X-Internal-API-Key"),
):
    _require_internal(x_internal_api_key)
    now = datetime.now(timezone.utc)
    cutoff = now.timestamp() - float(RECONCILE_PENDING_SECONDS)

    # Find pending intents older than cutoff
    intents = (
        db.execute(select(PaymentIntent).where(PaymentIntent.status == "pending"))
        .scalars()
        .all()
    )

    reconciled = 0
    for intent in intents:
        if intent.updated_at and intent.updated_at.timestamp() > cutoff:
            continue
        if intent.provider != "cashfree":
            continue

        cfg = _active_gateway(db)
        if not cfg or (cfg.provider or "") != "cashfree":
            continue

        # Find most recent create/retry attempt with gateway_order_id
        attempt = (
            db.execute(
                select(PaymentAttempt)
                .where(
                    PaymentAttempt.intent_id == intent.id,
                    PaymentAttempt.operation.in_(["create", "retry"]),
                )
                .order_by(PaymentAttempt.created_at.desc())
            )
            .scalars()
            .first()
        )
        gateway_order_id = attempt.gateway_order_id if attempt else None
        if not gateway_order_id:
            continue

        base = _cashfree_base_url(cfg)
        headers = _cashfree_headers(cfg)
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                resp = await client.get(
                    f"{base}/orders/{gateway_order_id}",
                    headers=headers,
                )
            data = resp.json() if resp.headers.get("content-type", "").startswith("application/json") else {}
        except Exception as e:
            data = {"error": str(e)}
            resp = None

        # Log reconcile attempt (append-only)
        db.add(
            PaymentAttempt(
                intent_id=intent.id,
                operation="reconcile",
                idempotency_key=None,
                gateway_order_id=gateway_order_id,
                payment_session_id=None,
                request_hash=None,
                raw_request={"gateway_order_id": gateway_order_id},
                raw_response=data if isinstance(data, dict) else {"raw": data},
                status="ok" if resp and resp.status_code == 200 else "failed",
                created_at=now,
            )
        )
        db.commit()

        order_status = str(
            (data.get("order_status") or data.get("orderStatus") or data.get("payment_status") or "")
        ).upper()
        if order_status in ("PAID", "ACTIVE", "PAYMENT_SUCCESS", "SUCCESS"):
            intent.status = "paid"
            intent.updated_at = now
            db.add(intent)
            db.commit()
            db.refresh(intent)

            # Trigger downstream idempotently
            if intent.reference_type == "subscription_order" and SUBSCRIPTION_SERVICE_URL and INTERNAL_API_KEY:
                try:
                    async with httpx.AsyncClient(timeout=10.0) as client:
                        await client.post(
                            f"{SUBSCRIPTION_SERVICE_URL}/api/v1/subscriptions/internal/orders/{intent.reference_id}/mark-paid",
                            headers={"X-Internal-API-Key": INTERNAL_API_KEY},
                            json={"payment_intent_id": str(intent.id)},
                        )
                except Exception as e:
                    logger.warning("reconcile mark-paid failed: %s", e)

            if intent.reference_type == "billing_invoice" and BILLING_SERVICE_URL and INTERNAL_API_KEY:
                try:
                    async with httpx.AsyncClient(timeout=10.0) as client:
                        await client.patch(
                            f"{BILLING_SERVICE_URL}/api/v1/billing/internal/invoices/{intent.reference_id}/mark-paid",
                            headers={"X-Internal-API-Key": INTERNAL_API_KEY},
                        )
                except Exception as e:
                    logger.warning("reconcile mark-paid invoice failed: %s", e)

            reconciled += 1
        elif order_status in ("EXPIRED", "CANCELLED"):
            intent.status = "expired"
            intent.updated_at = now
            db.add(intent)
            db.commit()
            reconciled += 1

    return {"reconciled": reconciled}


@app.post("/api/v1/payments/internal/offline/mark-order-paid", response_model=PaymentIntentResponse, status_code=status.HTTP_201_CREATED)
async def offline_mark_order_paid(
    req: OfflineMarkOrderPaidRequest,
    db: Session = Depends(get_db),
    x_internal_api_key: Optional[str] = Header(default=None, alias="X-Internal-API-Key"),
):
    _require_internal(x_internal_api_key)

    now = datetime.now(timezone.utc)
    intent = PaymentIntent(
        user_id=req.user_id,
        reference_type="subscription_order",
        reference_id=str(req.order_id),
        amount=req.amount,
        currency="INR",
        status="paid",
        provider="offline",
        meta={"reference": req.reference} if req.reference else None,
        created_at=now,
        updated_at=now,
    )
    db.add(intent)
    db.commit()
    db.refresh(intent)

    if SUBSCRIPTION_SERVICE_URL and INTERNAL_API_KEY:
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                await client.post(
                    f"{SUBSCRIPTION_SERVICE_URL}/api/v1/subscriptions/internal/orders/{req.order_id}/mark-paid",
                    headers={"X-Internal-API-Key": INTERNAL_API_KEY},
                    json={"payment_intent_id": str(intent.id)},
                )
        except Exception as e:
            logger.warning("mark-paid after offline entry failed: %s", e)
            raise HTTPException(status_code=502, detail="mark-paid failed") from e

    return _intent_to_response(intent)


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        app,
        host="0.0.0.0",
        port=int(os.getenv("SERVICE_PORT", "8000")),
        log_level=LOG_LEVEL.lower(),
    )
