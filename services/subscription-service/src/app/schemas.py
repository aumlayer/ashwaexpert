from datetime import datetime
from typing import Literal, Optional
from uuid import UUID

from pydantic import BaseModel, Field


SubscriptionStatus = Literal["active", "cancelled", "paused"]
BillingPeriod = Literal["monthly", "quarterly", "yearly"]
ServiceType = Literal["rental", "service"]
OrderType = Literal["purchase", "renewal"]
OrderStatus = Literal["paid", "failed", "pending"]


class SubscriptionCreateRequest(BaseModel):
    # Admin can create for any user_id; subscriber ignores this and uses own X-User-Id
    user_id: Optional[UUID] = None
    plan_id: UUID
    billing_period: BillingPeriod
    auto_renew: bool = True


class SubscriptionUpdateRequest(BaseModel):
    billing_period: Optional[BillingPeriod] = None
    auto_renew: Optional[bool] = None
    status: Optional[SubscriptionStatus] = None
    # Admin override
    next_renewal_override_at: Optional[datetime] = None


class SubscriptionResponse(BaseModel):
    id: UUID
    user_id: UUID
    plan_id: UUID
    status: SubscriptionStatus
    billing_period: BillingPeriod
    auto_renew: bool
    start_at: datetime
    renewal_anchor_at: datetime
    next_renewal_at: Optional[datetime] = None
    next_renewal_override_at: Optional[datetime] = None
    end_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime


class SubscriptionQuoteRequest(BaseModel):
    # Base amount BEFORE GST
    base_amount: float = Field(gt=0)
    promo_code: Optional[str] = None
    referral_code: Optional[str] = None
    service_type: ServiceType = "rental"


class SubscriptionQuoteResponse(BaseModel):
    base_amount: float
    discount_amount: float
    credit_applied_amount: float = 0.0
    amount_before_gst: float
    gst_percent: float
    gst_amount: float
    total_amount: float
    applied_codes: list[str]


class TaxConfigUpsertRequest(BaseModel):
    rental_gst_percent: float = Field(ge=0, le=100)
    service_gst_percent: float = Field(ge=0, le=100)


class TaxConfigResponse(BaseModel):
    rental_gst_percent: float
    service_gst_percent: float
    updated_at: datetime


class PurchaseRequest(BaseModel):
    base_amount: float = Field(gt=0, description="Base amount BEFORE GST")
    service_type: ServiceType = "rental"
    promo_code: Optional[str] = None
    referral_code: Optional[str] = None


class OrderResponse(BaseModel):
    id: UUID
    subscription_id: UUID
    user_id: UUID
    order_type: OrderType
    service_type: ServiceType
    base_amount: float
    discount_amount: float
    credit_applied_amount: float
    amount_before_gst: float
    gst_percent: float
    gst_amount: float
    total_amount: float
    promo_code: Optional[str] = None
    referral_code: Optional[str] = None
    applied_codes: list[str] = []
    applied_credit_id: Optional[UUID] = None
    payment_intent_id: Optional[UUID] = None
    status: OrderStatus = "paid"
    created_at: datetime


class InternalMarkOrderPaidRequest(BaseModel):
    payment_intent_id: Optional[UUID] = None


class SubscriptionListResponse(BaseModel):
    items: list[SubscriptionResponse]
    total: int


class OrderListResponse(BaseModel):
    items: list[OrderResponse]
    total: int

