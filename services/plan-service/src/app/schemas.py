from datetime import datetime
from typing import Literal, Optional
from uuid import UUID

from pydantic import BaseModel, Field


PlanCategory = Literal["rental", "amc", "service_bundle"]
BillingPeriod = Literal["monthly", "quarterly", "yearly", "one_time"]


class PlanCreateRequest(BaseModel):
    plan_code: str = Field(min_length=3, max_length=64)
    name: str = Field(min_length=3, max_length=128)
    category: PlanCategory
    billing_period: BillingPeriod
    price_amount: float = Field(gt=0)
    price_currency: str = Field(default="INR", min_length=3, max_length=3)
    trial_days: Optional[int] = Field(default=None, ge=0, le=365)
    active: bool = True
    limits: Optional[dict] = None


class PlanUpdateRequest(BaseModel):
    name: Optional[str] = None
    price_amount: Optional[float] = Field(default=None, gt=0)
    trial_days: Optional[int] = Field(default=None, ge=0, le=365)
    active: Optional[bool] = None
    limits: Optional[dict] = None


class PlanResponse(BaseModel):
    id: UUID
    plan_code: str
    name: str
    category: PlanCategory
    billing_period: BillingPeriod
    price_amount: float
    price_currency: str
    trial_days: Optional[int] = None
    active: bool
    limits: Optional[dict] = None
    created_at: datetime
    updated_at: datetime


class PlanListResponse(BaseModel):
    items: list[PlanResponse]
    total: int

