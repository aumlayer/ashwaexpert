import json
import logging
import os
import time
import calendar
from datetime import timedelta
from datetime import datetime, timezone
from uuid import UUID
from uuid import uuid4

import httpx
from dateutil.relativedelta import relativedelta
from fastapi import Depends, FastAPI, Header, HTTPException, Query, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
from prometheus_client import CONTENT_TYPE_LATEST, Counter, Histogram, generate_latest
from sqlalchemy import and_, func, select, text
from sqlalchemy.orm import Session

from app.deps import get_db
from app.models import Order, Subscription, SubscriptionEvent, SubscriptionOutbox, TaxConfig
from app.schemas import (
    CancellationRequest,
    OrderResponse,
    OrderListResponse,
    InternalMarkOrderPaidRequest,
    PlanChangeRequest,
    PurchaseRequest,
    SubscriptionCreateRequest,
    SubscriptionEventListResponse,
    SubscriptionEventResponse,
    SubscriptionQuoteRequest,
    SubscriptionQuoteResponse,
    SubscriptionListResponse,
    SubscriptionResponse,
    SubscriptionUpdateRequest,
    TaxConfigResponse,
    TaxConfigUpsertRequest,
)

SERVICE_NAME = os.getenv("SERVICE_NAME", "subscription-service")
SERVICE_VERSION = os.getenv("SERVICE_VERSION", "0.1.0")
ENVIRONMENT = os.getenv("ENVIRONMENT", "local")
LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO")
CORS_ORIGINS = os.getenv("CORS_ORIGINS", "*")
<<<<<<< Updated upstream
COUPON_SERVICE_URL = os.getenv("COUPON_SERVICE_URL", "")
PAYMENT_SERVICE_URL = os.getenv("PAYMENT_SERVICE_URL", "")
BILLING_SERVICE_URL = os.getenv("BILLING_SERVICE_URL", "")
NOTIFICATION_SERVICE_URL = os.getenv("NOTIFICATION_SERVICE_URL", "")
=======
COUPON_SERVICE_URL = os.getenv("COUPON_SERVICE_URL", "http://coupon-service:8000")
PAYMENT_SERVICE_URL = os.getenv("PAYMENT_SERVICE_URL", "http://payment-service:8000")
BILLING_SERVICE_URL = os.getenv("BILLING_SERVICE_URL", "http://billing-service:8000")
>>>>>>> Stashed changes
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


def _require_internal(x_internal_api_key: str | None) -> None:
    if not INTERNAL_API_KEY or x_internal_api_key != INTERNAL_API_KEY:
        raise HTTPException(status_code=401, detail="Invalid internal key")


def _subscription_to_response(s: Subscription) -> SubscriptionResponse:
    return SubscriptionResponse(
        id=s.id,
        user_id=s.user_id,
        plan_id=s.plan_id,
        status=s.status,  # type: ignore[arg-type]
        billing_period=s.billing_period,  # type: ignore[arg-type]
        auto_renew=s.auto_renew,
        start_at=s.start_at,
        renewal_anchor_at=s.renewal_anchor_at,
        next_renewal_at=s.next_renewal_at,
        next_renewal_override_at=s.next_renewal_override_at,
        end_at=s.end_at,
        cancel_requested_at=getattr(s, "cancel_requested_at", None),
        cancel_effective_at=getattr(s, "cancel_effective_at", None),
        cancel_reason=getattr(s, "cancel_reason", None),
        plan_change_requested_plan_id=getattr(s, "plan_change_requested_plan_id", None),
        plan_change_requested_at=getattr(s, "plan_change_requested_at", None),
        plan_change_effective_at=getattr(s, "plan_change_effective_at", None),
        plan_change_mode=getattr(s, "plan_change_mode", None),
        created_at=s.created_at,
        updated_at=s.updated_at,
    )


def _add_months(anchor: datetime, months: int) -> datetime:
    # Calendar-based month addition (purchase-date anchored). Keeps day-of-month when possible.
    year = anchor.year
    month = anchor.month + months
    year += (month - 1) // 12
    month = ((month - 1) % 12) + 1
    last_day = calendar.monthrange(year, month)[1]
    day = min(anchor.day, last_day)
    return anchor.replace(year=year, month=month, day=day)


def _next_renewal(anchor: datetime, billing_period: str) -> datetime:
    if billing_period == "monthly":
        return _add_months(anchor, 1)
    if billing_period == "quarterly":
        return _add_months(anchor, 3)
    if billing_period == "yearly":
        return anchor.replace(year=anchor.year + 1)
    return anchor + timedelta(days=30)


def _get_gst_percent(db: Session, service_type: str) -> float:
    row = db.execute(select(TaxConfig).where(TaxConfig.service_type == service_type)).scalar_one_or_none()
    if row:
        return float(row.gst_percent)
    # safe defaults
    return 18.0 if service_type == "service" else 18.0


def _write_subscription_event(
    db: Session,
    *,
    subscription_id: UUID,
    event_type: str,
    actor_user_id: UUID | None = None,
    actor_role: str | None = None,
    from_status: str | None = None,
    to_status: str | None = None,
    from_plan_id: UUID | None = None,
    to_plan_id: UUID | None = None,
    payload: dict | None = None,
) -> SubscriptionEvent:
    """Write a subscription event. Always call this for lifecycle actions."""
    now = datetime.now(timezone.utc)
    event = SubscriptionEvent(
        subscription_id=subscription_id,
        event_type=event_type,
        actor_user_id=actor_user_id,
        actor_role=actor_role,
        from_status=from_status,
        to_status=to_status,
        from_plan_id=from_plan_id,
        to_plan_id=to_plan_id,
        payload=payload,
        created_at=now,
    )
    db.add(event)
    return event


