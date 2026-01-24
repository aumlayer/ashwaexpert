import json
import logging
import os
import time
from datetime import datetime, timezone
from uuid import UUID
from uuid import uuid4

from fastapi import Depends, FastAPI, Header, HTTPException, Query, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
from prometheus_client import CONTENT_TYPE_LATEST, Counter, Histogram, generate_latest
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.deps import get_db
from app.models import CaseStudy
from app.schemas import (
    CaseStudyCreateRequest,
    CaseStudyDetail,
    CaseStudyListItem,
    CaseStudyListResponse,
    CaseStudyManageListItem,
    CaseStudyManageListResponse,
    CaseStudyUpdateRequest,
)

SERVICE_NAME = os.getenv("SERVICE_NAME", "content-service")
SERVICE_VERSION = os.getenv("SERVICE_VERSION", "0.1.0")
ENVIRONMENT = os.getenv("ENVIRONMENT", "local")
LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO")
CORS_ORIGINS = os.getenv("CORS_ORIGINS", "*")

logging.basicConfig(level=LOG_LEVEL, format="%(message)s")
logger = logging.getLogger(SERVICE_NAME)

app = FastAPI(title=SERVICE_NAME, version=SERVICE_VERSION)

origins = [o.strip() for o in CORS_ORIGINS.split(",") if o.strip()] or ["*"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"] if "*" in origins else origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

REQUEST_COUNT = Counter(
    "http_requests_total",
    "Total HTTP requests",
    ["service", "method", "path", "status_code"],
)
REQUEST_LATENCY = Histogram(
    "http_request_duration_seconds",
    "HTTP request latency in seconds",
    ["service", "method", "path"],
)


def _get_correlation_id(request: Request) -> str:
    return (
        request.headers.get("x-correlation-id")
        or request.headers.get("x-request-id")
        or str(uuid4())
    )


def _log_event(request: Request, status_code: int, duration: float) -> None:
    event = {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "service": SERVICE_NAME,
        "environment": ENVIRONMENT,
        "method": request.method,
        "path": request.url.path,
        "status_code": status_code,
        "duration_ms": round(duration * 1000, 2),
        "correlation_id": getattr(request.state, "correlation_id", ""),
        "client_ip": request.client.host if request.client else "",
    }
    logger.info(json.dumps(event))


@app.middleware("http")
async def metrics_and_logging(request: Request, call_next):
    start = time.time()
    correlation_id = _get_correlation_id(request)
    request.state.correlation_id = correlation_id
    response = None
    try:
        response = await call_next(request)
        response.headers["X-Correlation-ID"] = correlation_id
        return response
    finally:
        duration = time.time() - start
        status_code = response.status_code if response else 500
        REQUEST_COUNT.labels(
            service=SERVICE_NAME,
            method=request.method,
            path=request.url.path,
            status_code=str(status_code),
        ).inc()
        REQUEST_LATENCY.labels(
            service=SERVICE_NAME, method=request.method, path=request.url.path
        ).observe(duration)
        _log_event(request, status_code, duration)


@app.get("/health")
async def health() -> dict:
    return {
        "status": "healthy",
        "service": SERVICE_NAME,
        "version": SERVICE_VERSION,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


@app.get("/metrics")
async def metrics() -> Response:
    return Response(generate_latest(), media_type=CONTENT_TYPE_LATEST)


@app.get("/api/v1/content/case-studies", response_model=CaseStudyListResponse)
async def list_published_case_studies(
    db: Session = Depends(get_db),
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=10, ge=1, le=50),
    search: str | None = Query(default=None),
):
    stmt = select(CaseStudy).where(CaseStudy.status == "published")
    count_stmt = select(func.count()).select_from(CaseStudy).where(CaseStudy.status == "published")
    if search:
        like = f"%{search}%"
        stmt = stmt.where(CaseStudy.title.ilike(like))
        count_stmt = count_stmt.where(CaseStudy.title.ilike(like))

    total = int(db.execute(count_stmt).scalar_one())
    stmt = stmt.order_by(CaseStudy.published_at.desc().nullslast()).offset((page - 1) * limit).limit(limit)
    rows = db.execute(stmt).scalars().all()

    return CaseStudyListResponse(
        items=[
            CaseStudyListItem(
                id=c.id,
                title=c.title,
                slug=c.slug,
                summary=c.summary,
                featured_image_url=c.featured_image_url,
                published_at=c.published_at,
            )
            for c in rows
        ],
        total=total,
        page=page,
        limit=limit,
    )


@app.get("/api/v1/content/case-studies/{slug}", response_model=CaseStudyDetail)
async def get_case_study_by_slug(slug: str, db: Session = Depends(get_db)):
    cs = db.execute(
        select(CaseStudy).where(CaseStudy.slug == slug, CaseStudy.status == "published")
    ).scalar_one_or_none()
    if not cs:
        raise HTTPException(status_code=404, detail="Case study not found")
    return CaseStudyDetail(
        id=cs.id,
        title=cs.title,
        slug=cs.slug,
        summary=cs.summary,
        content=cs.content,
        featured_image_url=cs.featured_image_url,
        status=cs.status,  # type: ignore[arg-type]
        published_at=cs.published_at,
        seo_title=cs.seo_title,
        seo_description=cs.seo_description,
        seo_keywords=cs.seo_keywords,
        og_image_url=cs.og_image_url,
        created_at=cs.created_at,
        updated_at=cs.updated_at,
    )


@app.post("/api/v1/content/case-studies", response_model=CaseStudyDetail, status_code=201)
async def create_case_study(
    req: CaseStudyCreateRequest,
    db: Session = Depends(get_db),
    x_user_id: str | None = Header(default=None),
):
    existing = db.execute(select(CaseStudy).where(CaseStudy.slug == req.slug)).scalar_one_or_none()
    if existing:
        raise HTTPException(status_code=409, detail="Slug already exists")

    now = datetime.now(timezone.utc)
    author_id: UUID | None = None
    if x_user_id:
        try:
            author_id = UUID(x_user_id)
        except Exception:
            author_id = None
    cs = CaseStudy(
        title=req.title,
        slug=req.slug,
        summary=req.summary,
        content=req.content,
        featured_image_url=req.featured_image_url,
        status="draft",
        published_at=None,
        author_id=author_id,
        seo_title=req.seo_title,
        seo_description=req.seo_description,
        seo_keywords=req.seo_keywords,
        og_image_url=req.og_image_url,
        created_at=now,
        updated_at=now,
    )
    db.add(cs)
    db.commit()
    db.refresh(cs)
    return CaseStudyDetail(
        id=cs.id,
        title=cs.title,
        slug=cs.slug,
        summary=cs.summary,
        content=cs.content,
        featured_image_url=cs.featured_image_url,
        status=cs.status,  # type: ignore[arg-type]
        published_at=cs.published_at,
        seo_title=cs.seo_title,
        seo_description=cs.seo_description,
        seo_keywords=cs.seo_keywords,
        og_image_url=cs.og_image_url,
        created_at=cs.created_at,
        updated_at=cs.updated_at,
    )


@app.get("/api/v1/content/manage/case-studies", response_model=CaseStudyManageListResponse)
async def list_case_studies_manage(
    db: Session = Depends(get_db),
    status: str | None = Query(default=None),
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=10, ge=1, le=50),
    search: str | None = Query(default=None),
):
    stmt = select(CaseStudy)
    count_stmt = select(func.count()).select_from(CaseStudy)
    if status:
        stmt = stmt.where(CaseStudy.status == status)
        count_stmt = count_stmt.where(CaseStudy.status == status)
    if search:
        like = f"%{search}%"
        stmt = stmt.where(CaseStudy.title.ilike(like))
        count_stmt = count_stmt.where(CaseStudy.title.ilike(like))

    total = int(db.execute(count_stmt).scalar_one())
    stmt = stmt.order_by(CaseStudy.updated_at.desc()).offset((page - 1) * limit).limit(limit)
    rows = db.execute(stmt).scalars().all()

    return CaseStudyManageListResponse(
        items=[
            CaseStudyManageListItem(
                id=c.id,
                title=c.title,
                slug=c.slug,
                status=c.status,  # type: ignore[arg-type]
                published_at=c.published_at,
                created_at=c.created_at,
                updated_at=c.updated_at,
            )
            for c in rows
        ],
        total=total,
        page=page,
        limit=limit,
    )


