import json
import logging
import os
import re
import time
import asyncio
from collections.abc import AsyncIterator
from datetime import datetime, timezone
from typing import Dict, Iterable
from uuid import uuid4

import httpx
import yaml
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, Response
from fastapi.openapi.utils import get_openapi
from prometheus_client import CONTENT_TYPE_LATEST, Counter, Histogram, generate_latest
from redis import Redis
from starlette.responses import StreamingResponse

SERVICE_NAME = os.getenv("SERVICE_NAME", "gateway-service")
SERVICE_VERSION = os.getenv("SERVICE_VERSION", "0.1.0")
ENVIRONMENT = os.getenv("ENVIRONMENT", "local")
LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO")
CORS_ORIGINS = os.getenv("CORS_ORIGINS", "*")
AUTH_SERVICE_URL = os.getenv("AUTH_SERVICE_URL", "http://auth-service:8000")
REDIS_URL = os.getenv("REDIS_URL", "redis://redis:6379")
CONSOLIDATED_OPENAPI_PATH = os.getenv("CONSOLIDATED_OPENAPI_PATH", "/app/openapi.yaml")

SERVICE_URLS: Dict[str, str] = {
    "auth": os.getenv("AUTH_SERVICE_URL", "http://auth-service:8000"),
    "leads": os.getenv("LEAD_SERVICE_URL", "http://lead-service:8000"),
    "content": os.getenv("CONTENT_SERVICE_URL", "http://content-service:8000"),
    "subscribers": os.getenv("SUBSCRIBER_SERVICE_URL", "http://subscriber-service:8000"),
    "plans": os.getenv("PLAN_SERVICE_URL", "http://plan-service:8000"),
    "subscriptions": os.getenv("SUBSCRIPTION_SERVICE_URL", "http://subscription-service:8000"),
    "billing": os.getenv("BILLING_SERVICE_URL", "http://billing-service:8000"),
    "payments": os.getenv("PAYMENT_SERVICE_URL", "http://payment-service:8000"),
    "tickets": os.getenv("TICKET_SERVICE_URL", "http://ticket-service:8000"),
    "assignments": os.getenv("ASSIGNMENT_SERVICE_URL", "http://assignment-service:8000"),
    "media": os.getenv("MEDIA_SERVICE_URL", "http://media-service:8000"),
    "notifications": os.getenv("NOTIFICATION_SERVICE_URL", "http://notification-service:8000"),
    "reports": os.getenv("REPORTING_SERVICE_URL", "http://reporting-service:8000"),
    "audit": os.getenv("AUDIT_SERVICE_URL", "http://audit-service:8000"),
    "coupons": os.getenv("COUPON_SERVICE_URL", "http://coupon-service:8000"),
}

ALLOWED_METHODS = ("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS")

logging.basicConfig(level=LOG_LEVEL, format="%(message)s")
logger = logging.getLogger(SERVICE_NAME)

app = FastAPI(
    title=SERVICE_NAME,
    version=SERVICE_VERSION,
    docs_url="/docs",
    redoc_url=None,
    openapi_url="/openapi.json",
)

origins = [o.strip() for o in CORS_ORIGINS.split(",") if o.strip()] or ["*"]

# NOTE: When allow_credentials=True, Access-Control-Allow-Origin cannot be '*'.
# For local/dev, we reflect the request Origin when CORS_ORIGINS contains '*'.
allow_origin_regex = None
allow_origins = origins
if "*" in origins:
    allow_origins = []
    # allow http(s)://localhost:<port> and http(s)://127.0.0.1:<port>
    allow_origin_regex = r"^https?://(localhost|127\.0\.0\.1)(:\d+)?$"


def _apply_cors_headers(response: Response, request: Request) -> Response:
    origin = request.headers.get("origin")
    if not origin:
        return response

    # Match the same logic as the configured CORSMiddleware.
    allowed = False
    if allow_origin_regex:
        try:
            allowed = re.match(allow_origin_regex, origin) is not None
        except Exception:
            allowed = False
    else:
        allowed = origin in allow_origins

    if not allowed:
        return response

    acrh = request.headers.get("access-control-request-headers")
    response.headers.setdefault("Vary", "Origin")
    response.headers["Access-Control-Allow-Origin"] = origin
    response.headers["Access-Control-Allow-Credentials"] = "true"
    response.headers.setdefault(
        "Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS"
    )
    response.headers.setdefault(
        "Access-Control-Allow-Headers",
        acrh or "Authorization, Content-Type, Idempotency-Key",
    )
    response.headers.setdefault("Access-Control-Max-Age", "600")
    return response