def _enqueue_outbox(
    db: Session,
    *,
    topic: str,
    event_name: str,
    payload: dict,
) -> SubscriptionOutbox:
    """Enqueue an outbox event for best-effort processing."""
    now = datetime.now(timezone.utc)
    outbox = SubscriptionOutbox(
        topic=topic,
        event_name=event_name,
        payload=payload,
        status="pending",
        created_at=now,
        attempt_count=0,
    )
    db.add(outbox)
    return outbox


def _compute_cancel_effective_at(
    *,
    now: datetime,
    current_period_end: datetime | None,
    effective_mode: str,
) -> datetime:
    """Compute cancel_effective_at based on mode. Returns max(now+1month, current_period_end) if end_of_cycle."""
    if effective_mode == "end_of_cycle" and current_period_end:
        return current_period_end
    
    # notice_1_month: add 1 calendar month
    notice_date = now + relativedelta(months=1)
    
    # If current_period_end is later, use the later date
    if current_period_end and current_period_end > notice_date:
        return current_period_end
    return notice_date


async def _notify_subscriber(
    *,
    subscription_id: UUID,
    user_id: UUID,
    template_key: str,
    context: dict,
    correlation_id: str,
) -> None:
    """Send notification to subscriber (best-effort)."""
    if not NOTIFICATION_SERVICE_URL or not INTERNAL_API_KEY:
        return
    
    try:
        async with httpx.AsyncClient(timeout=3.0) as client:
            await client.post(
                f"{NOTIFICATION_SERVICE_URL}/api/v1/notifications/internal/send",
                headers={
                    "X-Internal-API-Key": INTERNAL_API_KEY,
                    "x-correlation-id": correlation_id,
                },
                json={
                    "template_key": template_key,
                    "channel": "email",
                    "recipient": "",  # Would need user lookup
                    "context": context,
                },
            )
    except Exception as e:
        logger.warning("Notification send failed (best-effort): %s", e)


def _order_to_response(o: Order) -> OrderResponse:
    return OrderResponse(
        id=o.id,
        subscription_id=o.subscription_id,
        user_id=o.user_id,
        order_type=o.order_type,  # type: ignore[arg-type]
        service_type=o.service_type,  # type: ignore[arg-type]
        base_amount=float(o.base_amount),
        discount_amount=float(o.discount_amount),
        credit_applied_amount=float(o.credit_applied_amount),
        amount_before_gst=float(o.amount_before_gst),
        gst_percent=float(o.gst_percent),
        gst_amount=float(o.gst_amount),
        total_amount=float(o.total_amount),
        promo_code=o.promo_code,
        referral_code=o.referral_code,
        applied_codes=list(o.applied_codes or []),
        applied_credit_id=o.applied_credit_id,
        payment_intent_id=o.payment_intent_id,
        status=o.status,  # type: ignore[arg-type]
        created_at=o.created_at,
    )


async def _coupon_validate(*, code: str, user_id: UUID, base_amount: float, applies_to: str) -> dict | None:
    if not COUPON_SERVICE_URL or not INTERNAL_API_KEY:
        return None
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            r = await client.post(
                f"{COUPON_SERVICE_URL}/api/v1/coupons/internal/validate",
                headers={"X-Internal-API-Key": INTERNAL_API_KEY},
                json={"code": code, "user_id": str(user_id), "base_amount": base_amount, "applies_to": applies_to},
            )
    except Exception:
        return None
    if r.status_code != 200:
        return None
    try:
        return r.json()
    except Exception:
        return None


async def _coupon_redeem(*, code: str, redeemed_by_user_id: UUID, order_ref: str, base_amount: float, applies_to: str) -> dict | None:
    if not COUPON_SERVICE_URL or not INTERNAL_API_KEY:
        return None
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            r = await client.post(
                f"{COUPON_SERVICE_URL}/api/v1/coupons/internal/redeem",
                headers={"X-Internal-API-Key": INTERNAL_API_KEY},
                json={
                    "code": code,
                    "redeemed_by_user_id": str(redeemed_by_user_id),
                    "order_ref": order_ref,
                    "base_amount": base_amount,
                    "applies_to": applies_to,
                },
            )
    except Exception:
        return None
    if r.status_code != 200:
        return None
    try:
        return r.json()
    except Exception:
        return None


async def _get_one_pending_rental_credit(user_id: UUID) -> dict | None:
    if not COUPON_SERVICE_URL or not INTERNAL_API_KEY:
        return None
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            r = await client.get(
                f"{COUPON_SERVICE_URL}/api/v1/coupons/internal/credits/pending",
                params={"user_id": str(user_id)},
                headers={"X-Internal-API-Key": INTERNAL_API_KEY},
            )
    except Exception:
        return None
    if r.status_code != 200:
        return None
    try:
        data = r.json()
    except Exception:
        return None
    items = data.get("items") if isinstance(data, dict) else None
    if not isinstance(items, list) or not items:
        return None
    # credits are stored FIFO by created_at in coupon-service
    first = items[0]
    if isinstance(first, dict) and first.get("applies_to") in (None, "rental"):
        return first
    return None


async def _apply_credit(credit_id: str, order_ref: str) -> None:
    if not COUPON_SERVICE_URL or not INTERNAL_API_KEY:
        return
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            await client.post(
                f"{COUPON_SERVICE_URL}/api/v1/coupons/internal/credits/{credit_id}/apply",
                headers={"X-Internal-API-Key": INTERNAL_API_KEY},
                json={"order_ref": order_ref, "note": "Applied on rental renewal"},
            )
    except Exception:
        return


