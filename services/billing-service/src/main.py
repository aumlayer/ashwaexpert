import json
import logging
import os
import time
from datetime import datetime, timezone
from decimal import Decimal, ROUND_HALF_UP
from typing import Optional, Union
from uuid import UUID
from uuid import uuid4

import httpx
from fastapi import Depends, FastAPI, Header, HTTPException, Query, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse, Response
from prometheus_client import CONTENT_TYPE_LATEST, Counter, Histogram, generate_latest
from sqlalchemy import func, select, text
from sqlalchemy.orm import Session

from app.deps import get_db
from app.models import (
    CreditLedgerAccount,
    CreditLedgerEntry,
    Invoice,
    InvoiceCreditApplication,
    InvoiceSequence,
)
from app.schemas import (
    CreditAddRequest,
    CreditApplyToInvoiceRequest,
    CreditApplyToInvoiceResponse,
    CreditEntryResponse,
    CreditMeResponse,
    CreditReverseRequest,
    InternalCreateInvoiceFromOrderResponse,
    InvoiceListResponse,
    InvoiceResponse,
    ProrationApplyRequest,
    ProrationApplyResponse,
    ProrationEstimateRequest,
    ProrationEstimateResponse,
)

SERVICE_NAME = os.getenv("SERVICE_NAME", "billing-service")
SERVICE_VERSION = os.getenv("SERVICE_VERSION", "0.1.0")
ENVIRONMENT = os.getenv("ENVIRONMENT", "local")
LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO")
CORS_ORIGINS = os.getenv("CORS_ORIGINS", "*")
INTERNAL_API_KEY = os.getenv("INTERNAL_API_KEY", "")
MEDIA_SERVICE_URL = os.getenv("MEDIA_SERVICE_URL", "")
NOTIFICATION_SERVICE_URL = os.getenv("NOTIFICATION_SERVICE_URL", "")
AUTH_SERVICE_URL = os.getenv("AUTH_SERVICE_URL", "")

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


@app.get("/ready")
async def ready() -> dict:
    return {
        "status": "ready",
        "service": SERVICE_NAME,
        "version": SERVICE_VERSION,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


@app.get("/live")
async def live() -> dict:
    return {
        "status": "live",
        "service": SERVICE_NAME,
        "version": SERVICE_VERSION,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


@app.get("/metrics")
async def metrics() -> Response:
    return Response(generate_latest(), media_type=CONTENT_TYPE_LATEST)


def _require_admin(x_user_role: Optional[str]) -> None:
    if (x_user_role or "") != "admin":
        raise HTTPException(status_code=403, detail="Forbidden")


def _require_user_id(x_user_id: Optional[str]) -> UUID:
    if not x_user_id:
        raise HTTPException(status_code=401, detail="Missing X-User-Id")
    try:
        return UUID(x_user_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid X-User-Id")


def _require_internal(x_internal_api_key: Optional[str]) -> None:
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
        invoice_type=getattr(i, "invoice_type", "order"),  # type: ignore[arg-type]
        subscription_id=getattr(i, "subscription_id", None),
        status=i.status,  # type: ignore[arg-type]
        base_amount=float(i.base_amount),
        discount_amount=float(i.discount_amount),
        credit_applied_amount=float(i.credit_applied_amount),
        paid_amount=float(getattr(i, "paid_amount", 0) or 0),
        due_amount=float(getattr(i, "due_amount", 0) or 0),
        amount_before_gst=float(i.amount_before_gst),
        gst_percent=float(i.gst_percent),
        gst_amount=float(i.gst_amount),
        total_amount=float(i.total_amount),
        due_date=getattr(i, "due_date", None),
        pdf_media_id=getattr(i, "pdf_media_id", None),
        created_at=i.created_at,
        updated_at=i.updated_at,
    )


def _money(v: Union[float, Decimal]) -> Decimal:
    d = v if isinstance(v, Decimal) else Decimal(str(v))
    return d.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)


def _get_user_id_for_subscriber(db: Session, subscriber_id: UUID) -> UUID:
    row = db.execute(
        text("SELECT user_id FROM subscriber.subscribers WHERE id = :sid LIMIT 1"),
        {"sid": str(subscriber_id)},
    ).fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="Subscriber not found")
    return UUID(str(row[0]))