@app.patch("/api/v1/content/case-studies/{case_study_id}", response_model=CaseStudyDetail)
async def update_case_study(
    case_study_id: UUID,
    req: CaseStudyUpdateRequest,
    db: Session = Depends(get_db),
    x_user_id: str | None = Header(default=None),
):
    cs = db.get(CaseStudy, case_study_id)
    if not cs:
        raise HTTPException(status_code=404, detail="Case study not found")

    # Slug immutability after publish
    if req.slug is not None and req.slug != cs.slug and cs.status == "published":
        raise HTTPException(status_code=400, detail="Slug cannot be changed after publish")

    if req.slug is not None and req.slug != cs.slug:
        existing = db.execute(select(CaseStudy).where(CaseStudy.slug == req.slug)).scalar_one_or_none()
        if existing:
            raise HTTPException(status_code=409, detail="Slug already exists")
        cs.slug = req.slug

    for field in [
        "title",
        "summary",
        "content",
        "featured_image_url",
        "seo_title",
        "seo_description",
        "seo_keywords",
        "og_image_url",
    ]:
        val = getattr(req, field)
        if val is not None:
            setattr(cs, field, val)

    if x_user_id:
        try:
            cs.author_id = UUID(x_user_id)
        except Exception:
            pass

    cs.updated_at = datetime.now(timezone.utc)
    db.add(cs)
    db.commit()
    db.refresh(cs)
    return CaseStudyDetail(
        id=cs.id,
        title=cs.title,
        slug=cs.slug,
        summary=cs.summary,
        content=cs.content,
        featured_image_url=cs.featured_image_url,
        status=cs.status,  # type: ignore[arg-type]
        published_at=cs.published_at,
        seo_title=cs.seo_title,
        seo_description=cs.seo_description,
        seo_keywords=cs.seo_keywords,
        og_image_url=cs.og_image_url,
        created_at=cs.created_at,
        updated_at=cs.updated_at,
    )


