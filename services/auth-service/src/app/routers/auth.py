import os
import uuid
from datetime import datetime, timedelta, timezone
from typing import Optional

import httpx
from fastapi import APIRouter, Depends, Header, HTTPException, Query, Request, status
from sqlalchemy import and_, desc, or_, select, text
from sqlalchemy.orm import Session

from ..deps import get_db
from ..models import OtpEvent, Session as UserSession, User
from ..schemas import (
    InternalUserLookupResponse,
    LogoutRequest,
    MeResponse,
    OtpRequestRequest,
    OtpRequestResponse,
    OtpVerifyRequest,
    PasswordLoginRequest,
    RefreshRequest,
    RefreshResponse,
    RegisterRequest,
    RegisterResponse,
    StaffCreateRequest,
    TokenResponse,
    TokenUser,
    UpdateUserCapabilitiesRequest,
    UserListItem,
    UserListResponse,
    ValidateRequest,
    ValidateResponse,
)
from ..security import (
    create_access_token,
    decode_access_token,
    hash_otp,
    hash_password,
    try_decode_access_token,
    verify_otp,
    verify_password,
)

router = APIRouter(prefix="/api/v1/auth", tags=["auth"])


def _now() -> datetime:
    return datetime.now(timezone.utc)


def _access_ttl_minutes() -> int:
    return int(os.getenv("JWT_ACCESS_TOKEN_EXPIRE_MINUTES", "60"))


def _refresh_ttl_days() -> int:
    return int(os.getenv("JWT_REFRESH_TOKEN_EXPIRE_DAYS", "30"))


def _otp_expire_minutes() -> int:
    return int(os.getenv("OTP_EXPIRE_MINUTES", "5"))


def _dev_static_otp() -> str:
    return os.getenv("DEV_STATIC_OTP", "123456")


def _issue_tokens(db: Session, user: User, request: Request) -> TokenResponse:
    access_token = create_access_token(
        user_id=user.id,
        role=user.role,
        email=user.email,
        expires_minutes=_access_ttl_minutes(),
    )

    refresh_token = str(uuid.uuid4())
    session = UserSession(
        user_id=user.id,
        refresh_token=refresh_token,
        device_info=None,
        ip_address=request.client.host if request.client else None,
        user_agent=request.headers.get("user-agent"),
        expires_at=_now() + timedelta(days=_refresh_ttl_days()),
        created_at=_now(),
        last_used_at=_now(),
    )
    db.add(session)
    user.last_login_at = _now()
    user.updated_at = _now()
    db.commit()

    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        expires_in=_access_ttl_minutes() * 60,
        user=TokenUser(
            id=user.id,
            email=user.email,  # type: ignore[arg-type]
            role=user.role,  # type: ignore[arg-type]
            subscriber_id=getattr(user, "subscriber_id", None),
            can_assign_leads=bool(getattr(user, "can_assign_leads", False)),
            can_manage_unassigned_leads=bool(getattr(user, "can_manage_unassigned_leads", False)),
        ),
    )


async def _create_subscriber_profile_if_needed(user: User, req: RegisterRequest) -> None:
    if user.role != "subscriber":
        return

    base_url = os.getenv("SUBSCRIBER_SERVICE_URL", "")
    if not base_url:
        return

    internal_key = os.getenv("INTERNAL_API_KEY", "")
    if not internal_key:
        return

    payload = {
        "user_id": str(user.id),
        "email": user.email,
        "phone": user.phone,
        "first_name": req.first_name or "Unknown",
        "last_name": req.last_name or "Unknown",
    }

    async with httpx.AsyncClient(timeout=10.0) as client:
        await client.post(
            f"{base_url}/api/v1/subscribers/internal/from-auth",
            json=payload,
            headers={"X-Internal-API-Key": internal_key},
        )


