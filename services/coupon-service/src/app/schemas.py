from datetime import datetime
from typing import Literal, Optional
from uuid import UUID

from pydantic import BaseModel, Field


CouponKind = Literal["promo", "referral"]
DiscountType = Literal["percent", "fixed"]
CreditStatus = Literal["pending", "applied"]


class CouponCreateRequest(BaseModel):
    kind: CouponKind = "promo"
    # If omitted, service auto-generates a random code.
    code: Optional[str] = None
    # e.g. diwali2026 / newyear2027
    campaign_name: Optional[str] = None

    discount_type: DiscountType = "percent"
    # percent: 0-100, fixed: currency amount
    discount_value: float = Field(gt=0)

    applies_to: Optional[list[str]] = None  # e.g. ["rental","amc"]
    min_amount: Optional[float] = None
    max_redemptions: Optional[int] = None
    per_user_limit: Optional[int] = None
    valid_from: Optional[datetime] = None
    valid_to: Optional[datetime] = None
    active: bool = True


class CouponResponse(BaseModel):
    id: UUID
    code: str
    kind: CouponKind
    campaign_name: Optional[str] = None
    discount_type: DiscountType
    discount_value: float
    applies_to: Optional[list[str]] = None
    min_amount: Optional[float] = None
    max_redemptions: Optional[int] = None
    per_user_limit: Optional[int] = None
    redeemed_count: int
    valid_from: Optional[datetime] = None
    valid_to: Optional[datetime] = None
    active: bool
    referrer_user_id: Optional[UUID] = None
    created_at: datetime
    updated_at: datetime


class CouponListResponse(BaseModel):
    items: list[CouponResponse]
    total: int


class ReferralProgramUpdateRequest(BaseModel):
    referrer_credit_amount: float = Field(ge=0)
    referred_percent: int = Field(ge=0, le=100)
    active: bool = True


class ReferralProgramResponse(BaseModel):
    referrer_credit_amount: float
    referred_percent: int
    active: bool
    created_at: datetime


class ReferralGenerateResponse(BaseModel):
    code: str


class InternalRedeemRequest(BaseModel):
    code: str
    redeemed_by_user_id: UUID
    order_ref: Optional[str] = None
    base_amount: Optional[float] = None
    applies_to: Optional[str] = None  # e.g. rental/service_request/amc


class InternalValidateRequest(BaseModel):
    code: str
    user_id: UUID
    base_amount: Optional[float] = None
    applies_to: Optional[str] = None  # e.g. rental/service_request/amc


class InternalRedeemResponse(BaseModel):
    valid: bool
    code: str
    discount_amount: float
    discount_type: DiscountType
    discount_value: float
    created_credit_id: Optional[UUID] = None
    referrer_user_id: Optional[UUID] = None


class InternalValidateResponse(BaseModel):
    valid: bool
    code: str
    discount_amount: float
    discount_type: DiscountType
    discount_value: float
    referrer_user_id: Optional[UUID] = None


class UserCreditResponse(BaseModel):
    id: UUID
    user_id: UUID
    credit_type: DiscountType
    credit_value: float
    status: CreditStatus
    source: str
    applies_to: Optional[str] = None
    order_ref: Optional[str] = None
    created_at: datetime
    applied_at: Optional[datetime] = None
    note: Optional[str] = None


class UserCreditListResponse(BaseModel):
    items: list[UserCreditResponse]
    total: int


class InternalApplyCreditRequest(BaseModel):
    order_ref: str
    note: Optional[str] = None

