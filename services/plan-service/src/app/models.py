import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, Integer, Numeric, String
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column

from .db import Base


class Plan(Base):
    __tablename__ = "plans"
    __table_args__ = {"schema": "plan"}

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    plan_code: Mapped[str] = mapped_column(String(64), nullable=False, unique=True, index=True)
    name: Mapped[str] = mapped_column(String(128), nullable=False)
    category: Mapped[str] = mapped_column(String(32), nullable=False)  # rental | amc | service_bundle
    billing_period: Mapped[str] = mapped_column(String(16), nullable=False)  # monthly | quarterly | yearly | one_time
    price_amount: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)
    price_currency: Mapped[str] = mapped_column(String(3), nullable=False, default="INR")
    trial_days: Mapped[int | None] = mapped_column(Integer, nullable=True)
    active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    limits: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)