async def _create_payment_intent(*, user_id: UUID, order_id: UUID, amount: float, currency: str = "INR") -> UUID | None:
    if not PAYMENT_SERVICE_URL or not INTERNAL_API_KEY:
        return None
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            r = await client.post(
                f"{PAYMENT_SERVICE_URL}/api/v1/payments/internal/intents",
                headers={"X-Internal-API-Key": INTERNAL_API_KEY},
                json={
                    "user_id": str(user_id),
                    "reference_type": "subscription_order",
                    "reference_id": str(order_id),
                    "amount": float(amount),
                    "currency": currency,
                },
            )
    except Exception:
        return None
    if r.status_code != 201:
        return None
    try:
        data = r.json()
        return UUID(str(data.get("id")))
    except Exception:
        return None


async def _billing_create_invoice(order_id: UUID) -> None:
    if not BILLING_SERVICE_URL or not INTERNAL_API_KEY:
        return
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            await client.post(
                f"{BILLING_SERVICE_URL}/api/v1/billing/internal/invoices/from-order/{order_id}",
                headers={"X-Internal-API-Key": INTERNAL_API_KEY},
            )
    except Exception:
        return
    return


@app.post("/api/v1/subscriptions", response_model=SubscriptionResponse, status_code=status.HTTP_201_CREATED)
async def create_subscription(
    req: SubscriptionCreateRequest,
    db: Session = Depends(get_db),
    x_user_id: str | None = Header(default=None),
    x_user_role: str | None = Header(default=None),
):
    actor_user_id = _require_user_id(x_user_id)
    role = str(x_user_role or "")
    target_user_id = actor_user_id
    if role == "admin" and req.user_id:
        target_user_id = req.user_id
    elif role != "subscriber":
        raise HTTPException(status_code=403, detail="Forbidden")

    # One active subscription per user for now
    existing = db.execute(
        select(Subscription).where(Subscription.user_id == target_user_id, Subscription.status == "active")
    ).scalar_one_or_none()
    if existing:
        raise HTTPException(status_code=409, detail="Active subscription already exists")

    now = datetime.now(timezone.utc)
    sub = Subscription(
        user_id=target_user_id,
        plan_id=req.plan_id,
        status="active",
        billing_period=req.billing_period,
        auto_renew=req.auto_renew,
        start_at=now,
        renewal_anchor_at=now,
        next_renewal_at=_next_renewal(now, req.billing_period) if req.auto_renew else None,
        next_renewal_override_at=None,
        end_at=None,
        meta={"created_by_role": role},
        created_at=now,
        updated_at=now,
    )
    db.add(sub)
    db.commit()
    db.refresh(sub)
    return _subscription_to_response(sub)


@app.get("/api/v1/subscriptions/me", response_model=SubscriptionResponse)
async def get_my_subscription(
    db: Session = Depends(get_db),
    x_user_id: str | None = Header(default=None),
    x_user_role: str | None = Header(default=None),
):
    user_id = _require_user_id(x_user_id)
    role = str(x_user_role or "")
    if role != "subscriber":
        raise HTTPException(status_code=403, detail="Forbidden")
    sub = db.execute(
        select(Subscription).where(Subscription.user_id == user_id).order_by(Subscription.created_at.desc())
    ).scalar_one_or_none()
    if not sub:
        raise HTTPException(status_code=404, detail="Subscription not found")
    return _subscription_to_response(sub)


@app.patch("/api/v1/subscriptions/{subscription_id}", response_model=SubscriptionResponse)
async def admin_update_subscription(
    subscription_id: UUID,
    req: SubscriptionUpdateRequest,
    db: Session = Depends(get_db),
    x_user_role: str | None = Header(default=None),
):
    _require_admin(x_user_role)
    sub = db.get(Subscription, subscription_id)
    if not sub:
        raise HTTPException(status_code=404, detail="Subscription not found")
    if req.billing_period is not None:
        sub.billing_period = req.billing_period
    if req.auto_renew is not None:
        sub.auto_renew = req.auto_renew
        anchor = sub.next_renewal_override_at or sub.next_renewal_at or sub.renewal_anchor_at
        sub.next_renewal_at = _next_renewal(anchor, sub.billing_period) if sub.auto_renew else None
    if req.status is not None:
        sub.status = req.status
    if req.next_renewal_override_at is not None:
        sub.next_renewal_override_at = req.next_renewal_override_at
        if sub.auto_renew:
            sub.next_renewal_at = req.next_renewal_override_at
    sub.updated_at = datetime.now(timezone.utc)
    db.add(sub)
    db.commit()
    db.refresh(sub)
    return _subscription_to_response(sub)


@app.get("/api/v1/subscriptions/admin/subscriptions", response_model=SubscriptionListResponse)
async def admin_list_subscriptions(
    db: Session = Depends(get_db),
    x_user_role: str | None = Header(default=None),
    user_id: UUID | None = Query(default=None),
    plan_id: UUID | None = Query(default=None),
    status: str | None = Query(default=None),
    due_before: datetime | None = Query(default=None),
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
):
    _require_admin(x_user_role)
    stmt = select(Subscription)
    filters = []
    if user_id:
        filters.append(Subscription.user_id == user_id)
    if plan_id:
        filters.append(Subscription.plan_id == plan_id)
    if status:
        filters.append(Subscription.status == status)
    if due_before:
        filters.append(Subscription.next_renewal_at.is_not(None))
        filters.append(Subscription.next_renewal_at <= due_before)
    if filters:
        stmt = stmt.where(and_(*filters))

    total = int(
        db.execute(select(func.count()).select_from(stmt.subquery())).scalar_one()
    )
    rows = (
        db.execute(stmt.order_by(Subscription.created_at.desc()).limit(limit).offset(offset))
        .scalars()
        .all()
    )
    return SubscriptionListResponse(items=[_subscription_to_response(s) for s in rows], total=total)


