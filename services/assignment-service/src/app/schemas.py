from __future__ import annotations

from datetime import datetime
from typing import Literal, Optional
from uuid import UUID

from pydantic import BaseModel, Field

AssignmentStatus = Literal["assigned", "accepted", "rejected", "unassigned", "completed"]


class AssignmentCreateRequest(BaseModel):
    ticket_id: UUID
    technician_id: UUID
    notes: Optional[str] = None


class AssignmentResponse(BaseModel):
    id: UUID
    ticket_id: UUID
    subscriber_id: UUID
    technician_id: UUID
    status: AssignmentStatus
    assigned_by_user_id: UUID
    notes: Optional[str] = None
    assigned_at: datetime
    updated_at: datetime


class AssignmentListResponse(BaseModel):
    items: list[AssignmentResponse]
    total: int
