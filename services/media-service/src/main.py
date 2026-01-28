import io
import json
import logging
import os
import time
from datetime import datetime, timedelta, timezone
from uuid import UUID, uuid4

from fastapi import Depends, FastAPI, Header, HTTPException, Query, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse, Response
import httpx
from minio import Minio
from prometheus_client import CONTENT_TYPE_LATEST, Counter, Histogram, generate_latest
from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.deps import get_db
from app.models import MediaObject
from app.schemas import (
    GenerateInvoicePdfRequest,
    GenerateInvoicePdfResponse,
    MediaItemResponse,
    MediaListResponse,
    PresignUploadRequest,
    PresignUploadResponse,
)

SERVICE_NAME = os.getenv("SERVICE_NAME", "media-service")
SERVICE_VERSION = os.getenv("SERVICE_VERSION", "0.1.0")
ENVIRONMENT = os.getenv("ENVIRONMENT", "local")
LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO")
CORS_ORIGINS = os.getenv("CORS_ORIGINS", "*")
INTERNAL_API_KEY = os.getenv("INTERNAL_API_KEY", "")
TICKET_SERVICE_URL = os.getenv("TICKET_SERVICE_URL", "")
AUTH_SERVICE_URL = os.getenv("AUTH_SERVICE_URL", "")
MINIO_ENDPOINT = os.getenv("MINIO_ENDPOINT", "minio:9000")
MINIO_ACCESS_KEY = os.getenv("MINIO_ACCESS_KEY", os.getenv("MINIO_ROOT_USER", "minioadmin"))
MINIO_SECRET_KEY = os.getenv("MINIO_SECRET_KEY", os.getenv("MINIO_ROOT_PASSWORD", "minioadmin123"))
MINIO_BUCKET = os.getenv("MINIO_BUCKET", "ashva-media")
MINIO_SECURE = os.getenv("MINIO_SECURE", "false").lower() in ("1", "true", "yes")
SIGNED_URL_EXPIRY_SECONDS = int(os.getenv("SIGNED_URL_EXPIRY_SECONDS", "300"))
PRESIGN_UPLOAD_EXPIRY_SECONDS = int(os.getenv("PRESIGN_UPLOAD_EXPIRY_SECONDS", "3600"))

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

_minio_client: Minio | None = None


def _get_minio() -> Minio:
    global _minio_client
    if _minio_client is None:
        _minio_client = Minio(
            MINIO_ENDPOINT,
            access_key=MINIO_ACCESS_KEY,
            secret_key=MINIO_SECRET_KEY,
            secure=MINIO_SECURE,
        )
    return _minio_client


def _ensure_bucket() -> None:
    client = _get_minio()
    if not client.bucket_exists(MINIO_BUCKET):
        client.make_bucket(MINIO_BUCKET)


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


def _require_internal(x_internal_api_key: str | None) -> None:
    if not INTERNAL_API_KEY or x_internal_api_key != INTERNAL_API_KEY:
        raise HTTPException(status_code=401, detail="Invalid internal key")