@app.get("/api/v1/subscriptions/admin/orders", response_model=OrderListResponse)
async def admin_list_orders(
    db: Session = Depends(get_db),
    x_user_role: str | None = Header(default=None),
    user_id: UUID | None = Query(default=None),
    subscription_id: UUID | None = Query(default=None),
    order_type: str | None = Query(default=None),
    service_type: str | None = Query(default=None),
    status: str | None = Query(default=None),
    created_from: datetime | None = Query(default=None),
    created_to: datetime | None = Query(default=None),
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
):
    _require_admin(x_user_role)
    stmt = select(Order)
    filters = []
    if user_id:
        filters.append(Order.user_id == user_id)
    if subscription_id:
        filters.append(Order.subscription_id == subscription_id)
    if order_type:
        filters.append(Order.order_type == order_type)
    if service_type:
        filters.append(Order.service_type == service_type)
    if status:
        filters.append(Order.status == status)
    if created_from:
        filters.append(Order.created_at >= created_from)
    if created_to:
        filters.append(Order.created_at <= created_to)
    if filters:
        stmt = stmt.where(and_(*filters))

    total = int(db.execute(select(func.count()).select_from(stmt.subquery())).scalar_one())
    rows = (
        db.execute(stmt.order_by(Order.created_at.desc()).limit(limit).offset(offset))
        .scalars()
        .all()
    )
    return OrderListResponse(items=[_order_to_response(o) for o in rows], total=total)


@app.post("/api/v1/subscriptions/me/quote", response_model=SubscriptionQuoteResponse)
async def quote_subscription_amount(
    req: SubscriptionQuoteRequest,
    db: Session = Depends(get_db),
    x_user_id: str | None = Header(default=None),
    x_user_role: str | None = Header(default=None),
):
    user_id = _require_user_id(x_user_id)
    role = str(x_user_role or "")
    if role != "subscriber":
        raise HTTPException(status_code=403, detail="Forbidden")

    if not COUPON_SERVICE_URL or not INTERNAL_API_KEY:
        # allow local dev even if coupon-service isn't configured
        return SubscriptionQuoteResponse(
            base_amount=req.base_amount,
            discount_amount=0.0,
            amount_before_gst=req.base_amount,
            applied_codes=[],
        )

    applied: list[str] = []
    discount_total = 0.0
    credit_applied = 0.0

    gst_percent = _get_gst_percent(db, req.service_type)

    for code in [req.promo_code, req.referral_code]:
        if not code:
            continue
        data = await _coupon_validate(
            code=code, user_id=user_id, base_amount=req.base_amount, applies_to=req.service_type
        )
        if data and data.get("valid") is True:
            applied.append(str(data.get("code") or code).upper())
            try:
                discount_total += float(data.get("discount_amount") or 0.0)
            except Exception:
                pass

    amount_before_gst = max(0.0, float(req.base_amount) - float(discount_total) - float(credit_applied))
    gst_amount = round((gst_percent / 100.0) * amount_before_gst, 2)
    total_amount = round(amount_before_gst + gst_amount, 2)
    return SubscriptionQuoteResponse(
        base_amount=float(req.base_amount),
        discount_amount=round(float(discount_total), 2),
        credit_applied_amount=round(float(credit_applied), 2),
        amount_before_gst=round(amount_before_gst, 2),
        gst_percent=round(float(gst_percent), 2),
        gst_amount=round(float(gst_amount), 2),
        total_amount=round(float(total_amount), 2),
        applied_codes=applied,
    )


@app.get("/api/v1/subscriptions/taxes", response_model=TaxConfigResponse)
async def get_tax_config(db: Session = Depends(get_db), x_user_role: str | None = Header(default=None)):
    _require_admin(x_user_role)
    rental = db.execute(select(TaxConfig).where(TaxConfig.service_type == "rental")).scalar_one_or_none()
    service = db.execute(select(TaxConfig).where(TaxConfig.service_type == "service")).scalar_one_or_none()
    updated_at = (service.updated_at if service else None) or (rental.updated_at if rental else None) or datetime.now(timezone.utc)
    return TaxConfigResponse(
        rental_gst_percent=float(rental.gst_percent) if rental else 18.0,
        service_gst_percent=float(service.gst_percent) if service else 18.0,
        updated_at=updated_at,
    )


@app.put("/api/v1/subscriptions/taxes", response_model=TaxConfigResponse)
async def upsert_tax_config(
    req: TaxConfigUpsertRequest,
    db: Session = Depends(get_db),
    x_user_role: str | None = Header(default=None),
):
    _require_admin(x_user_role)
    now = datetime.now(timezone.utc)
    for st, pct in [("rental", req.rental_gst_percent), ("service", req.service_gst_percent)]:
        row = db.execute(select(TaxConfig).where(TaxConfig.service_type == st)).scalar_one_or_none()
        if row:
            row.gst_percent = pct
            row.updated_at = now
            db.add(row)
        else:
            db.add(TaxConfig(service_type=st, gst_percent=pct, updated_at=now))
    db.commit()
    return TaxConfigResponse(
        rental_gst_percent=float(req.rental_gst_percent),
        service_gst_percent=float(req.service_gst_percent),
        updated_at=now,
    )


