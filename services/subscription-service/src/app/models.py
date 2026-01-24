import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, Numeric, String
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column

from .db import Base


class Subscription(Base):
    __tablename__ = "subscriptions"
    __table_args__ = {"schema": "subscription"}

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), nullable=False, index=True)
    plan_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), nullable=False)
    status: Mapped[str] = mapped_column(String(16), nullable=False, default="active")  # active/cancelled/paused
    billing_period: Mapped[str] = mapped_column(String(16), nullable=False)  # monthly/quarterly/yearly
    auto_renew: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    start_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    # Purchase-date based anchor for renewals (admin can override later)
    renewal_anchor_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    next_renewal_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    next_renewal_override_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    end_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    meta: Mapped[dict | None] = mapped_column("metadata", JSONB, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)


class TaxConfig(Base):
    __tablename__ = "tax_configs"
    __table_args__ = {"schema": "subscription"}

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    service_type: Mapped[str] = mapped_column(String(16), nullable=False, unique=True, index=True)  # rental/service
    gst_percent: Mapped[float] = mapped_column(Numeric(5, 2), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)


class Order(Base):
    __tablename__ = "orders"
    __table_args__ = {"schema": "subscription"}

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    subscription_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), nullable=False, index=True)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), nullable=False, index=True)
    order_type: Mapped[str] = mapped_column(String(16), nullable=False)  # purchase | renewal
    service_type: Mapped[str] = mapped_column(String(16), nullable=False)  # rental | service

    base_amount: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)
    discount_amount: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)
    credit_applied_amount: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False, default=0)
    amount_before_gst: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)
    gst_percent: Mapped[float] = mapped_column(Numeric(5, 2), nullable=False)
    gst_amount: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)
    total_amount: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)

    promo_code: Mapped[str | None] = mapped_column(String(64), nullable=True)
    referral_code: Mapped[str | None] = mapped_column(String(64), nullable=True)
    applied_codes: Mapped[list | None] = mapped_column(JSONB, nullable=True)

    applied_credit_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), nullable=True)
    payment_intent_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), nullable=True, index=True)
    status: Mapped[str] = mapped_column(String(16), nullable=False, default="paid")  # paid|failed|pending
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)