def _cors_json(request: Request, status_code: int, content: dict) -> Response:
    return _apply_cors_headers(JSONResponse(status_code=status_code, content=content), request)


def _publish_event(event: dict) -> None:
    r = _get_redis()
    if not r:
        return
    try:
        r.publish("ashva:events", json.dumps(event))
    except Exception:
        # Best-effort only
        return


@app.get("/api/v1/events/stream")
async def events_stream(request: Request) -> StreamingResponse:
    """Server-Sent Events stream backed by Redis PubSub (Phase B).

    Auth is enforced by the gateway middleware (bearer token required).
    """

    async def _iter_events() -> AsyncIterator[bytes]:
        # Minimal SSE framing. We use a keep-alive comment every ~15s.
        pubsub = None
        r = _get_redis()
        if not r:
            # If Redis isn't configured, keep connection alive but send no events.
            while True:
                if await request.is_disconnected():
                    return
                yield b": keep-alive\n\n"
                await asyncio.sleep(15)

        try:
            pubsub = r.pubsub(ignore_subscribe_messages=True)
            pubsub.subscribe("ashva:events")

            # Initial hello
            yield b"event: ready\ndata: {}\n\n"

            last_ping = time.time()
            while True:
                if await request.is_disconnected():
                    return

                message = None
                try:
                    message = await asyncio.to_thread(pubsub.get_message, timeout=1.0)
                except Exception:
                    message = None

                if message and message.get("type") == "message":
                    data = message.get("data")
                    if isinstance(data, str):
                        payload = data
                    else:
                        payload = json.dumps(data)
                    yield f"data: {payload}\n\n".encode("utf-8")

                # keep-alive ping
                if time.time() - last_ping > 15:
                    yield b": keep-alive\n\n"
                    last_ping = time.time()
        finally:
            try:
                if pubsub is not None:
                    pubsub.close()
            except Exception:
                pass

    headers = {
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
        "X-Accel-Buffering": "no",
    }
    # CORS: EventSource/fetch streaming needs Origin allowed; middleware already sets.
    return StreamingResponse(_iter_events(), media_type="text/event-stream", headers=headers)