def _get_or_create_credit_account(db: Session, *, subscriber_id: UUID, currency: str = "INR") -> CreditLedgerAccount:
    now = datetime.now(timezone.utc)
    acct = (
        db.execute(
            select(CreditLedgerAccount)
            .where(CreditLedgerAccount.subscriber_id == subscriber_id, CreditLedgerAccount.currency == currency)
            .with_for_update()
        )
        .scalars()
        .first()
    )
    if acct:
        return acct
    acct = CreditLedgerAccount(
        subscriber_id=subscriber_id,
        currency=currency,
        balance_amount=_money(0),
        created_at=now,
        updated_at=now,
    )
    db.add(acct)
    db.flush()
    return acct


def _entry_to_response(e: CreditLedgerEntry) -> CreditEntryResponse:
    return CreditEntryResponse(
        id=e.id,
        direction=e.direction,  # type: ignore[arg-type]
        amount=float(e.amount),
        reason=e.reason,
        reference_type=e.reference_type,
        reference_id=e.reference_id,
        idempotency_key=e.idempotency_key,
        created_at=e.created_at,
    )


@app.get("/api/v1/billing/admin/invoices", response_model=InvoiceListResponse)
async def admin_list_invoices(
    db: Session = Depends(get_db),
    x_user_role: Optional[str] = Header(default=None),
    user_id: Optional[UUID] = Query(default=None),
    status: Optional[str] = Query(default=None),
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
    x_user_id: Optional[str] = Header(default=None),
    x_user_role: Optional[str] = Header(default=None),
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
    x_internal_api_key: Optional[str] = Header(default=None, alias="X-Internal-API-Key"),
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
        invoice_type="order",
        subscription_id=None,
        status="paid",  # order is already paid when we create invoice
        base_amount=float(row[2]),
        discount_amount=float(row[3]),
        credit_applied_amount=float(row[4]),
        paid_amount=float(row[8]),  # order total already paid
        due_amount=0.0,
        amount_before_gst=float(row[5]),
        gst_percent=float(row[6]),
        gst_amount=float(row[7]),
        total_amount=float(row[8]),
        meta=None,
        due_date=None,
        pdf_media_id=None,
        created_at=now,
        updated_at=now,
    )
    db.add(inv)
    db.commit()
    db.refresh(inv)

    # Generate PDF and optionally notify (best-effort)
    if MEDIA_SERVICE_URL and INTERNAL_API_KEY:
        try:
            async with httpx.AsyncClient(timeout=15.0) as client:
                r = await client.post(
                    f"{MEDIA_SERVICE_URL}/api/v1/media/internal/generate-invoice-pdf",
                    headers={"X-Internal-API-Key": INTERNAL_API_KEY},
                    json={
                        "invoice_id": str(inv.id),
                        "invoice_number": inv.invoice_number,
                        "user_id": str(inv.user_id),
                        "base_amount": float(inv.base_amount),
                        "discount_amount": float(inv.discount_amount),
                        "credit_applied_amount": float(inv.credit_applied_amount),
                        "amount_before_gst": float(inv.amount_before_gst),
                        "gst_percent": float(inv.gst_percent),
                        "gst_amount": float(inv.gst_amount),
                        "total_amount": float(inv.total_amount),
                        "created_at": inv.created_at.isoformat(),
                    },
                )
            if r.status_code == 201:
                data = r.json()
                inv.pdf_media_id = UUID(str(data["media_id"]))
                db.add(inv)
                db.commit()
                db.refresh(inv)
        except Exception as e:
            logger.warning("Media PDF generation failed: %s", e)

    # Optional: send invoice_generated notification if we have user contact
    if NOTIFICATION_SERVICE_URL and AUTH_SERVICE_URL and INTERNAL_API_KEY:
        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                u = await client.get(
                    f"{AUTH_SERVICE_URL}/api/v1/auth/internal/users/{inv.user_id}",
                    headers={"X-Internal-API-Key": INTERNAL_API_KEY},
                )
            if u.status_code == 200:
                ud = u.json()
                email = ud.get("email")
                if email:
                    async with httpx.AsyncClient(timeout=5.0) as c:
                        await c.post(
                            f"{NOTIFICATION_SERVICE_URL}/api/v1/notifications/internal/send",
                            headers={"X-Internal-API-Key": INTERNAL_API_KEY},
                            json={
                                "template_key": "invoice_generated",
                                "channel": "email",
                                "recipient": email,
                                "context": {
                                    "invoice_number": inv.invoice_number,
                                    "total_amount": float(inv.total_amount),
                                },
                            },
                        )
        except Exception as e:
            logger.warning("Notification send failed: %s", e)

    return InternalCreateInvoiceFromOrderResponse(created=True, invoice=_invoice_to_response(inv))


