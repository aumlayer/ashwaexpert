import json
import logging
import os
import random
import string
import time
from datetime import datetime, timezone
from uuid import UUID, uuid4

from fastapi import Depends, FastAPI, Header, HTTPException, Query, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
from prometheus_client import CONTENT_TYPE_LATEST, Counter, Histogram, generate_latest
from sqlalchemy import and_, desc, func, select
from sqlalchemy.orm import Session

from app.deps import get_db
from app.models import Coupon, CouponRedemption, ReferralProgram, UserCredit
from app.schemas import (
    CouponCreateRequest,
    CouponListResponse,
    CouponResponse,
    InternalApplyCreditRequest,
    InternalValidateRequest,
    InternalValidateResponse,
    InternalRedeemRequest,
    InternalRedeemResponse,
    ReferralGenerateResponse,
    ReferralProgramResponse,
    ReferralProgramUpdateRequest,
    UserCreditListResponse,
    UserCreditResponse,
)

SERVICE_NAME = os.getenv("SERVICE_NAME", "coupon-service")
SERVICE_VERSION = os.getenv("SERVICE_VERSION", "0.1.0")
ENVIRONMENT = os.getenv("ENVIRONMENT", "local")
LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO")
CORS_ORIGINS = os.getenv("CORS_ORIGINS", "*")
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


def _now() -> datetime:
    return datetime.now(timezone.utc)


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
        REQUEST_LATENCY.labels(service=SERVICE_NAME, method=request.method, path=request.url.path).observe(
            duration
        )
        _log_event(request, status_code, duration)


def _require_internal(x_internal_api_key: str | None) -> None:
    if not INTERNAL_API_KEY or x_internal_api_key != INTERNAL_API_KEY:
        raise HTTPException(status_code=401, detail="Invalid internal key")


def _require_admin(x_user_role: str | None) -> None:
    if (x_user_role or "") != "admin":
        raise HTTPException(status_code=403, detail="Forbidden")


