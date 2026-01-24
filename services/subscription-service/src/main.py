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
from fastapi import Depends, FastAPI, Header, HTTPException, Query, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
from prometheus_client import CONTENT_TYPE_LATEST, Counter, Histogram, generate_latest
from sqlalchemy import and_, func, select
from sqlalchemy.orm import Session

from app.deps import get_db
from app.models import Order, Subscription, TaxConfig
from app.schemas import (
    OrderResponse,
    OrderListResponse,
    InternalMarkOrderPaidRequest,
    PurchaseRequest,
    SubscriptionCreateRequest,
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
COUPON_SERVICE_URL = os.getenv("COUPON_SERVICE_URL", "")
PAYMENT_SERVICE_URL = os.getenv("PAYMENT_SERVICE_URL", "")
BILLING_SERVICE_URL = os.getenv("BILLING_SERVICE_URL", "")
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

if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        app,
        host="0.0.0.0",
        port=int(os.getenv("SERVICE_PORT", "8000")),
        log_level=LOG_LEVEL.lower(),
    )