@app.patch("/api/v1/billing/internal/invoices/{invoice_id}/mark-paid", response_model=InvoiceResponse)
async def internal_mark_invoice_paid(
    invoice_id: UUID,
    db: Session = Depends(get_db),
    x_internal_api_key: Optional[str] = Header(default=None, alias="X-Internal-API-Key"),
):
    _require_internal(x_internal_api_key)
    inv = db.get(Invoice, invoice_id)
    if not inv:
        raise HTTPException(status_code=404, detail="Invoice not found")
    if inv.status == "paid":
        return _invoice_to_response(inv)

    now = datetime.now(timezone.utc)
    inv.status = "paid"
    # Settle remaining due (cash payment). paid_amount excludes credit_applied_amount.
    inv.paid_amount = float(_money(Decimal(str(inv.total_amount)) - Decimal(str(inv.credit_applied_amount or 0))))
    inv.due_amount = 0.0
    inv.updated_at = now
    db.add(inv)
    db.commit()
    db.refresh(inv)

    # Generate PDF if not already present
    if not inv.pdf_media_id and MEDIA_SERVICE_URL and INTERNAL_API_KEY:
        try:
            async with httpx.AsyncClient(timeout=15.0) as client:
                r = await client.post(
                    f"{MEDIA_SERVICE_URL}/api/v1/media/internal/generate-invoice-pdf",
                    headers={"X-Internal-API-Key": INTERNAL_API_KEY},
                    json={
                        "invoice_id": str(inv.id),
                        "invoice_number": inv.invoice_number,
                        "user_id": str(inv.user_id),
                        "base_amount": float(inv.base_amount),
                        "discount_amount": float(inv.discount_amount),
                        "credit_applied_amount": float(inv.credit_applied_amount),
                        "amount_before_gst": float(inv.amount_before_gst),
                        "gst_percent": float(inv.gst_percent),
                        "gst_amount": float(inv.gst_amount),
                        "total_amount": float(inv.total_amount),
                        "created_at": inv.created_at.isoformat(),
                    },
                )
            if r.status_code == 201:
                inv.pdf_media_id = UUID(str(r.json()["media_id"]))
                db.add(inv)
                db.commit()
                db.refresh(inv)
        except Exception as e:
            logger.warning("Media PDF generation failed: %s", e)

    return _invoice_to_response(inv)


async def _redirect_to_pdf(inv: Invoice) -> RedirectResponse:
    if not inv.pdf_media_id:
        raise HTTPException(status_code=404, detail="PDF not yet generated")
    if not MEDIA_SERVICE_URL or not INTERNAL_API_KEY:
        raise HTTPException(status_code=503, detail="PDF service unavailable")
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            r = await client.get(
                f"{MEDIA_SERVICE_URL}/api/v1/media/internal/download/{inv.pdf_media_id}",
                headers={"X-Internal-API-Key": INTERNAL_API_KEY},
                follow_redirects=False,
            )
        if r.status_code in (302, 301) and r.headers.get("location"):
            return RedirectResponse(url=r.headers["location"], status_code=302)
        raise HTTPException(status_code=502, detail="Could not get PDF URL")
    except httpx.HTTPError as e:
        raise HTTPException(status_code=502, detail=str(e))