def _require_authenticated_user(x_user_id: str | None) -> UUID:
    if not x_user_id:
        raise HTTPException(status_code=401, detail="Missing X-User-Id")
    try:
        return UUID(x_user_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid X-User-Id")


def _gen_code(prefix: str | None = None, length: int = 10) -> str:
    alphabet = string.ascii_uppercase + string.digits
    core = "".join(random.choice(alphabet) for _ in range(length))
    if prefix:
        return f"{prefix.upper()}{core}"
    return core


def _coupon_to_response(c: Coupon) -> CouponResponse:
    applies_to = c.applies_to if isinstance(c.applies_to, list) else None
    return CouponResponse(
        id=c.id,
        code=c.code,
        kind=c.kind,  # type: ignore[arg-type]
        campaign_name=c.campaign_name,
        discount_type=c.discount_type,  # type: ignore[arg-type]
        discount_value=float(c.discount_value),
        applies_to=applies_to,
        min_amount=float(c.min_amount) if c.min_amount is not None else None,
        max_redemptions=c.max_redemptions,
        per_user_limit=c.per_user_limit,
        redeemed_count=c.redeemed_count,
        valid_from=c.valid_from,
        valid_to=c.valid_to,
        active=c.active,
        referrer_user_id=c.referrer_user_id,
        created_at=c.created_at,
        updated_at=c.updated_at,
    )


def _ensure_default_referral_program(db: Session) -> ReferralProgram:
    rp = (
        db.execute(select(ReferralProgram).where(ReferralProgram.active.is_(True)).order_by(desc(ReferralProgram.created_at)))
        .scalars()
        .first()
    )
    if rp:
        return rp
    # Defaults can be overridden by admin at any time.
    rp = ReferralProgram(referrer_credit_amount=100.0, referred_percent=5, active=True, created_at=_now())
    db.add(rp)
    db.commit()
    db.refresh(rp)
    return rp


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


# --- Admin coupon management ---


@app.post("/api/v1/coupons", response_model=CouponResponse, status_code=status.HTTP_201_CREATED)
async def create_coupon(
    req: CouponCreateRequest,
    db: Session = Depends(get_db),
    x_user_role: str | None = Header(default=None),
    x_user_id: str | None = Header(default=None),
):
    _require_admin(x_user_role)
    creator = _require_authenticated_user(x_user_id)
    code = (req.code or "").strip().upper() or _gen_code(prefix=req.campaign_name and f"{req.campaign_name}_")

    existing = db.execute(select(Coupon).where(Coupon.code == code)).scalar_one_or_none()
    if existing:
        raise HTTPException(status_code=409, detail="Coupon code already exists")

    now = _now()
    c = Coupon(
        code=code,
        kind=req.kind,
        campaign_name=req.campaign_name,
        discount_type=req.discount_type,
        discount_value=req.discount_value,
        applies_to=req.applies_to,
        min_amount=req.min_amount,
        max_redemptions=req.max_redemptions,
        per_user_limit=req.per_user_limit,
        redeemed_count=0,
        valid_from=req.valid_from,
        valid_to=req.valid_to,
        active=req.active,
        referrer_user_id=None,
        created_by=creator,
        created_at=now,
        updated_at=now,
    )
    db.add(c)
    db.commit()
    db.refresh(c)
    return _coupon_to_response(c)


@app.get("/api/v1/coupons", response_model=CouponListResponse)
async def list_coupons(
    db: Session = Depends(get_db),
    x_user_role: str | None = Header(default=None),
    q: str | None = Query(default=None),
    kind: str | None = Query(default=None),
    active: bool | None = Query(default=None),
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
):
    _require_admin(x_user_role)
    stmt = select(Coupon)
    if q:
        like = f"%{q.upper()}%"
        stmt = stmt.where(Coupon.code.ilike(like))
    if kind:
        stmt = stmt.where(Coupon.kind == kind)
    if active is not None:
        stmt = stmt.where(Coupon.active.is_(active))
    total = int(db.execute(select(func.count()).select_from(stmt.subquery())).scalar_one())
    rows = db.execute(stmt.order_by(Coupon.created_at.desc()).limit(limit).offset(offset)).scalars().all()
    return CouponListResponse(items=[_coupon_to_response(c) for c in rows], total=total)


# --- Referral program + user referral code ---


@app.put("/api/v1/coupons/referrals/program", response_model=ReferralProgramResponse)
async def set_referral_program(
    req: ReferralProgramUpdateRequest,
    db: Session = Depends(get_db),
    x_user_role: str | None = Header(default=None),
):
    _require_admin(x_user_role)
    rp = ReferralProgram(
        referrer_credit_amount=req.referrer_credit_amount,
        referred_percent=req.referred_percent,
        active=req.active,
        created_at=_now(),
    )
    db.add(rp)
    db.commit()
    db.refresh(rp)
    return ReferralProgramResponse(
        referrer_credit_amount=float(rp.referrer_credit_amount),
        referred_percent=rp.referred_percent,
        active=rp.active,
        created_at=rp.created_at,
    )


@app.post("/api/v1/coupons/referrals/generate", response_model=ReferralGenerateResponse)
async def generate_referral_code(
    db: Session = Depends(get_db),
    x_user_id: str | None = Header(default=None),
):
    referrer_user_id = _require_authenticated_user(x_user_id)
    _ensure_default_referral_program(db)

    # One active referral code per user (simple)
    existing = (
        db.execute(
            select(Coupon).where(
                and_(
                    Coupon.kind == "referral",
                    Coupon.referrer_user_id == referrer_user_id,
                    Coupon.active.is_(True),
                )
            )
        )
        .scalars()
        .first()
    )
    if existing:
        return ReferralGenerateResponse(code=existing.code)

    # Generate unique code with REF prefix
    for _ in range(10):
        code = _gen_code(prefix="REF")
        if not db.execute(select(Coupon).where(Coupon.code == code)).scalar_one_or_none():
            break
    else:
        raise HTTPException(status_code=500, detail="Failed to generate referral code")

    now = _now()
    c = Coupon(
        code=code,
        kind="referral",
        campaign_name=None,
        discount_type="percent",
        discount_value=0,  # ignored for referral; program determines discounts
        applies_to=None,
        min_amount=None,
        max_redemptions=None,
        # One activation per referred user is enforced by per_user_limit on redemption checks.
        per_user_limit=1,
        redeemed_count=0,
        valid_from=None,
        valid_to=None,
        active=True,
        referrer_user_id=referrer_user_id,
        created_by=referrer_user_id,
        created_at=now,
        updated_at=now,
    )
    db.add(c)
    db.commit()
    return ReferralGenerateResponse(code=code)


# --- Internal: redeem + credits (to integrate with subscription/billing) ---


@app.post("/api/v1/coupons/internal/redeem", response_model=InternalRedeemResponse)
async def internal_redeem(
    req: InternalRedeemRequest,
    db: Session = Depends(get_db),
    x_internal_api_key: str | None = Header(default=None, alias="X-Internal-API-Key"),
):
    _require_internal(x_internal_api_key)
    rp = _ensure_default_referral_program(db)

    code = req.code.strip().upper()
    coupon = db.execute(select(Coupon).where(Coupon.code == code)).scalar_one_or_none()
    if not coupon or not coupon.active:
        return InternalRedeemResponse(
            valid=False,
            code=code,
            discount_amount=0.0,
            discount_type="percent",
            discount_value=0.0,
        )

    now = _now()
    if coupon.valid_from and now < coupon.valid_from:
        return InternalRedeemResponse(valid=False, code=code, discount_amount=0.0, discount_type="percent", discount_value=0.0)
    if coupon.valid_to and now > coupon.valid_to:
        return InternalRedeemResponse(valid=False, code=code, discount_amount=0.0, discount_type="percent", discount_value=0.0)

    base_amount = float(req.base_amount or 0.0)
    if coupon.min_amount is not None and base_amount and base_amount < float(coupon.min_amount):
        return InternalRedeemResponse(valid=False, code=code, discount_amount=0.0, discount_type=coupon.discount_type, discount_value=float(coupon.discount_value))

    # Max redemptions
    if coupon.max_redemptions is not None and coupon.redeemed_count >= coupon.max_redemptions:
        return InternalRedeemResponse(valid=False, code=code, discount_amount=0.0, discount_type=coupon.discount_type, discount_value=float(coupon.discount_value))

    # Per-user limit
    if coupon.per_user_limit is not None:
        used = (
            db.execute(
                select(func.count())
                .select_from(CouponRedemption)
                .where(
                    and_(
                        CouponRedemption.coupon_id == coupon.id,
                        CouponRedemption.redeemed_by_user_id == req.redeemed_by_user_id,
                    )
                )
            )
            .scalar_one()
        )
        if int(used) >= coupon.per_user_limit:
            return InternalRedeemResponse(valid=False, code=code, discount_amount=0.0, discount_type=coupon.discount_type, discount_value=float(coupon.discount_value))

    created_credit_id: UUID | None = None
    referrer_user_id: UUID | None = None

    # Compute discount
    if coupon.kind == "referral":
        # Prevent self-referrals
        if coupon.referrer_user_id and coupon.referrer_user_id == req.redeemed_by_user_id:
            return InternalRedeemResponse(
                valid=False,
                code=code,
                discount_amount=0.0,
                discount_type="percent",
                discount_value=0.0,
            )
        # Referral: program defines both discounts
        referred_discount_amount = round((rp.referred_percent / 100.0) * base_amount, 2) if base_amount else 0.0
        discount_amount = referred_discount_amount

        # Create credit for referrer to apply on next renewal
        if coupon.referrer_user_id:
            referrer_user_id = coupon.referrer_user_id
            credit = UserCredit(
                user_id=referrer_user_id,
                credit_type="fixed",
                credit_value=float(rp.referrer_credit_amount),
                status="pending",
                source="referral",
                applies_to="rental",
                order_ref=req.order_ref,
                created_at=now,
                applied_at=None,
                note=f"Referral reward for code {code}",
            )
            db.add(credit)
            db.commit()
            db.refresh(credit)
            created_credit_id = credit.id
    else:
        # Promo
        if coupon.discount_type == "percent":
            discount_amount = round((float(coupon.discount_value) / 100.0) * base_amount, 2) if base_amount else 0.0
        else:
            discount_amount = float(coupon.discount_value)

    # Record redemption + bump count
    red = CouponRedemption(
        coupon_id=coupon.id,
        redeemed_by_user_id=req.redeemed_by_user_id,
        order_ref=req.order_ref,
        base_amount=req.base_amount,
        discount_amount=discount_amount,
        created_credit_id=created_credit_id,
        redeemed_at=now,
        meta={"applies_to": req.applies_to},
    )
    coupon.redeemed_count = int(coupon.redeemed_count) + 1
    coupon.updated_at = now
    db.add(red)
    db.add(coupon)
    db.commit()

    return InternalRedeemResponse(
        valid=True,
        code=code,
        discount_amount=discount_amount,
        discount_type=coupon.discount_type,  # type: ignore[arg-type]
        discount_value=float(coupon.discount_value),
        created_credit_id=created_credit_id,
        referrer_user_id=referrer_user_id,
    )


@app.post("/api/v1/coupons/internal/validate", response_model=InternalValidateResponse)
async def internal_validate(
    req: InternalValidateRequest,
    db: Session = Depends(get_db),
    x_internal_api_key: str | None = Header(default=None, alias="X-Internal-API-Key"),
):
    _require_internal(x_internal_api_key)
    rp = _ensure_default_referral_program(db)

    code = req.code.strip().upper()
    coupon = db.execute(select(Coupon).where(Coupon.code == code)).scalar_one_or_none()
    if not coupon or not coupon.active:
        return InternalValidateResponse(
            valid=False,
            code=code,
            discount_amount=0.0,
            discount_type="percent",
            discount_value=0.0,
        )

    now = _now()
    if coupon.valid_from and now < coupon.valid_from:
        return InternalValidateResponse(valid=False, code=code, discount_amount=0.0, discount_type="percent", discount_value=0.0)
    if coupon.valid_to and now > coupon.valid_to:
        return InternalValidateResponse(valid=False, code=code, discount_amount=0.0, discount_type="percent", discount_value=0.0)

    base_amount = float(req.base_amount or 0.0)
    if coupon.min_amount is not None and base_amount and base_amount < float(coupon.min_amount):
        return InternalValidateResponse(
            valid=False,
            code=code,
            discount_amount=0.0,
            discount_type=coupon.discount_type,  # type: ignore[arg-type]
            discount_value=float(coupon.discount_value),
        )

    if coupon.max_redemptions is not None and coupon.redeemed_count >= coupon.max_redemptions:
        return InternalValidateResponse(
            valid=False,
            code=code,
            discount_amount=0.0,
            discount_type=coupon.discount_type,  # type: ignore[arg-type]
            discount_value=float(coupon.discount_value),
        )

    if coupon.per_user_limit is not None:
        used = (
            db.execute(
                select(func.count())
                .select_from(CouponRedemption)
                .where(and_(CouponRedemption.coupon_id == coupon.id, CouponRedemption.redeemed_by_user_id == req.user_id))
            )
            .scalar_one()
        )
        if int(used) >= coupon.per_user_limit:
            return InternalValidateResponse(
                valid=False,
                code=code,
                discount_amount=0.0,
                discount_type=coupon.discount_type,  # type: ignore[arg-type]
                discount_value=float(coupon.discount_value),
            )

    # Compute discount without side effects
    referrer_user_id: UUID | None = None
    if coupon.kind == "referral":
        if coupon.referrer_user_id and coupon.referrer_user_id == req.user_id:
            return InternalValidateResponse(valid=False, code=code, discount_amount=0.0, discount_type="percent", discount_value=0.0)
        referrer_user_id = coupon.referrer_user_id
        discount_amount = round((rp.referred_percent / 100.0) * base_amount, 2) if base_amount else 0.0
        return InternalValidateResponse(
            valid=True,
            code=code,
            discount_amount=discount_amount,
            discount_type="percent",
            discount_value=0.0,
            referrer_user_id=referrer_user_id,
        )

    if coupon.discount_type == "percent":
        discount_amount = round((float(coupon.discount_value) / 100.0) * base_amount, 2) if base_amount else 0.0
    else:
        discount_amount = float(coupon.discount_value)

    return InternalValidateResponse(
        valid=True,
        code=code,
        discount_amount=discount_amount,
        discount_type=coupon.discount_type,  # type: ignore[arg-type]
        discount_value=float(coupon.discount_value),
        referrer_user_id=None,
    )


@app.get("/api/v1/coupons/internal/credits/pending", response_model=UserCreditListResponse)
async def internal_list_pending_credits(
    user_id: UUID,
    db: Session = Depends(get_db),
    x_internal_api_key: str | None = Header(default=None, alias="X-Internal-API-Key"),
):
    _require_internal(x_internal_api_key)
    rows = (
        db.execute(
            select(UserCredit)
            .where(and_(UserCredit.user_id == user_id, UserCredit.status == "pending"))
            .order_by(UserCredit.created_at.asc())
        )
        .scalars()
        .all()
    )
    items = [
        UserCreditResponse(
            id=c.id,
            user_id=c.user_id,
            credit_type=c.credit_type,  # type: ignore[arg-type]
            credit_value=float(c.credit_value),
            status=c.status,  # type: ignore[arg-type]
            source=c.source,
            applies_to=c.applies_to,
            order_ref=c.order_ref,
            created_at=c.created_at,
            applied_at=c.applied_at,
            note=c.note,
        )
        for c in rows
    ]
    return UserCreditListResponse(items=items, total=len(items))


@app.post("/api/v1/coupons/internal/credits/{credit_id}/apply", response_model=UserCreditResponse)
async def internal_apply_credit(
    credit_id: UUID,
    req: InternalApplyCreditRequest,
    db: Session = Depends(get_db),
    x_internal_api_key: str | None = Header(default=None, alias="X-Internal-API-Key"),
):
    _require_internal(x_internal_api_key)
    credit = db.get(UserCredit, credit_id)
    if not credit:
        raise HTTPException(status_code=404, detail="Credit not found")
    if credit.status != "pending":
        raise HTTPException(status_code=409, detail="Credit already applied")
    credit.status = "applied"
    credit.applied_at = _now()
    credit.order_ref = req.order_ref
    if req.note:
        credit.note = req.note
    db.add(credit)
    db.commit()
    db.refresh(credit)
    return UserCreditResponse(
        id=credit.id,
        user_id=credit.user_id,
        credit_type=credit.credit_type,  # type: ignore[arg-type]
        credit_value=float(credit.credit_value),
        status=credit.status,  # type: ignore[arg-type]
        source=credit.source,
        applies_to=credit.applies_to,
        order_ref=credit.order_ref,
        created_at=credit.created_at,
        applied_at=credit.applied_at,
        note=credit.note,
    )


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        app,
        host="0.0.0.0",
        port=int(os.getenv("SERVICE_PORT", "8000")),
        log_level=LOG_LEVEL.lower(),
    )