@app.post("/api/v1/subscriptions/me/purchase", response_model=OrderResponse, status_code=status.HTTP_201_CREATED)
async def purchase_subscription(
    req: PurchaseRequest,
    db: Session = Depends(get_db),
    x_user_id: str | None = Header(default=None),
    x_user_role: str | None = Header(default=None),
):
    user_id = _require_user_id(x_user_id)
    role = str(x_user_role or "")
    if role != "subscriber":
        raise HTTPException(status_code=403, detail="Forbidden")

    sub = db.execute(select(Subscription).where(Subscription.user_id == user_id, Subscription.status == "active")).scalar_one_or_none()
    if not sub:
        raise HTTPException(status_code=404, detail="Active subscription not found")

    # Compute stacked discounts before GST
    applied_codes: list[str] = []
    discount_total = 0.0
    for code in [req.promo_code, req.referral_code]:
        if not code:
            continue
        data = await _coupon_validate(code=code, user_id=user_id, base_amount=req.base_amount, applies_to=req.service_type)
        if data and data.get("valid") is True:
            applied_codes.append(str(data.get("code") or code).upper())
            discount_total += float(data.get("discount_amount") or 0.0)

    amount_before_gst = max(0.0, float(req.base_amount) - float(discount_total))
    gst_percent = _get_gst_percent(db, req.service_type)
    gst_amount = round((gst_percent / 100.0) * amount_before_gst, 2)
    total_amount = round(amount_before_gst + gst_amount, 2)

    now = datetime.now(timezone.utc)
    order = Order(
        subscription_id=sub.id,
        user_id=user_id,
        order_type="purchase",
        service_type=req.service_type,
        base_amount=req.base_amount,
        discount_amount=round(discount_total, 2),
        credit_applied_amount=0.0,
        amount_before_gst=round(amount_before_gst, 2),
        gst_percent=round(gst_percent, 2),
        gst_amount=round(gst_amount, 2),
        total_amount=round(total_amount, 2),
        promo_code=req.promo_code,
        referral_code=req.referral_code,
        applied_codes=applied_codes,
        applied_credit_id=None,
        payment_intent_id=None,
        status="pending",
        created_at=now,
    )
    db.add(order)
    db.commit()
    db.refresh(order)
    payment_intent_id = await _create_payment_intent(user_id=user_id, order_id=order.id, amount=total_amount)
    if payment_intent_id:
        order.payment_intent_id = payment_intent_id
        db.add(order)
        db.commit()
        db.refresh(order)
    return _order_to_response(order)


@app.post("/api/v1/subscriptions/me/renew", response_model=OrderResponse, status_code=status.HTTP_201_CREATED)
async def renew_subscription(
    req: PurchaseRequest,
    db: Session = Depends(get_db),
    x_user_id: str | None = Header(default=None),
    x_user_role: str | None = Header(default=None),
):
    user_id = _require_user_id(x_user_id)
    role = str(x_user_role or "")
    if role != "subscriber":
        raise HTTPException(status_code=403, detail="Forbidden")

    sub = db.execute(select(Subscription).where(Subscription.user_id == user_id, Subscription.status == "active")).scalar_one_or_none()
    if not sub:
        raise HTTPException(status_code=404, detail="Active subscription not found")

    # Apply stacked discounts before GST
    applied_codes: list[str] = []
    discount_total = 0.0
    for code in [req.promo_code, req.referral_code]:
        if not code:
            continue
        data = await _coupon_validate(code=code, user_id=user_id, base_amount=req.base_amount, applies_to=req.service_type)
        if data and data.get("valid") is True:
            applied_codes.append(str(data.get("code") or code).upper())
            discount_total += float(data.get("discount_amount") or 0.0)

    # Apply ONE pending rental credit per renewal (fixed amount) before GST
    credit_applied = 0.0
    applied_credit_id: UUID | None = None
    credit = await _get_one_pending_rental_credit(user_id)
    if credit and req.service_type == "rental":
        try:
            credit_applied = float(credit.get("credit_value") or 0.0)
            applied_credit_id = UUID(str(credit.get("id")))
        except Exception:
            credit_applied = 0.0
            applied_credit_id = None

    amount_before_gst = max(0.0, float(req.base_amount) - float(discount_total) - float(credit_applied))
    gst_percent = _get_gst_percent(db, req.service_type)
    gst_amount = round((gst_percent / 100.0) * amount_before_gst, 2)
    total_amount = round(amount_before_gst + gst_amount, 2)

    now = datetime.now(timezone.utc)
    order = Order(
        subscription_id=sub.id,
        user_id=user_id,
        order_type="renewal",
        service_type=req.service_type,
        base_amount=req.base_amount,
        discount_amount=round(discount_total, 2),
        credit_applied_amount=round(credit_applied, 2),
        amount_before_gst=round(amount_before_gst, 2),
        gst_percent=round(gst_percent, 2),
        gst_amount=round(gst_amount, 2),
        total_amount=round(total_amount, 2),
        promo_code=req.promo_code,
        referral_code=req.referral_code,
        applied_codes=applied_codes,
        applied_credit_id=applied_credit_id,
        payment_intent_id=None,
        status="pending",
        created_at=now,
    )
    db.add(order)
    db.commit()
    db.refresh(order)
    payment_intent_id = await _create_payment_intent(user_id=user_id, order_id=order.id, amount=total_amount)
    if payment_intent_id:
        order.payment_intent_id = payment_intent_id
        db.add(order)
        db.commit()
        db.refresh(order)
    return _order_to_response(order)