@app.get("/api/v1/billing/me/invoices/{invoice_id}/pdf")
async def get_my_invoice_pdf(
    invoice_id: UUID,
    db: Session = Depends(get_db),
    x_user_id: Optional[str] = Header(default=None),
    x_user_role: Optional[str] = Header(default=None),
):
    if (x_user_role or "") != "subscriber":
        raise HTTPException(status_code=403, detail="Forbidden")
    uid = _require_user_id(x_user_id)
    inv = db.get(Invoice, invoice_id)
    if not inv or inv.user_id != uid:
        raise HTTPException(status_code=404, detail="Invoice not found")
    return await _redirect_to_pdf(inv)


@app.get("/api/v1/billing/admin/invoices/{invoice_id}/pdf")
async def admin_get_invoice_pdf(
    invoice_id: UUID,
    db: Session = Depends(get_db),
    x_user_role: Optional[str] = Header(default=None),
):
    _require_admin(x_user_role)
    inv = db.get(Invoice, invoice_id)
    if not inv:
        raise HTTPException(status_code=404, detail="Invoice not found")
    return await _redirect_to_pdf(inv)


@app.post("/api/v1/billing/internal/jobs/mark-overdue-invoices")
async def job_mark_overdue_invoices(
    db: Session = Depends(get_db),
    x_internal_api_key: Optional[str] = Header(default=None, alias="X-Internal-API-Key"),
):
    _require_internal(x_internal_api_key)
    now = datetime.now(timezone.utc)
    stmt = select(Invoice).where(
        Invoice.status == "issued",
        Invoice.due_date.is_not(None),
        Invoice.due_date < now,
    )
    rows = db.execute(stmt).scalars().all()
    for inv in rows:
        inv.status = "overdue"
        inv.updated_at = now
        db.add(inv)
    db.commit()
    return {"marked": len(rows)}


def _get_subscriber_id_for_user(db: Session, user_id: UUID) -> UUID:
    row = db.execute(
        text("SELECT id FROM subscriber.subscribers WHERE user_id = :uid LIMIT 1"),
        {"uid": str(user_id)},
    ).fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="Subscriber profile not found")
    return UUID(str(row[0]))


@app.get("/api/v1/billing/credits/me", response_model=CreditMeResponse)
async def get_my_credits(
    db: Session = Depends(get_db),
    x_user_id: Optional[str] = Header(default=None),
    x_user_role: Optional[str] = Header(default=None),
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
):
    if (x_user_role or "") != "subscriber":
        raise HTTPException(status_code=403, detail="Forbidden")
    user_id = _require_user_id(x_user_id)
    subscriber_id = _get_subscriber_id_for_user(db, user_id)
    acct = _get_or_create_credit_account(db, subscriber_id=subscriber_id, currency="INR")

    stmt = select(CreditLedgerEntry).where(CreditLedgerEntry.account_id == acct.id)
    total = int(db.execute(select(func.count()).select_from(stmt.subquery())).scalar_one())
    rows = (
        db.execute(stmt.order_by(CreditLedgerEntry.created_at.desc()).limit(limit).offset(offset))
        .scalars()
        .all()
    )
    return CreditMeResponse(
        account={
            "subscriber_id": subscriber_id,
            "currency": acct.currency,
            "balance_amount": float(acct.balance_amount),
        },
        items=[_entry_to_response(e) for e in rows],
        total=total,
    )


@app.post("/api/v1/billing/internal/credits/{subscriber_id}/add", response_model=CreditEntryResponse, status_code=201)
async def internal_add_credit(
    subscriber_id: UUID,
    req: CreditAddRequest,
    db: Session = Depends(get_db),
    x_internal_api_key: Optional[str] = Header(default=None, alias="X-Internal-API-Key"),
):
    _require_internal(x_internal_api_key)
    acct = _get_or_create_credit_account(db, subscriber_id=subscriber_id, currency="INR")

    if req.idempotency_key:
        existing = (
            db.execute(
                select(CreditLedgerEntry).where(
                    CreditLedgerEntry.account_id == acct.id,
                    CreditLedgerEntry.idempotency_key == req.idempotency_key,
                )
            )
            .scalars()
            .first()
        )
        if existing:
            return _entry_to_response(existing)

    now = datetime.now(timezone.utc)
    amt = _money(req.amount)

    entry = CreditLedgerEntry(
        account_id=acct.id,
        direction="credit",
        amount=float(amt),
        reason=req.reason,
        reference_type=req.reference_type,
        reference_id=req.reference_id,
        idempotency_key=req.idempotency_key,
        notes=req.notes,
        created_by_user_id=None,
        created_by_role="system",
        created_at=now,
    )
    acct.balance_amount = float(_money(Decimal(str(acct.balance_amount)) + amt))
    acct.updated_at = now
    db.add(acct)
    db.add(entry)
    db.commit()
    db.refresh(entry)
    return _entry_to_response(entry)


