from __future__ import annotations

from datetime import datetime
from typing import Literal, Optional
from uuid import UUID

from pydantic import BaseModel, Field


PaymentStatus = Literal["created", "paid", "failed"]
PaymentProvider = Literal["mock", "cashfree", "razorpay"]
GatewayMode = Literal["sandbox", "live"]


class InternalCreateIntentRequest(BaseModel):
    user_id: UUID
    reference_type: str = Field(min_length=1, max_length=64)
    reference_id: str = Field(min_length=1, max_length=128)
    amount: float = Field(gt=0)
    currency: str = Field(default="INR", min_length=3, max_length=3)
    meta: Optional[dict] = None


class PaymentIntentResponse(BaseModel):
    id: UUID
    user_id: UUID
    reference_type: str
    reference_id: str
    amount: float
    currency: str
    status: PaymentStatus
    provider: str
    created_at: datetime
    updated_at: datetime


class MockWebhookRequest(BaseModel):
    intent_id: UUID
    status: PaymentStatus = "paid"


class GatewayConfigUpsertRequest(BaseModel):
    provider: PaymentProvider
    mode: GatewayMode = "sandbox"
    credentials: Optional[dict] = None


class GatewayConfigResponse(BaseModel):
    provider: PaymentProvider
    mode: GatewayMode
    is_active: bool
    updated_at: datetime


class PaymentInitiateResponse(BaseModel):
    intent_id: UUID
    provider: PaymentProvider
    mode: GatewayMode
    checkout_payload: dict
    note: str