@app.post("/api/v1/subscriptions/internal/orders/{order_id}/mark-paid", response_model=OrderResponse)
async def internal_mark_order_paid(
    order_id: UUID,
    req: InternalMarkOrderPaidRequest,
    db: Session = Depends(get_db),
    x_internal_api_key: str | None = Header(default=None, alias="X-Internal-API-Key"),
):
    _require_internal(x_internal_api_key)
    order = db.get(Order, order_id)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    if req.payment_intent_id and order.payment_intent_id and req.payment_intent_id != order.payment_intent_id:
        raise HTTPException(status_code=409, detail="Payment intent mismatch")
    if order.status == "paid":
        return _order_to_response(order)

    order.status = "paid"
    if req.payment_intent_id and order.payment_intent_id is None:
        order.payment_intent_id = req.payment_intent_id
    db.add(order)
    db.commit()
    db.refresh(order)

    # Create invoice (best-effort, idempotent on billing-service)
    await _billing_create_invoice(order.id)

    # Redeem coupon/referral codes
    for code in [order.promo_code, order.referral_code]:
        if code:
            await _coupon_redeem(
                code=code,
                redeemed_by_user_id=order.user_id,
                order_ref=str(order.id),
                base_amount=float(order.base_amount),
                applies_to=str(order.service_type),
            )

    # Renewal side-effects
    if order.order_type == "renewal":
        if order.applied_credit_id:
            await _apply_credit(str(order.applied_credit_id), str(order.id))

        sub = db.get(Subscription, order.subscription_id)
        if sub and sub.auto_renew:
            now = datetime.now(timezone.utc)
            anchor = sub.next_renewal_override_at or sub.next_renewal_at or sub.renewal_anchor_at
            sub.next_renewal_at = _next_renewal(anchor, sub.billing_period)
            sub.next_renewal_override_at = None
            sub.updated_at = now
            db.add(sub)
            db.commit()

    return _order_to_response(order)


@app.post("/api/v1/subscriptions/{subscription_id}/plan-change", response_model=SubscriptionResponse)
async def request_plan_change(
    subscription_id: UUID,
    req: PlanChangeRequest,
    db: Session = Depends(get_db),
    x_user_id: str | None = Header(default=None),
    x_user_role: str | None = Header(default=None),
    request: Request = None,
):
    """Request a plan change. Subscriber can request for own subscription, admin for any."""
    user_id = _require_user_id(x_user_id)
    role = str(x_user_role or "")

    sub = db.get(Subscription, subscription_id)
    if not sub:
        raise HTTPException(status_code=404, detail="Subscription not found")

    # Authorization
    if role == "subscriber" and sub.user_id != user_id:
        raise HTTPException(status_code=403, detail="Forbidden")
    if role not in {"subscriber", "admin"}:
        raise HTTPException(status_code=403, detail="Forbidden")

    # Validate plan exists (cross-schema check)
    plan_row = db.execute(
        text("SELECT COUNT(*) FROM plan.plans WHERE id = :pid AND active = true"),
        {"pid": str(req.new_plan_id)},
    ).scalar()
    if plan_row == 0:
        raise HTTPException(status_code=404, detail="Plan not found or inactive")

    # Compute effective_at
    now = datetime.now(timezone.utc)
    if req.effective_at:
        effective_at = req.effective_at
    elif req.mode == "immediate":
        effective_at = now
    else:  # next_cycle
        effective_at = sub.next_renewal_at or sub.renewal_anchor_at

    # Persist request
    sub.plan_change_requested_plan_id = req.new_plan_id
    sub.plan_change_requested_at = now
    sub.plan_change_mode = req.mode
    sub.plan_change_effective_at = effective_at
    sub.updated_at = now
    db.add(sub)

    # Write event
    _write_subscription_event(
        db,
        subscription_id=subscription_id,
        event_type="plan_change_requested",
        actor_user_id=user_id,
        actor_role=role,
        from_plan_id=sub.plan_id,
        to_plan_id=req.new_plan_id,
        payload={"mode": req.mode, "effective_at": effective_at.isoformat()},
    )

    # Enqueue outbox
    _enqueue_outbox(
        db,
        topic="SubscriptionLifecycle",
        event_name="SubscriptionPlanChangeRequested",
        payload={
            "subscription_id": str(subscription_id),
            "user_id": str(sub.user_id),
            "from_plan_id": str(sub.plan_id),
            "to_plan_id": str(req.new_plan_id),
            "mode": req.mode,
            "effective_at": effective_at.isoformat(),
        },
    )

    db.commit()
    db.refresh(sub)

    # Best-effort notification
    correlation_id = getattr(request.state, "correlation_id", str(uuid4()))
    await _notify_subscriber(
        subscription_id=subscription_id,
        user_id=sub.user_id,
        template_key="subscription_plan_change_requested",
        context={"subscription_id": str(subscription_id), "new_plan_id": str(req.new_plan_id)},
        correlation_id=correlation_id,
    )

    return _subscription_to_response(sub)