@app.post(
    "/api/v1/billing/internal/credits/{subscriber_id}/apply-to-invoice",
    response_model=CreditApplyToInvoiceResponse,
)
async def internal_apply_credits_to_invoice(
    subscriber_id: UUID,
    req: CreditApplyToInvoiceRequest,
    db: Session = Depends(get_db),
    x_internal_api_key: Optional[str] = Header(default=None, alias="X-Internal-API-Key"),
):
    _require_internal(x_internal_api_key)
    acct = _get_or_create_credit_account(db, subscriber_id=subscriber_id, currency="INR")
    inv = db.get(Invoice, req.invoice_id)
    if not inv:
        raise HTTPException(status_code=404, detail="Invoice not found")
    if inv.status == "cancelled":
        raise HTTPException(status_code=400, detail="Cannot apply credits to cancelled invoice")

    # Idempotency: if debit already exists for key, return existing result
    if req.idempotency_key:
        existing_debit = (
            db.execute(
                select(CreditLedgerEntry).where(
                    CreditLedgerEntry.account_id == acct.id,
                    CreditLedgerEntry.idempotency_key == req.idempotency_key,
                    CreditLedgerEntry.direction == "debit",
                    CreditLedgerEntry.reference_type == "invoice",
                    CreditLedgerEntry.reference_id == str(req.invoice_id),
                )
            )
            .scalars()
            .first()
        )
        if existing_debit:
            app_row = (
                db.execute(
                    select(InvoiceCreditApplication).where(
                        InvoiceCreditApplication.debit_entry_id == existing_debit.id
                    )
                )
                .scalars()
                .first()
            )
            applied = float(app_row.applied_amount) if app_row else float(existing_debit.amount)
            db.refresh(inv)
            return CreditApplyToInvoiceResponse(
                invoice=_invoice_to_response(inv),
                applied_amount=applied,
                debit_entry_id=existing_debit.id,
            )

    now = datetime.now(timezone.utc)

    available = _money(acct.balance_amount)
    due = _money(getattr(inv, "due_amount", inv.total_amount) or 0)
    if due <= 0:
        raise HTTPException(status_code=400, detail="Invoice has no due amount")

    requested = _money(req.amount) if req.amount is not None else due
    apply_amt = min(available, due, requested)
    if apply_amt <= 0:
        raise HTTPException(status_code=400, detail="No credits available to apply")

    # Create DEBIT entry and application atomically
    debit = CreditLedgerEntry(
        account_id=acct.id,
        direction="debit",
        amount=float(apply_amt),
        reason="adjustment",
        reference_type="invoice",
        reference_id=str(req.invoice_id),
        idempotency_key=req.idempotency_key,
        notes="Applied to invoice",
        created_by_user_id=None,
        created_by_role="system",
        created_at=now,
    )
    db.add(debit)
    db.flush()

    db.add(
        InvoiceCreditApplication(
            invoice_id=inv.id,
            account_id=acct.id,
            debit_entry_id=debit.id,
            applied_amount=float(apply_amt),
            created_at=now,
        )
    )

    # Update account and invoice amounts
    acct.balance_amount = float(_money(Decimal(str(acct.balance_amount)) - apply_amt))
    acct.updated_at = now
    inv.credit_applied_amount = float(_money(Decimal(str(inv.credit_applied_amount or 0)) + apply_amt))
    inv.due_amount = float(_money(Decimal(str(inv.due_amount or 0)) - apply_amt))
    if _money(inv.due_amount) <= 0:
        inv.due_amount = 0.0
        inv.status = "paid"
    inv.updated_at = now

    db.add(acct)
    db.add(inv)
    db.commit()
    db.refresh(inv)
    db.refresh(debit)
    return CreditApplyToInvoiceResponse(
        invoice=_invoice_to_response(inv),
        applied_amount=float(apply_amt),
        debit_entry_id=debit.id,
    )


