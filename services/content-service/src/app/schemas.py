from datetime import datetime
from typing import Literal, Optional
from uuid import UUID

from pydantic import BaseModel


CaseStudyStatus = Literal["draft", "published", "archived"]


class CaseStudyListItem(BaseModel):
    id: UUID
    title: str
    slug: str
    summary: Optional[str] = None
    featured_image_url: Optional[str] = None
    published_at: Optional[datetime] = None


class CaseStudyDetail(BaseModel):
    id: UUID
    title: str
    slug: str
    summary: Optional[str] = None
    content: str
    featured_image_url: Optional[str] = None
    status: CaseStudyStatus
    published_at: Optional[datetime] = None
    seo_title: Optional[str] = None
    seo_description: Optional[str] = None
    seo_keywords: Optional[str] = None
    og_image_url: Optional[str] = None
    created_at: datetime
    updated_at: datetime


class CaseStudyListResponse(BaseModel):
    items: list[CaseStudyListItem]
    total: int
    page: int
    limit: int


class CaseStudyCreateRequest(BaseModel):
    title: str
    slug: str
    summary: Optional[str] = None
    content: str
    featured_image_url: Optional[str] = None
    seo_title: Optional[str] = None
    seo_description: Optional[str] = None
    seo_keywords: Optional[str] = None
    og_image_url: Optional[str] = None


class CaseStudyUpdateRequest(BaseModel):
    title: Optional[str] = None
    slug: Optional[str] = None
    summary: Optional[str] = None
    content: Optional[str] = None
    featured_image_url: Optional[str] = None
    seo_title: Optional[str] = None
    seo_description: Optional[str] = None
    seo_keywords: Optional[str] = None
    og_image_url: Optional[str] = None


class CaseStudyManageListItem(BaseModel):
    id: UUID
    title: str
    slug: str
    status: CaseStudyStatus
    published_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime


class CaseStudyManageListResponse(BaseModel):
    items: list[CaseStudyManageListItem]
    total: int
    page: int
    limit: int