@app.post("/api/v1/subscriptions/{subscription_id}/plan-change/apply", response_model=SubscriptionResponse)
async def apply_plan_change(
    subscription_id: UUID,
    force: bool = Query(default=False),
    db: Session = Depends(get_db),
    x_user_role: str | None = Header(default=None),
    request: Request = None,
):
    """Apply a pending plan change. Admin only."""
    _require_admin(x_user_role)

    sub = db.get(Subscription, subscription_id)
    if not sub:
        raise HTTPException(status_code=404, detail="Subscription not found")

    if not sub.plan_change_requested_plan_id:
        raise HTTPException(status_code=400, detail="No pending plan change request")

    now = datetime.now(timezone.utc)
    if not force and sub.plan_change_effective_at and sub.plan_change_effective_at > now:
        raise HTTPException(
            status_code=400,
            detail=f"Plan change effective date not reached: {sub.plan_change_effective_at}",
        )

    old_plan_id = sub.plan_id
    new_plan_id = sub.plan_change_requested_plan_id
    mode = sub.plan_change_mode or "next_cycle"

    # Apply plan change
    sub.plan_id = new_plan_id
    sub.plan_change_requested_plan_id = None
    sub.plan_change_requested_at = None
    sub.plan_change_effective_at = None
    sub.plan_change_mode = None
    sub.updated_at = now
    db.add(sub)

    # Write event
    _write_subscription_event(
        db,
        subscription_id=subscription_id,
        event_type="plan_changed",
        actor_user_id=None,  # System/admin action
        actor_role="admin",
        from_plan_id=old_plan_id,
        to_plan_id=new_plan_id,
        payload={"mode": mode, "applied_at": now.isoformat()},
    )

    # Proration hook (Wave 3): apply proration for immediate plan changes (non-blocking)
    proration_payload: dict = {
        "subscription_id": str(subscription_id),
        "user_id": str(sub.user_id),
        "from_plan_id": str(old_plan_id),
        "to_plan_id": str(new_plan_id),
        "mode": mode,
        "effective_at": now.isoformat(),
        "current_period_start": sub.start_at.isoformat(),
        "current_period_end": (sub.next_renewal_at or sub.renewal_anchor_at).isoformat(),
    }

    if mode == "immediate" and BILLING_SERVICE_URL and INTERNAL_API_KEY:
        try:
            # subscriber_id needed for credit ledger ownership in billing-service
            row = db.execute(
                text("SELECT id FROM subscriber.subscribers WHERE user_id = :uid LIMIT 1"),
                {"uid": str(sub.user_id)},
            ).fetchone()
            subscriber_id = str(row[0]) if row else ""

            # plan prices (daily proration)
            old_price_row = db.execute(
                text("SELECT price_amount FROM plan.plans WHERE id = :pid LIMIT 1"),
                {"pid": str(old_plan_id)},
            ).fetchone()
            new_price_row = db.execute(
                text("SELECT price_amount FROM plan.plans WHERE id = :pid LIMIT 1"),
                {"pid": str(new_plan_id)},
            ).fetchone()
            from_price = float(old_price_row[0]) if old_price_row and old_price_row[0] is not None else 0.0
            to_price = float(new_price_row[0]) if new_price_row and new_price_row[0] is not None else 0.0

            idempotency_key = f"proration:{subscription_id}:{old_plan_id}:{new_plan_id}:{now.date().isoformat()}"

            correlation_id = getattr(request.state, "correlation_id", str(uuid4()))
            async with httpx.AsyncClient(timeout=10.0) as client:
                r = await client.post(
                    f"{BILLING_SERVICE_URL}/api/v1/billing/internal/proration/apply",
                    headers={
                        "X-Internal-API-Key": INTERNAL_API_KEY,
                        "x-correlation-id": correlation_id,
                    },
                    json={
                        "subscriber_id": subscriber_id,
                        "subscription_id": str(subscription_id),
                        "from_plan_price": from_price,
                        "to_plan_price": to_price,
                        "current_period_start": sub.start_at.isoformat(),
                        "current_period_end": (sub.next_renewal_at or sub.renewal_anchor_at).isoformat(),
                        "effective_at": now.isoformat(),
                        "mode": "immediate",
                        "currency": "INR",
                        "create_invoice_if_positive": True,
                        "create_credit_if_negative": True,
                        "idempotency_key": idempotency_key,
                    },
                )
            if r.status_code == 200:
                data = r.json()
                proration_payload["proration_result"] = data
                _write_subscription_event(
                    db,
                    subscription_id=subscription_id,
                    event_type="proration_applied",
                    actor_user_id=None,
                    actor_role="system",
                    payload=data if isinstance(data, dict) else {"raw": data},
                )
            else:
                _enqueue_outbox(
                    db,
                    topic="SubscriptionLifecycle",
                    event_name="SubscriptionProrationPending",
                    payload=proration_payload,
                )
        except Exception as e:
            logger.warning("Proration apply failed (non-blocking): %s", e)
            _enqueue_outbox(
                db,
                topic="SubscriptionLifecycle",
                event_name="SubscriptionProrationPending",
                payload=proration_payload,
            )
    else:
        _enqueue_outbox(
            db,
            topic="SubscriptionLifecycle",
            event_name="SubscriptionProrationPending",
            payload=proration_payload,
        )

    # Enqueue outbox
    _enqueue_outbox(
        db,
        topic="SubscriptionLifecycle",
        event_name="SubscriptionPlanChanged",
        payload={
            "subscription_id": str(subscription_id),
            "user_id": str(sub.user_id),
            "from_plan_id": str(old_plan_id),
            "to_plan_id": str(new_plan_id),
        },
    )

    db.commit()
    db.refresh(sub)

    # Best-effort notification
    correlation_id = getattr(request.state, "correlation_id", str(uuid4()))
    await _notify_subscriber(
        subscription_id=subscription_id,
        user_id=sub.user_id,
        template_key="subscription_plan_changed",
        context={"subscription_id": str(subscription_id), "new_plan_id": str(new_plan_id)},
        correlation_id=correlation_id,
    )

    return _subscription_to_response(sub)


