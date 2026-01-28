from __future__ import annotations

from datetime import datetime
from typing import Literal, Optional
from uuid import UUID

from pydantic import BaseModel, Field


TicketType = Literal["installation", "service", "repair"]
TicketPriority = Literal["low", "medium", "high", "urgent"]
TicketStatus = Literal["created", "assigned", "in_progress", "completed", "closed", "cancelled"]


class TicketCreateRequest(BaseModel):
    ticket_type: TicketType
    priority: TicketPriority = "medium"
    title: str = Field(min_length=3, max_length=255)
    description: str = Field(min_length=3)
    location_address: Optional[str] = None


class TicketResponse(BaseModel):
    id: UUID
    ticket_number: str
    subscriber_id: UUID
    subscription_id: Optional[UUID] = None
    ticket_type: TicketType
    priority: TicketPriority
    status: TicketStatus
    title: str
    description: str
    location_address: Optional[str] = None
    assigned_technician_id: Optional[UUID] = None
    sla_due_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime


class TicketDetailResponse(TicketResponse):
    status_history: Optional[list["TicketStatusHistoryResponse"]] = None


class TicketStatusUpdateRequest(BaseModel):
    status: TicketStatus
    completion_notes: Optional[str] = Field(default=None, description="Required when status=completed")


class TicketStatusHistoryResponse(BaseModel):
    id: UUID
    ticket_id: UUID
    from_status: Optional[str]
    to_status: str
    actor_user_id: Optional[UUID]
    actor_role: Optional[str]
    notes: Optional[str]
    created_at: datetime


class TicketListResponse(BaseModel):
    items: list[TicketResponse]
    total: int


class SlaConfigResponse(BaseModel):
    id: UUID
    ticket_type: str
    priority: str
    due_hours: int
    is_active: bool
    created_at: datetime
    updated_at: datetime


class SlaConfigUpsertRequest(BaseModel):
    ticket_type: TicketType
    priority: TicketPriority
    due_hours: int = Field(gt=0, le=8760)  # max 1 year
    is_active: bool = True

