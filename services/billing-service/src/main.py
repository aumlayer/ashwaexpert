import json
import logging
import os
import time
from datetime import datetime, timezone
from uuid import UUID
from uuid import uuid4

from fastapi import Depends, FastAPI, Header, HTTPException, Query, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
from prometheus_client import CONTENT_TYPE_LATEST, Counter, Histogram, generate_latest
from sqlalchemy import func, select, text
from sqlalchemy.orm import Session

from app.deps import get_db
from app.models import Invoice, InvoiceSequence
from app.schemas import (
    InternalCreateInvoiceFromOrderResponse,
    InvoiceListResponse,
    InvoiceResponse,
)

SERVICE_NAME = os.getenv("SERVICE_NAME", "billing-service")
SERVICE_VERSION = os.getenv("SERVICE_VERSION", "0.1.0")
ENVIRONMENT = os.getenv("ENVIRONMENT", "local")
LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO")
CORS_ORIGINS = os.getenv("CORS_ORIGINS", "*")
INTERNAL_API_KEY = os.getenv("INTERNAL_API_KEY", "")

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


def _require_admin(x_user_role: str | None) -> None:
    if (x_user_role or "") != "admin":
        raise HTTPException(status_code=403, detail="Forbidden")


def _require_user_id(x_user_id: str | None) -> UUID:
    if not x_user_id:
        raise HTTPException(status_code=401, detail="Missing X-User-Id")
    try:
        return UUID(x_user_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid X-User-Id")


def _require_internal(x_internal_api_key: str | None) -> None:
    if not INTERNAL_API_KEY or x_internal_api_key != INTERNAL_API_KEY:
        raise HTTPException(status_code=401, detail="Invalid internal key")


def _fiscal_year_label(now: datetime) -> str:
    # India FY: Apr 1 -> Mar 31
    start_year = now.year if now.month >= 4 else now.year - 1
    end_year = start_year + 1
    return f"FY{start_year % 100:02d}-{end_year % 100:02d}"


def _next_invoice_number(db: Session, now: datetime) -> str:
    fy = _fiscal_year_label(now)

    # Lock row and increment (transaction scope is managed by Session).
    row = db.execute(
        text("SELECT fiscal_year, next_num FROM billing.invoice_sequences WHERE fiscal_year = :fy FOR UPDATE"),
        {"fy": fy},
    ).fetchone()
    if not row:
        seq = InvoiceSequence(fiscal_year=fy, next_num=2, updated_at=now)
        db.add(seq)
        db.flush()
        num = 1
    else:
        num = int(row[1])
        db.execute(
            text(
                "UPDATE billing.invoice_sequences SET next_num = :n, updated_at = :u WHERE fiscal_year = :fy"
            ),
            {"n": num + 1, "u": now, "fy": fy},
        )

    return f"{fy}-INV-{num:06d}"


def _invoice_to_response(i: Invoice) -> InvoiceResponse:
    return InvoiceResponse(
        id=i.id,
        invoice_number=i.invoice_number,
        user_id=i.user_id,
        order_id=i.order_id,
        status=i.status,  # type: ignore[arg-type]
        base_amount=float(i.base_amount),
        discount_amount=float(i.discount_amount),
        credit_applied_amount=float(i.credit_applied_amount),
        amount_before_gst=float(i.amount_before_gst),
        gst_percent=float(i.gst_percent),
        gst_amount=float(i.gst_amount),
        total_amount=float(i.total_amount),
        created_at=i.created_at,
        updated_at=i.updated_at,
    )


@app.get("/api/v1/billing/admin/invoices", response_model=InvoiceListResponse)
async def admin_list_invoices(
    db: Session = Depends(get_db),
    x_user_role: str | None = Header(default=None),
    user_id: UUID | None = Query(default=None),
    status: str | None = Query(default=None),
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
):
    _require_admin(x_user_role)
    stmt = select(Invoice)
    if user_id:
        stmt = stmt.where(Invoice.user_id == user_id)
    if status:
        stmt = stmt.where(Invoice.status == status)
    total = int(db.execute(select(func.count()).select_from(stmt.subquery())).scalar_one())
    rows = db.execute(stmt.order_by(Invoice.created_at.desc()).limit(limit).offset(offset)).scalars().all()
    return InvoiceListResponse(items=[_invoice_to_response(i) for i in rows], total=total)


@app.get("/api/v1/billing/me/invoices", response_model=InvoiceListResponse)
async def list_my_invoices(
    db: Session = Depends(get_db),
    x_user_id: str | None = Header(default=None),
    x_user_role: str | None = Header(default=None),
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
):
    if (x_user_role or "") != "subscriber":
        raise HTTPException(status_code=403, detail="Forbidden")
    user_id = _require_user_id(x_user_id)
    stmt = select(Invoice).where(Invoice.user_id == user_id)
    total = int(db.execute(select(func.count()).select_from(stmt.subquery())).scalar_one())
    rows = db.execute(stmt.order_by(Invoice.created_at.desc()).limit(limit).offset(offset)).scalars().all()
    return InvoiceListResponse(items=[_invoice_to_response(i) for i in rows], total=total)


@app.post("/api/v1/billing/internal/invoices/from-order/{order_id}", response_model=InternalCreateInvoiceFromOrderResponse)
async def internal_create_invoice_from_order(
    order_id: UUID,
    db: Session = Depends(get_db),
    x_internal_api_key: str | None = Header(default=None, alias="X-Internal-API-Key"),
):
    _require_internal(x_internal_api_key)

    existing = db.execute(select(Invoice).where(Invoice.order_id == order_id)).scalar_one_or_none()
    if existing:
        return InternalCreateInvoiceFromOrderResponse(created=False, invoice=_invoice_to_response(existing))

    # Pull order amounts from subscription.orders (cross schema)
    row = db.execute(
        text(
            """
            SELECT user_id, status, base_amount, discount_amount, credit_applied_amount,
                   amount_before_gst, gst_percent, gst_amount, total_amount
            FROM subscription.orders
            WHERE id = :oid
            """
        ),
        {"oid": str(order_id)},
    ).fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="Order not found")
    if str(row[1]) != "paid":
        raise HTTPException(status_code=400, detail="Order is not paid")

    now = datetime.now(timezone.utc)
    invoice_number = _next_invoice_number(db, now)
    inv = Invoice(
        invoice_number=invoice_number,
        user_id=UUID(str(row[0])),
        order_id=order_id,
        status="issued",
        base_amount=float(row[2]),
        discount_amount=float(row[3]),
        credit_applied_amount=float(row[4]),
        amount_before_gst=float(row[5]),
        gst_percent=float(row[6]),
        gst_amount=float(row[7]),
        total_amount=float(row[8]),
        meta=None,
        created_at=now,
        updated_at=now,
    )
    db.add(inv)
    db.commit()
    db.refresh(inv)
    return InternalCreateInvoiceFromOrderResponse(created=True, invoice=_invoice_to_response(inv))


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        app,
        host="0.0.0.0",
        port=int(os.getenv("SERVICE_PORT", "8000")),
        log_level=LOG_LEVEL.lower(),
    )