@router.post("/register", response_model=RegisterResponse, status_code=status.HTTP_201_CREATED)
async def register(req: RegisterRequest, request: Request, db: Session = Depends(get_db)):
    # Staff roles must be created by admin under a subscriber tenant
    if req.role in {"cms_user", "technician"}:
        raise HTTPException(status_code=403, detail="Use admin staff creation for this role")

    if req.phone:
        existing_stmt = select(User).where(or_(User.email == req.email, User.phone == req.phone))
    else:
        existing_stmt = select(User).where(User.email == req.email)
    existing = db.execute(existing_stmt).scalar_one_or_none()
    if existing:
        raise HTTPException(status_code=409, detail="User already exists")

    now = _now()
    # Default capabilities
    can_assign_leads = False
    can_manage_unassigned_leads = False
    if req.role == "admin":
        # Admin can manage everything, but should never be assigned a lead.
        can_assign_leads = True
        can_manage_unassigned_leads = True
    elif req.role == "cms_user":
        # CMS can transition/manage leads even before assignment.
        can_manage_unassigned_leads = True
    elif req.role == "technician":
        # Technician can view all, manage only assigned by default.
        can_manage_unassigned_leads = False

    user = User(
        email=str(req.email),
        phone=req.phone,
        password_hash=hash_password(req.password),
        is_active=True,
        is_verified=False,
        role=req.role,
        subscriber_id=None,
        can_assign_leads=can_assign_leads,
        can_manage_unassigned_leads=can_manage_unassigned_leads,
        created_at=now,
        updated_at=now,
        last_login_at=None,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    otp_hash_val = hash_otp(_dev_static_otp())
    otp = OtpEvent(
        user_id=user.id,
        identifier=user.email,
        otp_hash=otp_hash_val,
        purpose="registration",
        is_used=False,
        expires_at=now + timedelta(minutes=_otp_expire_minutes()),
        created_at=now,
    )
    db.add(otp)
    db.commit()

    # Best-effort subscriber profile creation (Phase 2: synchronous for local dev)
    try:
        await _create_subscriber_profile_if_needed(user, req)
    except Exception:
        # Don’t block registration in Phase 2 local dev
        pass

    return RegisterResponse(
        user_id=user.id,
        email=user.email,  # type: ignore[arg-type]
        message="Registration successful. OTP sent.",
    )


@router.post("/otp/request", response_model=OtpRequestResponse)
async def otp_request(req: OtpRequestRequest, db: Session = Depends(get_db)):
    user = db.execute(
        select(User).where(or_(User.email == req.identifier, User.phone == req.identifier))
    ).scalar_one_or_none()

    now = _now()
    otp = OtpEvent(
        user_id=user.id if user else None,
        identifier=req.identifier,
        otp_hash=hash_otp(_dev_static_otp()),
        purpose=req.purpose,
        is_used=False,
        expires_at=now + timedelta(minutes=_otp_expire_minutes()),
        created_at=now,
    )
    db.add(otp)
    db.commit()
    return OtpRequestResponse(message="OTP sent successfully", expires_in_seconds=_otp_expire_minutes() * 60)


@router.post("/otp/verify", response_model=TokenResponse)
async def otp_verify(req: OtpVerifyRequest, request: Request, db: Session = Depends(get_db)):
    stmt = (
        select(OtpEvent)
        .where(
            and_(
                OtpEvent.identifier == req.identifier,
                OtpEvent.purpose == req.purpose,
                OtpEvent.is_used.is_(False),
                OtpEvent.expires_at > _now(),
            )
        )
        .order_by(desc(OtpEvent.created_at))
        .limit(1)
    )
    otp = db.execute(stmt).scalar_one_or_none()
    if not otp:
        raise HTTPException(status_code=400, detail="OTP not found or expired")

    if not verify_otp(req.otp_code, otp.otp_hash):
        raise HTTPException(status_code=401, detail="Invalid OTP")

    otp.is_used = True
    db.add(otp)

    user: Optional[User] = None
    if otp.user_id:
        user = db.get(User, otp.user_id)

    if not user:
        # Best-effort lookup
        user = db.execute(select(User).where(User.email == req.identifier)).scalar_one_or_none()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if req.purpose == "registration":
        user.is_verified = True
        user.updated_at = _now()
        db.add(user)
        db.commit()

    return _issue_tokens(db, user, request)


@router.post("/login", response_model=TokenResponse)
async def login(req: PasswordLoginRequest, request: Request, db: Session = Depends(get_db)):
    user = db.execute(select(User).where(User.email == str(req.email))).scalar_one_or_none()
    if not user or not verify_password(req.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    if not user.is_active:
        raise HTTPException(status_code=403, detail="User is inactive")
    return _issue_tokens(db, user, request)


@router.post("/refresh", response_model=RefreshResponse)
async def refresh(req: RefreshRequest, db: Session = Depends(get_db)):
    session = db.execute(select(UserSession).where(UserSession.refresh_token == req.refresh_token)).scalar_one_or_none()
    if not session or session.expires_at <= _now():
        raise HTTPException(status_code=401, detail="Invalid refresh token")

    user = db.get(User, session.user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    session.last_used_at = _now()
    db.add(session)
    db.commit()

    access_token = create_access_token(
        user_id=user.id,
        role=user.role,
        email=user.email,
        expires_minutes=_access_ttl_minutes(),
    )
    return RefreshResponse(access_token=access_token, expires_in=_access_ttl_minutes() * 60)


@router.post("/logout")
async def logout(
    req: LogoutRequest,
    db: Session = Depends(get_db),
    authorization: Optional[str] = Header(default=None),
):
    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(status_code=401, detail="Missing bearer token")

    session = db.execute(select(UserSession).where(UserSession.refresh_token == req.refresh_token)).scalar_one_or_none()
    if session:
        db.delete(session)
        db.commit()
    return {"message": "Logged out successfully"}


@router.post("/validate", response_model=ValidateResponse)
async def validate(req: ValidateRequest, db: Session = Depends(get_db)):
    payload = try_decode_access_token(req.token)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid token")
    user = db.get(User, uuid.UUID(payload["sub"]))
    if not user or not user.is_active:
        raise HTTPException(status_code=401, detail="Invalid token")
    return ValidateResponse(
        valid=True,
        user_id=user.id,
        email=user.email,  # type: ignore[arg-type]
        role=user.role,  # type: ignore[arg-type]
        subscriber_id=getattr(user, "subscriber_id", None),
        can_assign_leads=bool(user.can_assign_leads),
        can_manage_unassigned_leads=bool(user.can_manage_unassigned_leads),
        expires_at=datetime.fromtimestamp(payload["exp"], tz=timezone.utc),
    )


@router.get("/me", response_model=MeResponse)
async def me(authorization: Optional[str] = Header(default=None), db: Session = Depends(get_db)):
    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(status_code=401, detail="Missing bearer token")
    token = authorization.split(" ", 1)[1].strip()
    payload = decode_access_token(token)
    user = db.get(User, uuid.UUID(payload["sub"]))
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return MeResponse(
        id=user.id,
        email=user.email,  # type: ignore[arg-type]
        phone=user.phone,
        role=user.role,  # type: ignore[arg-type]
        subscriber_id=getattr(user, "subscriber_id", None),
        can_assign_leads=bool(user.can_assign_leads),
        can_manage_unassigned_leads=bool(user.can_manage_unassigned_leads),
        is_active=user.is_active,
        is_verified=user.is_verified,
    )


def _require_admin(authorization: Optional[str]) -> dict:
    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(status_code=401, detail="Missing bearer token")
    token = authorization.split(" ", 1)[1].strip()
    payload = decode_access_token(token)
    if payload.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Forbidden")
    return payload


@router.get("/users", response_model=UserListResponse)
async def list_users(
    authorization: Optional[str] = Header(default=None),
    db: Session = Depends(get_db),
    role: Optional[str] = Query(default=None),
    q: Optional[str] = Query(default=None),
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
):
    _require_admin(authorization)
    stmt = select(User)
    if role:
        stmt = stmt.where(User.role == role)
    if q:
        like = f"%{q}%"
        stmt = stmt.where(or_(User.email.ilike(like), User.phone.ilike(like)))
    total = len(db.execute(stmt).scalars().all())
    rows = db.execute(stmt.order_by(User.created_at.desc()).limit(limit).offset(offset)).scalars().all()
    return UserListResponse(
        items=[
            UserListItem(
                id=u.id,
                email=u.email,  # type: ignore[arg-type]
                phone=u.phone,
                role=u.role,  # type: ignore[arg-type]
                is_active=u.is_active,
                is_verified=u.is_verified,
                subscriber_id=getattr(u, "subscriber_id", None),
                can_assign_leads=bool(u.can_assign_leads),
                can_manage_unassigned_leads=bool(u.can_manage_unassigned_leads),
            )
            for u in rows
        ],
        total=total,
    )


@router.patch("/users/{user_id}/capabilities", response_model=UserListItem)
async def update_user_capabilities(
    user_id: uuid.UUID,
    req: UpdateUserCapabilitiesRequest,
    authorization: Optional[str] = Header(default=None),
    db: Session = Depends(get_db),
):
    _require_admin(authorization)
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if req.can_assign_leads is not None:
        user.can_assign_leads = req.can_assign_leads
    if req.can_manage_unassigned_leads is not None:
        user.can_manage_unassigned_leads = req.can_manage_unassigned_leads
    user.updated_at = _now()
    db.add(user)
    db.commit()
    db.refresh(user)

    return UserListItem(
        id=user.id,
        email=user.email,  # type: ignore[arg-type]
        phone=user.phone,
        role=user.role,  # type: ignore[arg-type]
        is_active=user.is_active,
        is_verified=user.is_verified,
        subscriber_id=getattr(user, "subscriber_id", None),
        can_assign_leads=bool(user.can_assign_leads),
        can_manage_unassigned_leads=bool(user.can_manage_unassigned_leads),
    )


@router.get("/internal/users/{user_id}", response_model=InternalUserLookupResponse)
async def internal_user_lookup(
    user_id: uuid.UUID,
    db: Session = Depends(get_db),
    x_internal_api_key: Optional[str] = Header(default=None, alias="X-Internal-API-Key"),
):
    expected = os.getenv("INTERNAL_API_KEY", "")
    if not expected or x_internal_api_key != expected:
        raise HTTPException(status_code=401, detail="Invalid internal key")
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return InternalUserLookupResponse(id=user.id, role=user.role)  # type: ignore[arg-type]


@router.post("/subscribers/{subscriber_id}/staff", response_model=UserListItem, status_code=status.HTTP_201_CREATED)
async def admin_create_staff_user(
    subscriber_id: uuid.UUID,
    req: StaffCreateRequest,
    authorization: Optional[str] = Header(default=None),
    db: Session = Depends(get_db),
):
    _require_admin(authorization)

    # Resolve subscriber owner user_id
    row = db.execute(
        text("SELECT user_id FROM subscriber.subscribers WHERE id = :sid LIMIT 1"),
        {"sid": str(subscriber_id)},
    ).fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="Subscriber not found")
    subscriber_owner_user_id = str(row[0])

    # Read plan limits for that subscriber's active subscription
    limits_row = db.execute(
        text(
            """
            SELECT p.limits
            FROM subscription.subscriptions s
            JOIN plan.plans p ON p.id = s.plan_id
            WHERE s.user_id = :uid AND s.status = 'active'
            ORDER BY s.created_at DESC
            LIMIT 1
            """
        ),
        {"uid": subscriber_owner_user_id},
    ).fetchone()
    limits = limits_row[0] if limits_row and isinstance(limits_row[0], dict) else {}

    max_users: int | None = None
    try:
        if limits and limits.get("number_of_users") is not None:
            max_users = int(limits.get("number_of_users"))
    except Exception:
        max_users = None

    if max_users and max_users > 0:
        used = int(
            db.execute(
                text(
                    """
                    SELECT count(*) FROM auth.users
                    WHERE subscriber_id = :sid AND is_active = true AND role in ('cms_user','technician')
                    """
                ),
                {"sid": str(subscriber_id)},
            ).scalar_one()
        )
        if used >= max_users:
            raise HTTPException(status_code=403, detail="User limit reached for this subscriber")

    # Uniqueness checks
    if req.phone:
        existing_stmt = select(User).where(or_(User.email == req.email, User.phone == req.phone))
    else:
        existing_stmt = select(User).where(User.email == req.email)
    existing = db.execute(existing_stmt).scalar_one_or_none()
    if existing:
        raise HTTPException(status_code=409, detail="User already exists")

    now = _now()
    can_assign_leads = False
    can_manage_unassigned_leads = False
    if req.role == "cms_user":
        can_manage_unassigned_leads = True

    user = User(
        email=str(req.email),
        phone=req.phone,
        password_hash=hash_password(req.password),
        is_active=True,
        is_verified=False,
        role=req.role,
        subscriber_id=subscriber_id,
        can_assign_leads=can_assign_leads,
        can_manage_unassigned_leads=can_manage_unassigned_leads,
        created_at=now,
        updated_at=now,
        last_login_at=None,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    return UserListItem(
        id=user.id,
        email=user.email,  # type: ignore[arg-type]
        phone=user.phone,
        role=user.role,  # type: ignore[arg-type]
        is_active=user.is_active,
        is_verified=user.is_verified,
        subscriber_id=getattr(user, "subscriber_id", None),
        can_assign_leads=bool(user.can_assign_leads),
        can_manage_unassigned_leads=bool(user.can_manage_unassigned_leads),
    )