@app.post("/api/v1/billing/internal/credits/{subscriber_id}/reverse", response_model=CreditEntryResponse, status_code=201)
async def internal_reverse_credit_debit(
    subscriber_id: UUID,
    req: CreditReverseRequest,
    db: Session = Depends(get_db),
    x_internal_api_key: Optional[str] = Header(default=None, alias="X-Internal-API-Key"),
):
    _require_internal(x_internal_api_key)
    acct = _get_or_create_credit_account(db, subscriber_id=subscriber_id, currency="INR")

    debit = db.get(CreditLedgerEntry, req.debit_entry_id)
    if not debit or debit.account_id != acct.id or debit.direction != "debit":
        raise HTTPException(status_code=404, detail="Debit entry not found")

    if req.idempotency_key:
        existing = (
            db.execute(
                select(CreditLedgerEntry).where(
                    CreditLedgerEntry.account_id == acct.id,
                    CreditLedgerEntry.idempotency_key == req.idempotency_key,
                )
            )
            .scalars()
            .first()
        )
        if existing:
            return _entry_to_response(existing)

    now = datetime.now(timezone.utc)
    amt = _money(debit.amount)
    entry = CreditLedgerEntry(
        account_id=acct.id,
        direction="credit",
        amount=float(amt),
        reason=req.reason,
        reference_type="debit_reversal",
        reference_id=str(debit.id),
        idempotency_key=req.idempotency_key,
        notes="Reversal of prior debit entry",
        created_by_user_id=None,
        created_by_role="system",
        created_at=now,
    )
    acct.balance_amount = float(_money(Decimal(str(acct.balance_amount)) + amt))
    acct.updated_at = now
    db.add(acct)
    db.add(entry)
    db.commit()
    db.refresh(entry)
    return _entry_to_response(entry)


def _proration_days(start: datetime, end: datetime) -> int:
    # Treat periods as [start, end) to avoid double-counting the boundary day.
    return max(0, (end.date() - start.date()).days)


def _proration_remaining_days(end: datetime, effective_at: datetime) -> int:
    return max(0, (end.date() - effective_at.date()).days)


def _get_rental_gst_percent(db: Session) -> Decimal:
    row = db.execute(
        text("SELECT gst_percent FROM subscription.tax_configs WHERE service_type = 'rental' LIMIT 1")
    ).fetchone()
    if row and row[0] is not None:
        return Decimal(str(row[0]))
    return Decimal("18.0")


@app.post("/api/v1/billing/internal/proration/estimate", response_model=ProrationEstimateResponse)
async def internal_proration_estimate(
    req: ProrationEstimateRequest,
    db: Session = Depends(get_db),
    x_internal_api_key: Optional[str] = Header(default=None, alias="X-Internal-API-Key"),
):
    _require_internal(x_internal_api_key)

    total_days = _proration_days(req.current_period_start, req.current_period_end)
    remaining_days = _proration_remaining_days(req.current_period_end, req.effective_at)
    if total_days <= 0:
        raise HTTPException(status_code=400, detail="Invalid billing period")

    from_price = Decimal(str(req.from_plan_price))
    to_price = Decimal(str(req.to_plan_price))

    old_unused = (from_price * Decimal(remaining_days) / Decimal(total_days)).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
    new_charge = (to_price * Decimal(remaining_days) / Decimal(total_days)).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
    net = (new_charge - old_unused).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)

    return ProrationEstimateResponse(
        old_unused_credit=float(old_unused),
        new_remaining_charge=float(new_charge),
        net_amount=float(net),
        currency=req.currency,
        breakdown={
            "total_days": total_days,
            "remaining_days": remaining_days,
            "from_plan_price": float(from_price),
            "to_plan_price": float(to_price),
        },
    )


