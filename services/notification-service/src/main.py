import asyncio
import json
import logging
import os
import smtplib
import time
from datetime import datetime, timezone
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from uuid import uuid4

import httpx
from fastapi import Depends, FastAPI, Header, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
from prometheus_client import CONTENT_TYPE_LATEST, Counter, Histogram, generate_latest
from sqlalchemy.orm import Session

from app.deps import get_db
from app.models import DeliveryLog
from app.schemas import SendRequest, SendResponse
from app.templates import get_email_subject, get_template

SERVICE_NAME = os.getenv("SERVICE_NAME", "notification-service")
SERVICE_VERSION = os.getenv("SERVICE_VERSION", "0.1.0")
ENVIRONMENT = os.getenv("ENVIRONMENT", "local")
LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO")
CORS_ORIGINS = os.getenv("CORS_ORIGINS", "*")
INTERNAL_API_KEY = os.getenv("INTERNAL_API_KEY", "")
MSG91_AUTH_KEY = os.getenv("MSG91_AUTH_KEY", "")
MSG91_SENDER = os.getenv("MSG91_SENDER", "ASHVA")
SMTP_HOST = os.getenv("SMTP_HOST", "")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USER = os.getenv("SMTP_USER", "")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "")
SMTP_FROM = os.getenv("SMTP_FROM", os.getenv("SMTP_USER", "noreply@ashva.com"))
SMTP_USE_TLS = os.getenv("SMTP_USE_TLS", "true").lower() in ("1", "true", "yes")

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


def _require_internal(x_internal_api_key: str | None) -> None:
    if not INTERNAL_API_KEY or x_internal_api_key != INTERNAL_API_KEY:
        raise HTTPException(status_code=401, detail="Invalid internal key")


def _render(template_key: str, channel: str, context: dict) -> tuple[str | None, str | None]:
    """Returns (subject for email or None, body)."""
    body_tpl = get_template(template_key, channel)
    if not body_tpl:
        return None, None
    try:
        body = body_tpl.format(**{k: (v if v is not None else "") for k, v in context.items()})
    except KeyError as e:
        body = body_tpl
        for k, v in context.items():
            body = body.replace("{" + k + "}", str(v))
    subject = None
    if channel == "email":
        subj_tpl = get_email_subject(template_key)
        if subj_tpl:
            try:
                subject = subj_tpl.format(**{k: (v if v is not None else "") for k, v in context.items()})
            except KeyError:
                subject = subj_tpl
    return subject, body


def _send_sms_sync(recipient: str, body: str) -> tuple[bool, str, str]:
    """Returns (ok, status, provider_response)."""
    if not MSG91_AUTH_KEY or not MSG91_SENDER:
        logger.info("SMS skipped (MSG91 not configured): to=%s body=%s", recipient[:20], body[:50])
        return False, "skipped", "MSG91 not configured"

    try:
        with httpx.Client(timeout=10.0) as client:
            r = client.get(
                "https://api.msg91.com/api/v2/sendsms",
                params={
                    "authkey": MSG91_AUTH_KEY,
                    "mobiles": recipient.strip().replace("+91", "").replace(" ", ""),
                    "message": body,
                    "sender": MSG91_SENDER,
                },
            )
        if r.status_code == 200:
            j = r.json()
            if isinstance(j, dict) and j.get("type") == "success":
                return True, "sent", str(r.text)[:500]
            return False, "failed", str(r.text)[:500]
        return False, "failed", f"HTTP {r.status_code}: {r.text[:200]}"
    except Exception as e:
        logger.exception("SMS send error: %s", e)
        return False, "failed", str(e)[:500]


def _send_email_sync(recipient: str, subject: str, body: str) -> tuple[bool, str, str]:
    """Returns (ok, status, provider_response)."""
    if not SMTP_HOST:
        logger.info("Email skipped (SMTP not configured): to=%s subj=%s", recipient[:20], subject[:30])
        return False, "skipped", "SMTP not configured"

    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject or "Notification"
        msg["From"] = SMTP_FROM
        msg["To"] = recipient
        msg.attach(MIMEText(body, "plain", "utf-8"))

        with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as s:
            if SMTP_USE_TLS:
                s.starttls()
            if SMTP_USER and SMTP_PASSWORD:
                s.login(SMTP_USER, SMTP_PASSWORD)
            s.sendmail(SMTP_FROM, [recipient], msg.as_string())
        return True, "sent", "OK"
    except Exception as e:
        logger.exception("Email send error: %s", e)
        return False, "failed", str(e)[:500]


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


@app.post("/api/v1/notifications/internal/send", response_model=SendResponse)
async def send_notification(
    req: SendRequest,
    db: Session = Depends(get_db),
    x_internal_api_key: str | None = Header(default=None, alias="X-Internal-API-Key"),
):
    _require_internal(x_internal_api_key)

    subject, body = _render(req.template_key, req.channel, req.context)
    if not body:
        raise HTTPException(status_code=400, detail=f"Unknown template or channel: {req.template_key}/{req.channel}")

    if req.channel == "sms":
        ok, status, prov = await asyncio.to_thread(_send_sms_sync, req.recipient, body)
    else:
        ok, status, prov = await asyncio.to_thread(
            _send_email_sync, req.recipient, subject or "Notification", body
        )

    now = datetime.now(timezone.utc)
    log = DeliveryLog(
        template_key=req.template_key,
        channel=req.channel,
        recipient=req.recipient,
        status=status,
        provider_response=prov,
        context=req.context,
        created_at=now,
    )
    db.add(log)
    db.commit()

    return SendResponse(ok=ok, status=status, message=prov)