@app.post("/api/v1/subscriptions/{subscription_id}/cancel", response_model=SubscriptionResponse)
async def request_cancellation(
    subscription_id: UUID,
    req: CancellationRequest,
    db: Session = Depends(get_db),
    x_user_id: str | None = Header(default=None),
    x_user_role: str | None = Header(default=None),
    request: Request = None,
):
    """Request cancellation with notice. Subscriber can request for own, admin for any."""
    user_id = _require_user_id(x_user_id)
    role = str(x_user_role or "")

    sub = db.get(Subscription, subscription_id)
    if not sub:
        raise HTTPException(status_code=404, detail="Subscription not found")

    # Authorization
    if role == "subscriber" and sub.user_id != user_id:
        raise HTTPException(status_code=403, detail="Forbidden")
    if role not in {"subscriber", "admin"}:
        raise HTTPException(status_code=403, detail="Forbidden")

    if sub.status in {"cancelled", "cancellation_requested"}:
        raise HTTPException(status_code=400, detail="Subscription already cancelled or cancellation requested")

    now = datetime.now(timezone.utc)
    current_period_end = sub.next_renewal_at or sub.renewal_anchor_at

    # Compute effective_at
    effective_at = _compute_cancel_effective_at(
        now=now,
        current_period_end=current_period_end,
        effective_mode=req.effective_mode,
    )

    # Capture old status before update
    old_status = sub.status

    # Update subscription
    sub.status = "cancellation_requested"
    sub.cancel_requested_at = now
    sub.cancel_effective_at = effective_at
    sub.cancel_reason = req.reason
    sub.updated_at = now
    db.add(sub)

    # Write event
    _write_subscription_event(
        db,
        subscription_id=subscription_id,
        event_type="cancellation_requested",
        actor_user_id=user_id,
        actor_role=role,
        from_status=old_status,
        to_status="cancellation_requested",
        payload={
            "effective_at": effective_at.isoformat(),
            "reason": req.reason,
            "effective_mode": req.effective_mode,
        },
    )

    # Enqueue outbox
    _enqueue_outbox(
        db,
        topic="SubscriptionLifecycle",
        event_name="SubscriptionCancellationRequested",
        payload={
            "subscription_id": str(subscription_id),
            "user_id": str(sub.user_id),
            "effective_at": effective_at.isoformat(),
            "reason": req.reason,
        },
    )

    db.commit()
    db.refresh(sub)

    # Best-effort notification
    correlation_id = getattr(request.state, "correlation_id", str(uuid4()))
    await _notify_subscriber(
        subscription_id=subscription_id,
        user_id=sub.user_id,
        template_key="subscription_cancellation_requested",
        context={
            "subscription_id": str(subscription_id),
            "effective_at": effective_at.isoformat(),
            "reason": req.reason,
        },
        correlation_id=correlation_id,
    )

    return _subscription_to_response(sub)


@app.post("/api/v1/subscriptions/internal/cancellation/finalize-due", response_model=list[SubscriptionResponse])
async def finalize_due_cancellations(
    db: Session = Depends(get_db),
    x_internal_api_key: str | None = Header(default=None, alias="X-Internal-API-Key"),
    request: Request = None,
):
    """Internal endpoint to finalize cancellations where cancel_effective_at <= now."""
    _require_internal(x_internal_api_key)

    now = datetime.now(timezone.utc)
    due_subs = db.execute(
        select(Subscription).where(
            Subscription.status == "cancellation_requested",
            Subscription.cancel_effective_at <= now,
        )
    ).scalars().all()

    finalized = []
    correlation_id = getattr(request.state, "correlation_id", str(uuid4()))

    for sub in due_subs:
        old_status = sub.status
        sub.status = "cancelled"
        sub.updated_at = now
        db.add(sub)

        # Write event
        _write_subscription_event(
            db,
            subscription_id=sub.id,
            event_type="cancelled",
            actor_user_id=None,
            actor_role="system",
            from_status=old_status,
            to_status="cancelled",
            payload={"finalized_at": now.isoformat()},
        )

        # Enqueue outbox
        _enqueue_outbox(
            db,
            topic="SubscriptionLifecycle",
            event_name="SubscriptionCancelled",
            payload={
                "subscription_id": str(sub.id),
                "user_id": str(sub.user_id),
                "finalized_at": now.isoformat(),
            },
        )

        # Best-effort notification
        await _notify_subscriber(
            subscription_id=sub.id,
            user_id=sub.user_id,
            template_key="subscription_cancelled",
            context={"subscription_id": str(sub.id)},
            correlation_id=correlation_id,
        )

        finalized.append(_subscription_to_response(sub))

    db.commit()
    return finalized


@app.get("/api/v1/subscriptions/{subscription_id}/events", response_model=SubscriptionEventListResponse)
async def list_subscription_events(
    subscription_id: UUID,
    db: Session = Depends(get_db),
    x_user_id: str | None = Header(default=None),
    x_user_role: str | None = Header(default=None),
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
):
    """List subscription events. Subscriber can view own, admin can view any."""
    user_id = _require_user_id(x_user_id)
    role = str(x_user_role or "")

    sub = db.get(Subscription, subscription_id)
    if not sub:
        raise HTTPException(status_code=404, detail="Subscription not found")

    # Authorization
    if role == "subscriber" and sub.user_id != user_id:
        raise HTTPException(status_code=403, detail="Forbidden")
    if role not in {"subscriber", "admin"}:
        raise HTTPException(status_code=403, detail="Forbidden")

    stmt = select(SubscriptionEvent).where(SubscriptionEvent.subscription_id == subscription_id)
    total = int(db.execute(select(func.count()).select_from(stmt.subquery())).scalar_one())
    rows = db.execute(
        stmt.order_by(SubscriptionEvent.created_at.desc()).limit(limit).offset(offset)
    ).scalars().all()

    return SubscriptionEventListResponse(
        items=[
            SubscriptionEventResponse(
                id=e.id,
                subscription_id=e.subscription_id,
                event_type=e.event_type,
                actor_user_id=e.actor_user_id,
                actor_role=e.actor_role,
                from_status=e.from_status,
                to_status=e.to_status,
                from_plan_id=e.from_plan_id,
                to_plan_id=e.to_plan_id,
                payload=e.payload,
                created_at=e.created_at,
            )
            for e in rows
        ],
        total=total,
    )


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        app,
        host="0.0.0.0",
        port=int(os.getenv("SERVICE_PORT", "8000")),
        log_level=LOG_LEVEL.lower(),
    )