@app.post("/api/v1/billing/internal/proration/apply", response_model=ProrationApplyResponse)
async def internal_proration_apply(
    req: ProrationApplyRequest,
    db: Session = Depends(get_db),
    x_internal_api_key: Optional[str] = Header(default=None, alias="X-Internal-API-Key"),
):
    _require_internal(x_internal_api_key)

    # Idempotency: reuse ledger entry or invoice if key already processed
    idk = req.idempotency_key
    if idk:
        existing_invoice = (
            db.execute(
                select(Invoice).where(
                    Invoice.invoice_type == "proration",
                    Invoice.subscription_id == req.subscription_id,
                    Invoice.meta.is_not(None),
                )
            )
            .scalars()
            .first()
        )
        if existing_invoice and isinstance(existing_invoice.meta, dict) and existing_invoice.meta.get("idempotency_key") == idk:
            return ProrationApplyResponse(
                net_amount=float(existing_invoice.total_amount),
                currency=req.currency,
                invoice_id=existing_invoice.id,
                credit_entry_id=None,
                status="invoice_created",
            )

    est = await internal_proration_estimate(req, db, x_internal_api_key)  # type: ignore[arg-type]
    net = Decimal(str(est.net_amount))
    now = datetime.now(timezone.utc)

    if net > 0 and req.create_invoice_if_positive:
        user_id = _get_user_id_for_subscriber(db, req.subscriber_id)
        gst_percent = _get_rental_gst_percent(db)
        gst_amount = (net * gst_percent / Decimal("100.0")).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
        total = (net + gst_amount).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)

        invoice_number = _next_invoice_number(db, now)
        inv = Invoice(
            invoice_number=invoice_number,
            user_id=user_id,
            order_id=None,
            invoice_type="proration",
            subscription_id=req.subscription_id,
            status="issued",
            base_amount=float(net),
            discount_amount=0.0,
            credit_applied_amount=0.0,
            paid_amount=0.0,
            due_amount=float(total),
            amount_before_gst=float(net),
            gst_percent=float(gst_percent),
            gst_amount=float(gst_amount),
            total_amount=float(total),
            meta={
                "proration": {
                    "old_unused_credit": est.old_unused_credit,
                    "new_remaining_charge": est.new_remaining_charge,
                    "net_amount": est.net_amount,
                    "breakdown": est.breakdown,
                },
                "idempotency_key": idk,
            },
            due_date=None,
            pdf_media_id=None,
            created_at=now,
            updated_at=now,
        )
        db.add(inv)
        db.commit()
        db.refresh(inv)
        return ProrationApplyResponse(
            net_amount=float(total),
            currency=req.currency,
            invoice_id=inv.id,
            credit_entry_id=None,
            status="invoice_created",
        )

    if net < 0 and req.create_credit_if_negative:
        acct = _get_or_create_credit_account(db, subscriber_id=req.subscriber_id, currency=req.currency)

        # idempotency: by account+idempotency_key
        if idk:
            existing = (
                db.execute(
                    select(CreditLedgerEntry).where(
                        CreditLedgerEntry.account_id == acct.id,
                        CreditLedgerEntry.idempotency_key == idk,
                    )
                )
                .scalars()
                .first()
            )
            if existing:
                return ProrationApplyResponse(
                    net_amount=float(net),
                    currency=req.currency,
                    invoice_id=None,
                    credit_entry_id=existing.id,
                    status="credit_created",
                )

        credit_amt = _money(abs(net))
        entry = CreditLedgerEntry(
            account_id=acct.id,
            direction="credit",
            amount=float(credit_amt),
            reason="proration",
            reference_type="subscription",
            reference_id=str(req.subscription_id),
            idempotency_key=idk,
            notes="Proration net credit",
            created_by_user_id=None,
            created_by_role="system",
            created_at=now,
        )
        acct.balance_amount = float(_money(Decimal(str(acct.balance_amount)) + credit_amt))
        acct.updated_at = now
        db.add(acct)
        db.add(entry)
        db.commit()
        db.refresh(entry)
        return ProrationApplyResponse(
            net_amount=float(net),
            currency=req.currency,
            invoice_id=None,
            credit_entry_id=entry.id,
            status="credit_created",
        )

    return ProrationApplyResponse(
        net_amount=float(net),
        currency=req.currency,
        invoice_id=None,
        credit_entry_id=None,
        status="no_action",
    )


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        app,
        host="0.0.0.0",
        port=int(os.getenv("SERVICE_PORT", "8000")),
        log_level=LOG_LEVEL.lower(),
    )
