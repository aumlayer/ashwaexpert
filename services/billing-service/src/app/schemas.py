from __future__ import annotations

from datetime import datetime
from typing import Literal, Optional
from uuid import UUID

from pydantic import BaseModel, Field


InvoiceStatus = Literal["draft", "issued", "paid", "overdue", "cancelled"]
InvoiceType = Literal["order", "proration"]


class InvoiceResponse(BaseModel):
    id: UUID
    invoice_number: str
    user_id: UUID
    order_id: Optional[UUID] = None
    invoice_type: InvoiceType = "order"
    subscription_id: Optional[UUID] = None
    status: InvoiceStatus
    base_amount: float
    discount_amount: float
    credit_applied_amount: float
    paid_amount: float = 0.0
    due_amount: float = 0.0
    amount_before_gst: float
    gst_percent: float
    gst_amount: float
    total_amount: float
    due_date: Optional[datetime] = None
    pdf_media_id: Optional[UUID] = None
    created_at: datetime
    updated_at: datetime


class InvoiceListResponse(BaseModel):
    items: list[InvoiceResponse]
    total: int


class InternalCreateInvoiceFromOrderResponse(BaseModel):
    created: bool
    invoice: InvoiceResponse


class CreditAddRequest(BaseModel):
    amount: float = Field(gt=0)
    reason: str = Field(min_length=1, max_length=32)
    reference_type: str = Field(min_length=1, max_length=32)
    reference_id: str = Field(min_length=1, max_length=128)
    idempotency_key: Optional[str] = Field(default=None, max_length=128)
    notes: Optional[str] = None


class CreditEntryResponse(BaseModel):
    id: UUID
    direction: Literal["credit", "debit"]
    amount: float
    reason: str
    reference_type: str
    reference_id: str
    idempotency_key: Optional[str] = None
    created_at: datetime


class CreditAccountResponse(BaseModel):
    subscriber_id: UUID
    currency: str = "INR"
    balance_amount: float


class CreditMeResponse(BaseModel):
    account: CreditAccountResponse
    items: list[CreditEntryResponse]
    total: int


class CreditApplyToInvoiceRequest(BaseModel):
    invoice_id: UUID
    amount: Optional[float] = Field(default=None, gt=0)
    idempotency_key: Optional[str] = Field(default=None, max_length=128)


class CreditApplyToInvoiceResponse(BaseModel):
    invoice: InvoiceResponse
    applied_amount: float
    debit_entry_id: UUID


class CreditReverseRequest(BaseModel):
    debit_entry_id: UUID
    reason: str = Field(default="adjustment", min_length=1, max_length=32)
    idempotency_key: Optional[str] = Field(default=None, max_length=128)


class ProrationEstimateRequest(BaseModel):
    subscriber_id: UUID
    subscription_id: UUID
    from_plan_price: float = Field(ge=0)
    to_plan_price: float = Field(ge=0)
    current_period_start: datetime
    current_period_end: datetime
    effective_at: datetime
    mode: Literal["immediate", "next_cycle"] = "immediate"
    currency: str = "INR"


class ProrationEstimateResponse(BaseModel):
    old_unused_credit: float
    new_remaining_charge: float
    net_amount: float
    currency: str
    breakdown: dict


class ProrationApplyRequest(ProrationEstimateRequest):
    create_invoice_if_positive: bool = True
    create_credit_if_negative: bool = True
    idempotency_key: Optional[str] = Field(default=None, max_length=128)


class ProrationApplyResponse(BaseModel):
    net_amount: float
    currency: str
    invoice_id: Optional[UUID] = None
    credit_entry_id: Optional[UUID] = None
    status: str

