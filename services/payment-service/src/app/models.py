from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import DateTime, Numeric, String
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column

from .db import Base


class PaymentIntent(Base):
    __tablename__ = "payment_intents"
    __table_args__ = {"schema": "payment"}

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), nullable=False, index=True)
    reference_type: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    reference_id: Mapped[str] = mapped_column(String(128), nullable=False, index=True)
    amount: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)
    currency: Mapped[str] = mapped_column(String(3), nullable=False, default="INR")
    status: Mapped[str] = mapped_column(String(16), nullable=False, default="created")  # created|paid|failed
    provider: Mapped[str] = mapped_column(String(32), nullable=False, default="mock")
    meta: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)


class PaymentGatewayConfig(Base):
    __tablename__ = "gateway_configs"
    __table_args__ = {"schema": "payment"}

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    provider: Mapped[str] = mapped_column(String(32), nullable=False)  # mock|cashfree|razorpay
    mode: Mapped[str] = mapped_column(String(16), nullable=False, default="sandbox")  # sandbox|live
    is_active: Mapped[bool] = mapped_column(nullable=False, default=True)
    credentials: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)