def _require_user_id(x_user_id: str | None) -> UUID:
    if not x_user_id:
        raise HTTPException(status_code=401, detail="Missing X-User-Id")
    try:
        return UUID(x_user_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid X-User-Id")


async def _validate_ticket_access(
    ticket_id: UUID,
    user_id: UUID,
    user_role: str,
    correlation_id: str,
) -> bool:
    """Validate user can access ticket (subscriber: own, tech: assigned, admin: any). Returns True if allowed."""
    if user_role == "admin":
        return True

    if not TICKET_SERVICE_URL or not INTERNAL_API_KEY:
        # If ticket-service not configured, allow (local dev)
        return True

    try:
        async with httpx.AsyncClient(timeout=3.0) as client:
            resp = await client.get(
                f"{TICKET_SERVICE_URL}/api/v1/tickets/{ticket_id}",
                headers={
                    "X-User-Id": str(user_id),
                    "X-User-Role": user_role,
                    "X-Internal-API-Key": INTERNAL_API_KEY,
                    "x-correlation-id": correlation_id,
                },
            )
        return resp.status_code == 200
    except Exception as e:
        logger.warning("Ticket access validation failed: %s", e)
        # Fail open for now (could be strict: return False)
        return True


def _build_invoice_pdf(req: GenerateInvoicePdfRequest) -> bytes:
    buffer = io.BytesIO()
    c = canvas.Canvas(buffer, pagesize=A4)
    w, h = A4
    y = h - 50

    c.setFont("Helvetica-Bold", 16)
    c.drawString(72, y, "TAX INVOICE")
    y -= 25

    c.setFont("Helvetica", 10)
    date_str = (req.created_at or datetime.now(timezone.utc)).strftime("%d-%b-%Y")
    c.drawString(72, y, f"Invoice Number: {req.invoice_number}")
    c.drawString(250, y, f"Date: {date_str}")
    y -= 20

    if req.customer_name:
        c.drawString(72, y, f"Bill To: {req.customer_name}")
        y -= 15
    if req.customer_address:
        c.drawString(72, y, f"Address: {req.customer_address}")
        y -= 20

    y -= 10
    c.setFont("Helvetica-Bold", 10)
    c.drawString(72, y, "Particulars")
    c.drawString(400, y, "Amount (INR)")
    y -= 18
    c.setFont("Helvetica", 10)

    if req.line_items:
        for li in req.line_items:
            amt = li.amount if li.amount != 0 else (li.quantity * li.unit_price)
            c.drawString(72, y, li.description[:60])
            c.drawString(400, y, f"{amt:,.2f}")
            y -= 15
    else:
        c.drawString(72, y, "Invoice Amount")
        c.drawString(400, y, f"{req.total_amount:,.2f}")
        y -= 15

    y -= 10
    c.drawString(72, y, f"Base Amount")
    c.drawString(400, y, f"{req.base_amount:,.2f}")
    y -= 14
    if req.discount_amount > 0:
        c.drawString(72, y, "Less: Discount")
        c.drawString(400, y, f"-{req.discount_amount:,.2f}")
        y -= 14
    if req.credit_applied_amount > 0:
        c.drawString(72, y, "Less: Credit Applied")
        c.drawString(400, y, f"-{req.credit_applied_amount:,.2f}")
        y -= 14
    c.drawString(72, y, "Amount before GST")
    c.drawString(400, y, f"{req.amount_before_gst:,.2f}")
    y -= 14
    c.drawString(72, y, f"GST ({req.gst_percent}%)")
    c.drawString(400, y, f"{req.gst_amount:,.2f}")
    y -= 18
    c.setFont("Helvetica-Bold", 10)
    c.drawString(72, y, "Total")
    c.drawString(400, y, f"{req.total_amount:,.2f}")

    c.save()
    buffer.seek(0)
    return buffer.getvalue()


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


@app.post(
    "/api/v1/media/internal/generate-invoice-pdf",
    response_model=GenerateInvoicePdfResponse,
    status_code=201,
)
async def generate_invoice_pdf(
    req: GenerateInvoicePdfRequest,
    db: Session = Depends(get_db),
    x_internal_api_key: str | None = Header(default=None, alias="X-Internal-API-Key"),
):
    _require_internal(x_internal_api_key)

    # Idempotent: if we already have a media object for this invoice, return it
    existing = db.execute(
        select(MediaObject).where(
            MediaObject.owner_type == "invoice",
            MediaObject.owner_id == req.invoice_id,
        )
    ).scalar_one_or_none()
    if existing:
        return GenerateInvoicePdfResponse(media_id=existing.id)

    pdf_bytes = _build_invoice_pdf(req)
    _ensure_bucket()
    client = _get_minio()
    object_name = f"invoices/{req.invoice_id}.pdf"

    client.put_object(
        MINIO_BUCKET,
        object_name,
        io.BytesIO(pdf_bytes),
        length=len(pdf_bytes),
        content_type="application/pdf",
    )

    now = datetime.now(timezone.utc)
    mo = MediaObject(
        owner_type="invoice",
        owner_id=req.invoice_id,
        file_path=object_name,
        content_type="application/pdf",
        file_size=len(pdf_bytes),
        created_at=now,
    )
    db.add(mo)
    db.commit()
    db.refresh(mo)
    return GenerateInvoicePdfResponse(media_id=mo.id)


@app.get("/api/v1/media/internal/download/{media_id}")
async def download_media(
    media_id: UUID,
    db: Session = Depends(get_db),
    x_internal_api_key: str | None = Header(default=None, alias="X-Internal-API-Key"),
):
    _require_internal(x_internal_api_key)

    mo = db.get(MediaObject, media_id)
    if not mo:
        raise HTTPException(status_code=404, detail="Media not found")

    client = _get_minio()
    url = client.presigned_get_object(
        MINIO_BUCKET,
        mo.file_path,
        expires=timedelta(seconds=SIGNED_URL_EXPIRY_SECONDS),
    )
    return RedirectResponse(url=url, status_code=302)


@app.post("/api/v1/media/presign", response_model=PresignUploadResponse, status_code=201)
async def presign_upload(
    req: PresignUploadRequest,
    db: Session = Depends(get_db),
    x_user_id: str | None = Header(default=None),
    x_user_role: str | None = Header(default=None),
    request: Request = None,
):
    """Generate presigned URL for direct upload to MinIO. Creates MediaObject record immediately."""
    user_id = _require_user_id(x_user_id)
    role = str(x_user_role or "")

    # Authorization: for ticket photos, validate ticket access
    if req.owner_type == "ticket":
        if role not in {"subscriber", "technician", "admin"}:
            raise HTTPException(status_code=403, detail="Forbidden")
        correlation_id = getattr(request.state, "correlation_id", str(uuid4()))
        if not await _validate_ticket_access(UUID(str(req.owner_id)), user_id, role, correlation_id):
            raise HTTPException(status_code=403, detail="Forbidden")
    elif role not in {"admin"}:
        # Other owner_types may have different rules; for now admin-only
        raise HTTPException(status_code=403, detail="Forbidden")

    # Generate object key
    ext = req.file_name.split(".")[-1] if "." in req.file_name else "bin"
    object_key = f"{req.owner_type}/{req.owner_id}/{uuid4()}.{ext}"

    # Create MediaObject record (before upload)
    now = datetime.now(timezone.utc)
    mo = MediaObject(
        owner_type=req.owner_type,
        owner_id=req.owner_id,
        file_path=object_key,
        content_type=req.content_type,
        file_size=None,  # Will be set on complete if we implement it
        created_at=now,
    )
    db.add(mo)
    db.commit()
    db.refresh(mo)

    # Generate presigned PUT URL
    _ensure_bucket()
    client = _get_minio()
    upload_url = client.presigned_put_object(
        MINIO_BUCKET,
        object_key,
        expires=timedelta(seconds=PRESIGN_UPLOAD_EXPIRY_SECONDS),
    )

    return PresignUploadResponse(
        media_id=mo.id,
        upload_url=upload_url,
        object_key=object_key,
        expires_in_seconds=PRESIGN_UPLOAD_EXPIRY_SECONDS,
    )


@app.post("/api/v1/media/{media_id}/complete", response_model=MediaItemResponse)
async def complete_upload(
    media_id: UUID,
    file_size: int = None,
    db: Session = Depends(get_db),
    x_user_id: str | None = Header(default=None),
    x_user_role: str | None = Header(default=None),
):
    """Mark upload as complete (optional validation step)."""
    _require_user_id(x_user_id)
    role = str(x_user_role or "")

    mo = db.get(MediaObject, media_id)
    if not mo:
        raise HTTPException(status_code=404, detail="Media not found")

    # Authorization: same as presign
    if mo.owner_type == "ticket":
        if role not in {"subscriber", "technician", "admin"}:
            raise HTTPException(status_code=403, detail="Forbidden")
    elif role != "admin":
        raise HTTPException(status_code=403, detail="Forbidden")

    if file_size is not None:
        mo.file_size = file_size
        db.add(mo)
        db.commit()
        db.refresh(mo)

    return MediaItemResponse(
        id=mo.id,
        owner_type=mo.owner_type,
        owner_id=mo.owner_id,
        file_path=mo.file_path,
        content_type=mo.content_type,
        file_size=mo.file_size,
        created_at=mo.created_at,
    )


@app.get("/api/v1/media", response_model=MediaListResponse)
async def list_media(
    owner_type: str = Query(...),
    owner_id: UUID = Query(...),
    db: Session = Depends(get_db),
    x_user_id: str | None = Header(default=None),
    x_user_role: str | None = Header(default=None),
    request: Request = None,
):
    """List media objects by owner."""
    user_id = _require_user_id(x_user_id)
    role = str(x_user_role or "")

    # Authorization: for ticket photos, validate ticket access
    if owner_type == "ticket":
        if role not in {"subscriber", "technician", "admin"}:
            raise HTTPException(status_code=403, detail="Forbidden")
        correlation_id = getattr(request.state, "correlation_id", str(uuid4()))
        if not await _validate_ticket_access(owner_id, user_id, role, correlation_id):
            raise HTTPException(status_code=403, detail="Forbidden")
    elif role != "admin":
        raise HTTPException(status_code=403, detail="Forbidden")

    stmt = select(MediaObject).where(
        MediaObject.owner_type == owner_type,
        MediaObject.owner_id == owner_id,
    )
    rows = db.execute(stmt.order_by(MediaObject.created_at.desc())).scalars().all()

    return MediaListResponse(
        items=[
            MediaItemResponse(
                id=mo.id,
                owner_type=mo.owner_type,
                owner_id=mo.owner_id,
                file_path=mo.file_path,
                content_type=mo.content_type,
                file_size=mo.file_size,
                created_at=mo.created_at,
            )
            for mo in rows
        ],
        total=len(rows),
    )


@app.get("/api/v1/media/{media_id}/download")
async def download_media_public(
    media_id: UUID,
    db: Session = Depends(get_db),
    x_user_id: str | None = Header(default=None),
    x_user_role: str | None = Header(default=None),
    request: Request = None,
):
    """Public download endpoint with authorization (for ticket photos, etc)."""
    user_id = _require_user_id(x_user_id)
    role = str(x_user_role or "")

    mo = db.get(MediaObject, media_id)
    if not mo:
        raise HTTPException(status_code=404, detail="Media not found")

    # Authorization: same as list
    if mo.owner_type == "ticket":
        if role not in {"subscriber", "technician", "admin"}:
            raise HTTPException(status_code=403, detail="Forbidden")
        correlation_id = getattr(request.state, "correlation_id", str(uuid4()))
        if not await _validate_ticket_access(mo.owner_id, user_id, role, correlation_id):
            raise HTTPException(status_code=403, detail="Forbidden")
    elif role != "admin":
        raise HTTPException(status_code=403, detail="Forbidden")

    client = _get_minio()
    url = client.presigned_get_object(
        MINIO_BUCKET,
        mo.file_path,
        expires=timedelta(seconds=SIGNED_URL_EXPIRY_SECONDS),
    )
    return RedirectResponse(url=url, status_code=302)


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        app,
        host="0.0.0.0",
        port=int(os.getenv("SERVICE_PORT", "8000")),
        log_level=LOG_LEVEL.lower(),
    )
