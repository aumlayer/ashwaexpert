from datetime import datetime
from typing import Literal, Optional
from uuid import UUID

from pydantic import BaseModel, EmailStr, Field


Role = Literal["admin", "subscriber", "technician", "cms_user"]
OtpPurpose = Literal["login", "registration", "password_reset"]


class RegisterRequest(BaseModel):
    email: EmailStr
    phone: Optional[str] = None
    password: str = Field(min_length=8)
    role: Role
    first_name: Optional[str] = None
    last_name: Optional[str] = None


class RegisterResponse(BaseModel):
    user_id: UUID
    email: EmailStr
    message: str


class OtpRequestRequest(BaseModel):
    identifier: str
    purpose: OtpPurpose


class OtpRequestResponse(BaseModel):
    message: str
    expires_in_seconds: int


class OtpVerifyRequest(BaseModel):
    identifier: str
    otp_code: str
    purpose: OtpPurpose


class TokenUser(BaseModel):
    id: UUID
    email: EmailStr
    role: Role
    subscriber_id: Optional[UUID] = None
    can_assign_leads: bool = False
    can_manage_unassigned_leads: bool = False


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "Bearer"
    expires_in: int
    user: TokenUser


class PasswordLoginRequest(BaseModel):
    email: EmailStr
    password: str


class RefreshRequest(BaseModel):
    refresh_token: str


class RefreshResponse(BaseModel):
    access_token: str
    expires_in: int
    token_type: str = "Bearer"


class LogoutRequest(BaseModel):
    refresh_token: str


class ValidateRequest(BaseModel):
    token: str


class ValidateResponse(BaseModel):
    valid: bool
    user_id: UUID
    email: EmailStr
    role: Role
    subscriber_id: Optional[UUID] = None
    can_assign_leads: bool = False
    can_manage_unassigned_leads: bool = False
    expires_at: datetime


class MeResponse(BaseModel):
    id: UUID
    email: EmailStr
    phone: Optional[str] = None
    role: Role
    subscriber_id: Optional[UUID] = None
    can_assign_leads: bool = False
    can_manage_unassigned_leads: bool = False
    is_active: bool
    is_verified: bool


class UserListItem(BaseModel):
    id: UUID
    email: EmailStr
    phone: Optional[str] = None
    role: Role
    is_active: bool
    is_verified: bool
    subscriber_id: Optional[UUID] = None
    can_assign_leads: bool
    can_manage_unassigned_leads: bool


class UserListResponse(BaseModel):
    items: list[UserListItem]
    total: int


class UpdateUserCapabilitiesRequest(BaseModel):
    can_assign_leads: Optional[bool] = None
    can_manage_unassigned_leads: Optional[bool] = None


class InternalUserLookupResponse(BaseModel):
    id: UUID
    role: Role
    email: Optional[str] = None
    phone: Optional[str] = None


class StaffCreateRequest(BaseModel):
    email: EmailStr
    phone: Optional[str] = None
    password: str = Field(min_length=8)
    role: Literal["cms_user", "technician"]

