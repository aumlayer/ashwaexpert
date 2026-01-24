from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import DateTime, Integer, Numeric, String
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column

from .db import Base


class InvoiceSequence(Base):
    __tablename__ = "invoice_sequences"
    __table_args__ = {"schema": "billing"}

    fiscal_year: Mapped[str] = mapped_column(String(16), primary_key=True)
    next_num: Mapped[int] = mapped_column(Integer, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)


class Invoice(Base):
    __tablename__ = "invoices"
    __table_args__ = {"schema": "billing"}

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    invoice_number: Mapped[str] = mapped_column(String(32), nullable=False, unique=True, index=True)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), nullable=False, index=True)
    order_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), nullable=False, unique=True, index=True)
    status: Mapped[str] = mapped_column(String(16), nullable=False, default="issued")  # issued|paid|cancelled

    base_amount: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)
    discount_amount: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)
    credit_applied_amount: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)
    amount_before_gst: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)
    gst_percent: Mapped[float] = mapped_column(Numeric(5, 2), nullable=False)
    gst_amount: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)
    total_amount: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)

    meta: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)

