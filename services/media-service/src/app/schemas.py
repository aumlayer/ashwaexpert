from __future__ import annotations

from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, Field


class InvoicePdfLineItem(BaseModel):
    description: str
    quantity: float = 1.0
    unit_price: float = 0.0
    amount: float = 0.0


class GenerateInvoicePdfRequest(BaseModel):
    invoice_id: UUID
    invoice_number: str = Field(min_length=1, max_length=32)
    user_id: UUID
    base_amount: float = Field(ge=0)
    discount_amount: float = Field(ge=0, default=0.0)
    credit_applied_amount: float = Field(ge=0, default=0.0)
    amount_before_gst: float = Field(ge=0)
    gst_percent: float = Field(ge=0, le=100)
    gst_amount: float = Field(ge=0)
    total_amount: float = Field(ge=0)
    created_at: Optional[datetime] = None
    customer_name: Optional[str] = None
    customer_address: Optional[str] = None
    line_items: Optional[list[InvoicePdfLineItem]] = None


class GenerateInvoicePdfResponse(BaseModel):
    media_id: UUID


class PresignUploadRequest(BaseModel):
    owner_type: str = Field(min_length=1, max_length=32)
    owner_id: UUID
    content_type: str = Field(default="image/jpeg", min_length=1, max_length=64)
    file_name: str = Field(min_length=1, max_length=255)


class PresignUploadResponse(BaseModel):
    media_id: UUID
    upload_url: str
    object_key: str
    expires_in_seconds: int


class MediaListResponse(BaseModel):
    items: list["MediaItemResponse"]
    total: int


class MediaItemResponse(BaseModel):
    id: UUID
    owner_type: str
    owner_id: UUID
    file_path: str
    content_type: str
    file_size: Optional[int]
    created_at: datetime