@app.post("/api/v1/content/case-studies/{case_study_id}/publish", response_model=CaseStudyDetail)
async def publish_case_study(case_study_id: UUID, db: Session = Depends(get_db)):
    cs = db.get(CaseStudy, case_study_id)
    if not cs:
        raise HTTPException(status_code=404, detail="Case study not found")
    now = datetime.now(timezone.utc)
    cs.status = "published"
    cs.published_at = now
    cs.updated_at = now
    db.add(cs)
    db.commit()
    db.refresh(cs)
    return CaseStudyDetail(
        id=cs.id,
        title=cs.title,
        slug=cs.slug,
        summary=cs.summary,
        content=cs.content,
        featured_image_url=cs.featured_image_url,
        status=cs.status,  # type: ignore[arg-type]
        published_at=cs.published_at,
        seo_title=cs.seo_title,
        seo_description=cs.seo_description,
        seo_keywords=cs.seo_keywords,
        og_image_url=cs.og_image_url,
        created_at=cs.created_at,
        updated_at=cs.updated_at,
    )


@app.post("/api/v1/content/case-studies/{case_study_id}/unpublish", response_model=CaseStudyDetail)
async def unpublish_case_study(case_study_id: UUID, db: Session = Depends(get_db)):
    cs = db.get(CaseStudy, case_study_id)
    if not cs:
        raise HTTPException(status_code=404, detail="Case study not found")
    now = datetime.now(timezone.utc)
    cs.status = "draft"
    cs.published_at = None
    cs.updated_at = now
    db.add(cs)
    db.commit()
    db.refresh(cs)
    return CaseStudyDetail(
        id=cs.id,
        title=cs.title,
        slug=cs.slug,
        summary=cs.summary,
        content=cs.content,
        featured_image_url=cs.featured_image_url,
        status=cs.status,  # type: ignore[arg-type]
        published_at=cs.published_at,
        seo_title=cs.seo_title,
        seo_description=cs.seo_description,
        seo_keywords=cs.seo_keywords,
        og_image_url=cs.og_image_url,
        created_at=cs.created_at,
        updated_at=cs.updated_at,
    )


@app.delete("/api/v1/content/case-studies/{case_study_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_case_study(case_study_id: UUID, db: Session = Depends(get_db)):
    cs = db.get(CaseStudy, case_study_id)
    if not cs:
        raise HTTPException(status_code=404, detail="Case study not found")
    db.delete(cs)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        app,
        host="0.0.0.0",
        port=int(os.getenv("SERVICE_PORT", "8000")),
        log_level=LOG_LEVEL.lower(),
    )