app.add_middleware(
    CORSMiddleware,
    allow_origins=allow_origins,
    allow_origin_regex=allow_origin_regex,
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

_consolidated_openapi_cache: Dict[str, object] | None = None
_redis: Redis | None = None
_token_cache: dict[str, dict[str, object]] = {}

INTERNAL_API_KEY = os.getenv("INTERNAL_API_KEY", "")

def _is_public_path(path: str) -> bool:
    if path in {"/health", "/ready", "/live", "/metrics", "/openapi.json", "/openapi.yaml", "/docs"}:
        return True
    if path.startswith("/docs"):
        return True
    # Auth endpoints are public; other services are protected in Phase 2.
    if path.startswith("/api/v1/auth/"):
        return True
    return False


def _is_public_request(request: Request) -> bool:
    # Public lead capture (Phase 3)
    path_norm = request.url.path.rstrip("/") or "/"
    if request.method.upper() == "POST" and path_norm == "/api/v1/leads":
        return True

    # Public content read APIs (Phase 3)
    if request.method.upper() == "GET" and request.url.path.startswith("/api/v1/content/case-studies"):
        return True

    # Public plans catalog (Phase 4)
    if request.method.upper() == "GET" and (
        request.url.path.rstrip("/") == "/api/v1/plans" or request.url.path.startswith("/api/v1/plans/")
    ):
        return True

    # Payment webhooks (Phase 5 prep)
    if request.url.path.startswith("/api/v1/payments/webhooks/"):
        return True

    return _is_public_path(request.url.path)


def _get_redis() -> Redis | None:
    global _redis
    if _redis is not None:
        return _redis
    if not REDIS_URL:
        return None
    _redis = Redis.from_url(REDIS_URL, decode_responses=True)
    return _redis


def _rate_limit_key(window_seconds: int) -> str:
    # Fixed window bucket
    return str(int(time.time()) // window_seconds)


def _rate_limit(*, key: str, limit: int, window_seconds: int) -> bool:
    r = _get_redis()
    if not r:
        # If Redis isn't configured, do not block (local dev).
        return True
    bucket = _rate_limit_key(window_seconds)
    full_key = f"rl:{key}:{bucket}"
    current = r.incr(full_key)
    if current == 1:
        r.expire(full_key, window_seconds)
    return current <= limit


async def _validate_token_via_auth(token: str, correlation_id: str) -> dict[str, object] | None:
    cached = _token_cache.get(token)
    if cached:
        exp_ts = cached.get("_exp_ts")
        if isinstance(exp_ts, (int, float)) and exp_ts > time.time():
            return cached

    if not AUTH_SERVICE_URL:
        return None

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.post(
                f"{AUTH_SERVICE_URL}/api/v1/auth/validate",
                json={"token": token},
                headers={"x-correlation-id": correlation_id},
            )
    except Exception:
        return None

    if resp.status_code != 200:
        return None

    data = resp.json()

    exp_ts: float = time.time() + 60
    try:
        expires_at = data.get("expires_at")
        if isinstance(expires_at, str):
            expires_at_norm = expires_at.replace("Z", "+00:00")
            exp_dt = datetime.fromisoformat(expires_at_norm)
            exp_ts = exp_dt.timestamp()
    except Exception:
        pass

    data["_exp_ts"] = exp_ts
    _token_cache[token] = data
    return data


async def _lookup_user_role_internal(*, user_id: str, correlation_id: str) -> str | None:
    if not AUTH_SERVICE_URL or not INTERNAL_API_KEY:
        return None
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.get(
                f"{AUTH_SERVICE_URL}/api/v1/auth/internal/users/{user_id}",
                headers={"x-correlation-id": correlation_id, "X-Internal-API-Key": INTERNAL_API_KEY},
            )
    except Exception:
        return None
    if resp.status_code != 200:
        return None
    try:
        data = resp.json()
        return str(data.get("role") or "")
    except Exception:
        return None


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
        # Always allow preflight requests without auth so browsers can proceed.
        if request.method.upper() == "OPTIONS":
            response = Response(status_code=204)
            response.headers["X-Correlation-ID"] = correlation_id
            return _apply_cors_headers(response, request)

        # Rate limiting for auth endpoints (Phase 2 hardening)
        if request.url.path.startswith("/api/v1/auth/") and request.method.upper() == "POST":
            body = await request.body()
            try:
                payload = json.loads(body.decode("utf-8") or "{}")
            except Exception:
                payload = {}

            ip = request.client.host if request.client else "unknown"
            if request.url.path.endswith("/register"):
                identifier = payload.get("email") or payload.get("phone") or ip
                if not _rate_limit(key=f"auth_register:{identifier}", limit=5, window_seconds=3600):
                    return _apply_cors_headers(
                        JSONResponse(status_code=429, content={"detail": "Too many requests"}),
                        request,
                    )
            elif request.url.path.endswith("/otp/request"):
                identifier = payload.get("identifier") or ip
                if not _rate_limit(key=f"auth_otp_request:{identifier}", limit=3, window_seconds=900):
                    return _apply_cors_headers(
                        JSONResponse(status_code=429, content={"detail": "Too many requests"}),
                        request,
                    )
            elif request.url.path.endswith("/login"):
                identifier = payload.get("email") or ip
                if not _rate_limit(key=f"auth_login:{identifier}", limit=5, window_seconds=900):
                    return _apply_cors_headers(
                        JSONResponse(status_code=429, content={"detail": "Too many requests"}),
                        request,
                    )

        # AuthN/Z for protected endpoints
        if request.url.path.startswith("/api/v1/") and not _is_public_request(request):
            auth = request.headers.get("authorization", "")
            if not auth.lower().startswith("bearer "):
                return _apply_cors_headers(
                    JSONResponse(status_code=401, content={"detail": "Missing bearer token"}),
                    request,
                )
            token = auth.split(" ", 1)[1].strip()

            claims = await _validate_token_via_auth(token, correlation_id)
            if not claims:
                return _apply_cors_headers(
                    JSONResponse(status_code=401, content={"detail": "Invalid token"}),
                    request,
                )

            request.state.user_id = claims.get("user_id")
            request.state.user_role = claims.get("role")
            request.state.user_email = claims.get("email")
            request.state.can_assign_leads = bool(claims.get("can_assign_leads", False))
            request.state.can_manage_unassigned_leads = bool(
                claims.get("can_manage_unassigned_leads", False)
            )

            role = str(request.state.user_role or "")
            if request.url.path.startswith("/api/v1/subscribers/") and role not in {"subscriber", "admin"}:
                return _apply_cors_headers(
                    JSONResponse(status_code=403, content={"detail": "Forbidden"}),
                    request,
                )

            # Lead management (Phase 3): admin + cms_user + technician (read all; write restrictions enforced in lead-service)
            if request.url.path.startswith("/api/v1/leads") and not (
                request.method.upper() == "POST" and request.url.path.rstrip("/") == "/api/v1/leads"
            ):
                if role not in {"admin", "cms_user", "technician"}:
                    return _apply_cors_headers(
                        JSONResponse(status_code=403, content={"detail": "Forbidden"}),
                        request,
                    )

                # Assignment validation: admin must never be assigned leads
                if request.method.upper() == "PATCH" and request.url.path.endswith("/assign"):
                    body = await request.body()
                    try:
                        payload = json.loads(body.decode("utf-8") or "{}")
                    except Exception:
                        payload = {}
                    assigned_to = payload.get("assigned_to")
                    if assigned_to:
                        assignee_role = await _lookup_user_role_internal(
                            user_id=str(assigned_to), correlation_id=correlation_id
                        )
                        if assignee_role == "admin":
                            return _cors_json(
                                request,
                                400,
                                {"detail": "Admin cannot be assigned to leads"},
                            )

            # Content management (Phase 3): only admin + cms_user
            if request.url.path.startswith("/api/v1/content/") and role not in {"admin", "cms_user"}:
                return _cors_json(request, 403, {"detail": "Forbidden"})

            # Coupon/discount/referral management
            if request.url.path.startswith("/api/v1/coupons/"):
                # Never expose internal coupon endpoints through the gateway
                if request.url.path.startswith("/api/v1/coupons/internal/"):
                    return _cors_json(request, 403, {"detail": "Forbidden"})

                # Admin-only endpoints
                if request.url.path in {"/api/v1/coupons", "/api/v1/coupons/"}:
                    if role != "admin":
                        return _cors_json(request, 403, {"detail": "Forbidden"})
                if request.url.path.startswith("/api/v1/coupons/referrals/program"):
                    if role != "admin":
                        return _cors_json(request, 403, {"detail": "Forbidden"})

                # Subscriber referral code generation
                if request.url.path.startswith("/api/v1/coupons/referrals/generate"):
                    if role != "subscriber":
                        return _cors_json(request, 403, {"detail": "Forbidden"})

            # Subscription management
            if request.url.path.startswith("/api/v1/subscriptions/"):
                # Never expose internal subscription endpoints through the gateway
                if request.url.path.startswith("/api/v1/subscriptions/internal/"):
                    return _cors_json(request, 403, {"detail": "Forbidden"})
                # Plan change apply: admin only
                if request.url.path.endswith("/plan-change/apply"):
                    if role != "admin":
                        return _cors_json(request, 403, {"detail": "Forbidden"})
                # Plan change request, cancellation: subscriber (own) or admin
                elif request.url.path.endswith("/plan-change") or request.url.path.endswith("/cancel"):
                    if role not in {"subscriber", "admin"}:
                        return _cors_json(request, 403, {"detail": "Forbidden"})
                # Events history: subscriber (own) or admin
                elif request.url.path.endswith("/events"):
                    if role not in {"subscriber", "admin"}:
                        return _cors_json(request, 403, {"detail": "Forbidden"})
                # Other subscription endpoints: subscriber or admin
                elif role not in {"subscriber", "admin"}:
                    return _cors_json(request, 403, {"detail": "Forbidden"})

            # Payment management
            if request.url.path.startswith("/api/v1/payments/"):
                # Never expose internal payment endpoints through the gateway
                if request.url.path.startswith("/api/v1/payments/internal/"):
                    return _cors_json(request, 403, {"detail": "Forbidden"})
                # Admin-only
                if request.url.path.startswith("/api/v1/payments/admin/") and role != "admin":
                    return _cors_json(request, 403, {"detail": "Forbidden"})
                # Subscriber-only
                if request.url.path.startswith("/api/v1/payments/me/") and role != "subscriber":
                    return _cors_json(request, 403, {"detail": "Forbidden"})
                # Payment intent gateway create/retry (Wave 3): subscriber/admin only
                if request.url.path.startswith("/api/v1/payments/intents/") and role not in {"subscriber", "admin"}:
                    return _cors_json(request, 403, {"detail": "Forbidden"})

            # Billing management
            if request.url.path.startswith("/api/v1/billing/"):
                # Never expose internal billing endpoints through the gateway
                if request.url.path.startswith("/api/v1/billing/internal/"):
                    return _cors_json(request, 403, {"detail": "Forbidden"})
                # Admin-only
                if request.url.path.startswith("/api/v1/billing/admin/") and role != "admin":
                    return _cors_json(request, 403, {"detail": "Forbidden"})
                # Subscriber-only
                if request.url.path.startswith("/api/v1/billing/me/") and role != "subscriber":
                    return _cors_json(request, 403, {"detail": "Forbidden"})
                # Subscriber credits endpoint (Wave 3)
                if request.url.path.startswith("/api/v1/billing/credits/me") and role != "subscriber":
                    return _cors_json(request, 403, {"detail": "Forbidden"})

            # Plan management (public read is allowed in _is_public_request)
            if request.url.path.startswith("/api/v1/plans") and request.method.upper() != "GET":
                if role != "admin":
                    return _cors_json(request, 403, {"detail": "Forbidden"})

            # Ticket management (Phase 6)
            if request.url.path.startswith("/api/v1/tickets"):
                # Never expose internal ticket endpoints through the gateway
                if request.url.path.startswith("/api/v1/tickets/internal/"):
                    return _cors_json(request, 403, {"detail": "Forbidden"})
                # Public: POST /api/v1/tickets (subscriber creates ticket)
                if request.method.upper() == "POST" and request.url.path.rstrip("/") == "/api/v1/tickets":
                    if role not in {"subscriber", "admin"}:
                        return _cors_json(request, 403, {"detail": "Forbidden"})
                # Admin-only: /api/v1/tickets/admin
                elif request.url.path.startswith("/api/v1/tickets/admin"):
                    if role != "admin":
                        return _cors_json(request, 403, {"detail": "Forbidden"})
                # Subscriber, technician, admin: GET /api/v1/tickets/{id}, PATCH /api/v1/tickets/{id}
                # Subscriber: GET /api/v1/tickets/me
                elif request.url.path.startswith("/api/v1/tickets/me"):
                    if role != "subscriber":
                        return _cors_json(request, 403, {"detail": "Forbidden"})
                # Other ticket endpoints: subscriber, technician, admin (enforced in ticket-service)
                elif role not in {"subscriber", "technician", "admin"}:
                    return _cors_json(request, 403, {"detail": "Forbidden"})

            # Assignment management (Phase 6)
            if request.url.path.startswith("/api/v1/assignments"):
                # Never expose internal assignment endpoints through the gateway
                if request.url.path.startswith("/api/v1/assignments/internal/"):
                    return _cors_json(request, 403, {"detail": "Forbidden"})
                # Admin-only: POST /api/v1/assignments, GET /api/v1/assignments/admin
                if request.url.path.startswith("/api/v1/assignments/admin") or (
                    request.method.upper() == "POST" and request.url.path.rstrip("/") == "/api/v1/assignments"
                ):
                    if role != "admin":
                        return _cors_json(request, 403, {"detail": "Forbidden"})
                # Technician-only: GET /api/v1/assignments/me, POST /api/v1/assignments/{id}/accept, POST /api/v1/assignments/{id}/reject
                elif request.url.path.startswith("/api/v1/assignments/me") or request.url.path.endswith(
                    ("/accept", "/reject")
                ):
                    if role != "technician":
                        return _cors_json(request, 403, {"detail": "Forbidden"})
                # Admin: unassign
                elif request.url.path.endswith("/unassign"):
                    if role != "admin":
                        return _cors_json(request, 403, {"detail": "Forbidden"})

            # Media management (Phase 6: ticket photos)
            if request.url.path.startswith("/api/v1/media"):
                # Never expose internal media endpoints through the gateway
                if request.url.path.startswith("/api/v1/media/internal/"):
                    return _cors_json(request, 403, {"detail": "Forbidden"})
                # Ticket photos: subscriber (own tickets), technician (assigned tickets), admin (any)
                # Other media: admin only (for now)
                # Authorization is enforced in media-service based on owner_type

        response = await call_next(request)
        response.headers["X-Correlation-ID"] = correlation_id
        return _apply_cors_headers(response, request)
    except Exception:
        response = JSONResponse(status_code=500, content={"detail": "Internal Server Error"})
        response.headers["X-Correlation-ID"] = correlation_id
        return _apply_cors_headers(response, request)
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


def _filter_headers(headers: Iterable[tuple[str, str]]) -> Dict[str, str]:
    # Strip hop-by-hop headers and upstream CORS headers. The gateway should be
    # the single source of truth for CORS.
    excluded = {
        "connection",
        "content-length",
        "transfer-encoding",
        "access-control-allow-origin",
        "access-control-allow-methods",
        "access-control-allow-headers",
        "access-control-allow-credentials",
        "access-control-expose-headers",
        "access-control-max-age",
    }
    filtered: Dict[str, str] = {}
    for k, v in headers:
        key = k.strip().lower()
        if key in excluded or key.startswith("access-control-"):
            continue
        filtered[k] = v
    return filtered


@app.api_route("/api/v1/{service}", methods=list(ALLOWED_METHODS))
async def proxy_root(service: str, request: Request) -> Response:
    """
    Handle service root paths like /api/v1/leads without triggering
    framework redirects that can drop the port in Location headers behind Nginx.
    """
    base_url = SERVICE_URLS.get(service, "")
    if not base_url:
        return JSONResponse(
            status_code=404,
            content={"error": "Unknown service", "service": service},
        )

    url = f"{base_url}/api/v1/{service}"
    headers = dict(request.headers)
    headers.pop("host", None)
    headers["x-correlation-id"] = request.state.correlation_id
    if getattr(request.state, "user_id", None):
        headers["x-user-id"] = str(request.state.user_id)
    if getattr(request.state, "user_role", None):
        headers["x-user-role"] = str(request.state.user_role)
    if getattr(request.state, "user_email", None):
        headers["x-user-email"] = str(request.state.user_email)
    if getattr(request.state, "can_assign_leads", None) is not None:
        headers["x-can-assign-leads"] = "true" if request.state.can_assign_leads else "false"
    if getattr(request.state, "can_manage_unassigned_leads", None) is not None:
        headers["x-can-manage-unassigned-leads"] = (
            "true" if request.state.can_manage_unassigned_leads else "false"
        )
    body = await request.body()

    async with httpx.AsyncClient(timeout=30.0) as client:
        upstream = await client.request(
            method=request.method,
            url=url,
            params=request.query_params,
            content=body,
            headers=headers,
        )

    if (
        upstream.status_code in {200, 201, 204}
        and service in {"tickets", "assignments"}
        and request.method.upper() in {"POST", "PATCH", "PUT", "DELETE"}
    ):
        event: dict = {
            "type": f"{service}.changed",
            "service": service,
            "method": request.method.upper(),
            "path": request.url.path,
            "status_code": upstream.status_code,
            "correlation_id": getattr(request.state, "correlation_id", ""),
            "user_id": str(getattr(request.state, "user_id", "") or ""),
            "user_role": str(getattr(request.state, "user_role", "") or ""),
            "ts": datetime.now(timezone.utc).isoformat(),
        }
        try:
            if (upstream.headers.get("content-type") or "").startswith("application/json"):
                event["data"] = upstream.json()
        except Exception:
            pass
        _publish_event(event)

    return Response(
        content=upstream.content,
        status_code=upstream.status_code,
        headers=_filter_headers(upstream.headers.items()),
        media_type=upstream.headers.get("content-type"),
    )


@app.api_route("/api/v1/{service}/{path:path}", methods=list(ALLOWED_METHODS))
async def proxy(service: str, path: str, request: Request) -> Response:
    base_url = SERVICE_URLS.get(service, "")
    if not base_url:
        return JSONResponse(
            status_code=404,
            content={"error": "Unknown service", "service": service},
        )

    url = f"{base_url}/api/v1/{service}/{path}"
    headers = dict(request.headers)
    headers.pop("host", None)
    headers["x-correlation-id"] = request.state.correlation_id
    if getattr(request.state, "user_id", None):
        headers["x-user-id"] = str(request.state.user_id)
    if getattr(request.state, "user_role", None):
        headers["x-user-role"] = str(request.state.user_role)
    if getattr(request.state, "user_email", None):
        headers["x-user-email"] = str(request.state.user_email)
    if getattr(request.state, "can_assign_leads", None) is not None:
        headers["x-can-assign-leads"] = "true" if request.state.can_assign_leads else "false"
    if getattr(request.state, "can_manage_unassigned_leads", None) is not None:
        headers["x-can-manage-unassigned-leads"] = (
            "true" if request.state.can_manage_unassigned_leads else "false"
        )
    body = await request.body()

    async with httpx.AsyncClient(timeout=30.0) as client:
        upstream = await client.request(
            method=request.method,
            url=url,
            params=request.query_params,
            content=body,
            headers=headers,
        )

    if (
        upstream.status_code in {200, 201, 204}
        and service in {"tickets", "assignments"}
        and request.method.upper() in {"POST", "PATCH", "PUT", "DELETE"}
    ):
        event: dict = {
            "type": f"{service}.changed",
            "service": service,
            "method": request.method.upper(),
            "path": request.url.path,
            "status_code": upstream.status_code,
            "correlation_id": getattr(request.state, "correlation_id", ""),
            "user_id": str(getattr(request.state, "user_id", "") or ""),
            "user_role": str(getattr(request.state, "user_role", "") or ""),
            "ts": datetime.now(timezone.utc).isoformat(),
        }
        try:
            if (upstream.headers.get("content-type") or "").startswith("application/json"):
                event["data"] = upstream.json()
        except Exception:
            pass
        _publish_event(event)

    return Response(
        content=upstream.content,
        status_code=upstream.status_code,
        headers=_filter_headers(upstream.headers.items()),
        media_type=upstream.headers.get("content-type"),
    )


@app.get("/health")
async def health() -> Dict[str, str]:
    return {
        "status": "healthy",
        "service": SERVICE_NAME,
        "version": SERVICE_VERSION,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


@app.get("/ready")
async def ready() -> Dict[str, str]:
    return {
        "status": "ready",
        "service": SERVICE_NAME,
        "version": SERVICE_VERSION,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


@app.get("/live")
async def live() -> Dict[str, str]:
    return {
        "status": "live",
        "service": SERVICE_NAME,
        "version": SERVICE_VERSION,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


@app.get("/metrics")
async def metrics() -> Response:
    return Response(generate_latest(), media_type=CONTENT_TYPE_LATEST)


@app.get("/openapi.yaml")
async def consolidated_openapi_yaml() -> Response:
    try:
        with open(CONSOLIDATED_OPENAPI_PATH, "rb") as f:
            content = f.read()
        return Response(content=content, media_type="application/yaml")
    except FileNotFoundError:
        content = yaml.safe_dump(app.openapi())
        return Response(content=content, media_type="application/yaml")


def custom_openapi():
    global _consolidated_openapi_cache
    if _consolidated_openapi_cache is not None:
        return _consolidated_openapi_cache
    try:
        with open(CONSOLIDATED_OPENAPI_PATH, "r", encoding="utf-8") as f:
            data = yaml.safe_load(f)
        _consolidated_openapi_cache = data
        return data
    except FileNotFoundError:
        return get_openapi(
            title=app.title,
            version=app.version,
            routes=app.routes,
        )


app.openapi = custom_openapi


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        app,
        host="0.0.0.0",
        port=int(os.getenv("SERVICE_PORT", "8000")),
        log_level=LOG_LEVEL.lower(),
    )
