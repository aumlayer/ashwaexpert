import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from .db import Base


class Lead(Base):
    __tablename__ = "leads"
    __table_args__ = {"schema": "lead"}

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    email: Mapped[str] = mapped_column(String(255), nullable=False)
    phone: Mapped[str | None] = mapped_column(String(32), nullable=True)
    company: Mapped[str | None] = mapped_column(String(255), nullable=True)
    customer_type: Mapped[str | None] = mapped_column(String(32), nullable=True)
    service_category: Mapped[str | None] = mapped_column(String(32), nullable=True)
    state: Mapped[str | None] = mapped_column(String(64), nullable=True)
    city: Mapped[str | None] = mapped_column(String(64), nullable=True)
    locality: Mapped[str | None] = mapped_column(String(128), nullable=True)
    preferred_datetime: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    appliance_category: Mapped[str | None] = mapped_column(String(64), nullable=True)
    appliance_brand: Mapped[str | None] = mapped_column(String(64), nullable=True)
    appliance_model: Mapped[str | None] = mapped_column(String(64), nullable=True)
    urgency: Mapped[str | None] = mapped_column(String(16), nullable=True)
    preferred_contact_method: Mapped[str | None] = mapped_column(String(16), nullable=True)
    message: Mapped[str | None] = mapped_column(Text, nullable=True)
    source: Mapped[str] = mapped_column(String(32), nullable=False, default="website")
    status: Mapped[str] = mapped_column(String(32), nullable=False, default="new")
    priority: Mapped[str] = mapped_column(String(16), nullable=False, default="medium")
    assigned_to: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    closed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)


class LeadActivity(Base):
    __tablename__ = "lead_activities"
    __table_args__ = {"schema": "lead"}

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    lead_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("lead.leads.id"))
    activity_type: Mapped[str] = mapped_column(String(32), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    performed_by: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)

