from datetime import datetime
from typing import Literal, Optional
from uuid import UUID

from pydantic import BaseModel, Field


SubscriptionStatus = Literal["active", "cancelled", "paused", "cancellation_requested", "past_due", "expired"]
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
    cancel_requested_at: Optional[datetime] = None
    cancel_effective_at: Optional[datetime] = None
    cancel_reason: Optional[str] = None
    plan_change_requested_plan_id: Optional[UUID] = None
    plan_change_requested_at: Optional[datetime] = None
    plan_change_effective_at: Optional[datetime] = None
    plan_change_mode: Optional[str] = None
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


class PlanChangeRequest(BaseModel):
    new_plan_id: UUID
    mode: Literal["immediate", "next_cycle"] = "next_cycle"
    effective_at: Optional[datetime] = None


class CancellationRequest(BaseModel):
    reason: Optional[str] = None
    effective_mode: Literal["notice_1_month", "end_of_cycle"] = "notice_1_month"


class SubscriptionEventResponse(BaseModel):
    id: UUID
    subscription_id: UUID
    event_type: str
    actor_user_id: Optional[UUID] = None
    actor_role: Optional[str] = None
    from_status: Optional[str] = None
    to_status: Optional[str] = None
    from_plan_id: Optional[UUID] = None
    to_plan_id: Optional[UUID] = None
    payload: Optional[dict] = None
    created_at: datetime


class SubscriptionEventListResponse(BaseModel):
    items: list[SubscriptionEventResponse]
    total: int

