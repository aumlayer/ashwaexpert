import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, Integer, Numeric, String, Text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column

from .db import Base


class Coupon(Base):
    __tablename__ = "coupons"
    __table_args__ = {"schema": "coupon"}

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    code: Mapped[str] = mapped_column(String(64), unique=True, nullable=False, index=True)
    kind: Mapped[str] = mapped_column(String(16), nullable=False)  # promo | referral
    campaign_name: Mapped[str | None] = mapped_column(String(64), nullable=True)

    discount_type: Mapped[str] = mapped_column(String(16), nullable=False)  # percent | fixed
    discount_value: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)

    applies_to: Mapped[dict | list | None] = mapped_column(JSONB, nullable=True)
    min_amount: Mapped[float | None] = mapped_column(Numeric(10, 2), nullable=True)
    max_redemptions: Mapped[int | None] = mapped_column(Integer, nullable=True)
    per_user_limit: Mapped[int | None] = mapped_column(Integer, nullable=True)
    redeemed_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    valid_from: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    valid_to: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)

    # Referral coupons: who owns the referral
    referrer_user_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), nullable=True)

    created_by: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)


class ReferralProgram(Base):
    __tablename__ = "referral_programs"
    __table_args__ = {"schema": "coupon"}

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    referrer_credit_amount: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)
    referred_percent: Mapped[int] = mapped_column(Integer, nullable=False)
    active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)


class UserCredit(Base):
    __tablename__ = "user_credits"
    __table_args__ = {"schema": "coupon"}

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), nullable=False, index=True)
    credit_type: Mapped[str] = mapped_column(String(16), nullable=False)  # percent | fixed
    credit_value: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)
    status: Mapped[str] = mapped_column(String(16), nullable=False, default="pending")  # pending | applied
    source: Mapped[str] = mapped_column(String(32), nullable=False, default="referral")
    applies_to: Mapped[str | None] = mapped_column(String(32), nullable=True)
    order_ref: Mapped[str | None] = mapped_column(String(128), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    applied_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    note: Mapped[str | None] = mapped_column(Text, nullable=True)


class CouponRedemption(Base):
    __tablename__ = "coupon_redemptions"
    __table_args__ = {"schema": "coupon"}

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    coupon_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), nullable=False)
    redeemed_by_user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), nullable=False)
    order_ref: Mapped[str | None] = mapped_column(String(128), nullable=True)
    base_amount: Mapped[float | None] = mapped_column(Numeric(10, 2), nullable=True)
    discount_amount: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)
    created_credit_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), nullable=True)
    redeemed_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    meta: Mapped[dict | None] = mapped_column("metadata", JSONB, nullable=True)

