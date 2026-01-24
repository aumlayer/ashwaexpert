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
    created_at: datetime
    updated_at: datetime


class TicketListResponse(BaseModel):
    items: list[TicketResponse]
    total: int

