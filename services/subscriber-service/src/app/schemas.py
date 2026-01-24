from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, EmailStr


class SubscriberMeResponse(BaseModel):
    id: UUID
    user_id: UUID
    first_name: str
    last_name: str
    email: EmailStr
    phone: Optional[str] = None
    company_name: Optional[str] = None
    gst_number: Optional[str] = None
    pan_number: Optional[str] = None
    is_active: bool
    created_at: datetime
    updated_at: datetime


class SubscriberUpdateRequest(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    phone: Optional[str] = None
    company_name: Optional[str] = None
    gst_number: Optional[str] = None
    pan_number: Optional[str] = None


class InternalCreateFromAuthRequest(BaseModel):
    user_id: UUID
    email: EmailStr
    phone: Optional[str] = None
    first_name: str
    last_name: str

