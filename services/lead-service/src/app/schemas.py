from datetime import datetime
from typing import Literal, Optional
from uuid import UUID

from pydantic import BaseModel, EmailStr


LeadSource = Literal["website", "referral", "social", "other", "partner"]
LeadCustomerType = Literal["commercial", "pg", "hotel", "industry", "residential", "other"]
LeadServiceCategory = Literal["rental", "service_request", "amc"]
LeadStatus = Literal[
    "new",
    "contacted",
    "qualified",
    "proposal",
    "scheduled_visit",
    "in_progress",
    "on_hold",
    "closed_won",
    "closed_lost",
]
LeadPriority = Literal["low", "medium", "high"]
ApplianceCategory = Literal["ac", "fridge", "washing_machine", "ro", "microwave", "other"]
Urgency = Literal["low", "medium", "high"]
PreferredContactMethod = Literal["call", "whatsapp", "email"]
LeadActivityType = Literal["created", "assigned", "status_changed", "note"]


class CreateLeadRequest(BaseModel):
    name: str
    email: EmailStr
    phone: Optional[str] = None
    company: Optional[str] = None
    customer_type: Optional[LeadCustomerType] = None
    service_category: Optional[LeadServiceCategory] = None
    state: Optional[str] = None
    city: Optional[str] = None
    locality: Optional[str] = None
    preferred_datetime: Optional[datetime] = None
    appliance_category: Optional[ApplianceCategory] = None
    appliance_brand: Optional[str] = None
    appliance_model: Optional[str] = None
    urgency: Optional[Urgency] = None
    preferred_contact_method: Optional[PreferredContactMethod] = None
    message: Optional[str] = None
    source: LeadSource = "website"


class LeadResponse(BaseModel):
    id: UUID
    name: str
    email: EmailStr
    phone: Optional[str] = None
    company: Optional[str] = None
    customer_type: Optional[LeadCustomerType] = None
    service_category: Optional[LeadServiceCategory] = None
    state: Optional[str] = None
    city: Optional[str] = None
    locality: Optional[str] = None
    preferred_datetime: Optional[datetime] = None
    appliance_category: Optional[ApplianceCategory] = None
    appliance_brand: Optional[str] = None
    appliance_model: Optional[str] = None
    urgency: Optional[Urgency] = None
    preferred_contact_method: Optional[PreferredContactMethod] = None
    message: Optional[str] = None
    source: LeadSource
    status: LeadStatus
    priority: LeadPriority
    assigned_to: Optional[UUID] = None
    created_at: datetime
    updated_at: datetime


class LeadListResponse(BaseModel):
    items: list[LeadResponse]
    total: int
    page: int
    limit: int


class LeadAssignRequest(BaseModel):
    # Auth user id (uuid). Use null to unassign.
    assigned_to: Optional[UUID] = None


class LeadStatusUpdateRequest(BaseModel):
    status: LeadStatus


class LeadActivityCreateRequest(BaseModel):
    activity_type: LeadActivityType = "note"
    description: str


class LeadActivityResponse(BaseModel):
    id: UUID
    lead_id: UUID
    activity_type: LeadActivityType
    description: str
    performed_by: Optional[UUID] = None
    created_at: datetime


class LeadActivityListResponse(BaseModel):
    items: list[LeadActivityResponse]
    total: int
    page: int
    limit: int

