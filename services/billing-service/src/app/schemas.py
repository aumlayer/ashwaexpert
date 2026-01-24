from __future__ import annotations

from datetime import datetime
from typing import Literal, Optional
from uuid import UUID

from pydantic import BaseModel


InvoiceStatus = Literal["issued", "paid", "cancelled"]


class InvoiceResponse(BaseModel):
    id: UUID
    invoice_number: str
    user_id: UUID
    order_id: UUID
    status: InvoiceStatus
    base_amount: float
    discount_amount: float
    credit_applied_amount: float
    amount_before_gst: float
    gst_percent: float
    gst_amount: float
    total_amount: float
    created_at: datetime
    updated_at: datetime


class InvoiceListResponse(BaseModel):
    items: list[InvoiceResponse]
    total: int


class InternalCreateInvoiceFromOrderResponse(BaseModel):
    created: bool
    invoice: InvoiceResponse

