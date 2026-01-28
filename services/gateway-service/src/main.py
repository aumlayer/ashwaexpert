import json
import logging
import os
import time
from datetime import datetime, timezone
from typing import Dict, Iterable
from uuid import uuid4

import httpx
import yaml
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, Response
from prometheus_client import CONTENT_TYPE_LATEST, Counter, Histogram, generate_latest
from redis import Redis

SERVICE_NAME = os.getenv("SERVICE_NAME", "gateway-service")
SERVICE_VERSION = os.getenv("SERVICE_VERSION", "0.1.0")
ENVIRONMENT = os.getenv("ENVIRONMENT", "local")
LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO")
CORS_ORIGINS = os.getenv("CORS_ORIGINS", "*")
AUTH_SERVICE_URL = os.getenv("AUTH_SERVICE_URL", "")
REDIS_URL = os.getenv("REDIS_URL", "")
CONSOLIDATED_OPENAPI_PATH = os.getenv("CONSOLIDATED_OPENAPI_PATH", "/app/openapi.yaml")

SERVICE_URLS: Dict[str, str] = {
    "auth": os.getenv("AUTH_SERVICE_URL", ""),
    "leads": os.getenv("LEAD_SERVICE_URL", ""),
    "content": os.getenv("CONTENT_SERVICE_URL", ""),
    "subscribers": os.getenv("SUBSCRIBER_SERVICE_URL", ""),
    "plans": os.getenv("PLAN_SERVICE_URL", ""),
    "subscriptions": os.getenv("SUBSCRIPTION_SERVICE_URL", ""),
    "billing": os.getenv("BILLING_SERVICE_URL", ""),
    "payments": os.getenv("PAYMENT_SERVICE_URL", ""),
    "tickets": os.getenv("TICKET_SERVICE_URL", ""),
    "assignments": os.getenv("ASSIGNMENT_SERVICE_URL", ""),
    "media": os.getenv("MEDIA_SERVICE_URL", ""),
    "notifications": os.getenv("NOTIFICATION_SERVICE_URL", ""),
    "reports": os.getenv("REPORTING_SERVICE_URL", ""),
    "audit": os.getenv("AUDIT_SERVICE_URL", ""),
    "coupons": os.getenv("COUPON_SERVICE_URL", ""),
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

_consolidated_openapi_cache: Dict[str, object] | None = None
_redis: Redis | None = None
_token_cache: dict[str, dict[str, object]] = {}

INTERNAL_API_KEY = os.getenv("INTERNAL_API_KEY", "")

def _is_public_path(path: str) -> bool:
    if path in {"/health", "/metrics", "/openapi.json", "/openapi.yaml", "/docs"}:
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
                    return JSONResponse(status_code=429, content={"detail": "Too many requests"})
            elif request.url.path.endswith("/otp/request"):
                identifier = payload.get("identifier") or ip
                if not _rate_limit(key=f"auth_otp_request:{identifier}", limit=3, window_seconds=900):
                    return JSONResponse(status_code=429, content={"detail": "Too many requests"})
            elif request.url.path.endswith("/login"):
                identifier = payload.get("email") or ip
                if not _rate_limit(key=f"auth_login:{identifier}", limit=5, window_seconds=900):
                    return JSONResponse(status_code=429, content={"detail": "Too many requests"})

        # AuthN/Z for protected endpoints
        if request.url.path.startswith("/api/v1/") and not _is_public_request(request):
            auth = request.headers.get("authorization", "")
            if not auth.lower().startswith("bearer "):
                return JSONResponse(status_code=401, content={"detail": "Missing bearer token"})
            token = auth.split(" ", 1)[1].strip()

            claims = await _validate_token_via_auth(token, correlation_id)
            if not claims:
                return JSONResponse(status_code=401, content={"detail": "Invalid token"})

            request.state.user_id = claims.get("user_id")
            request.state.user_role = claims.get("role")
            request.state.user_email = claims.get("email")
            request.state.can_assign_leads = bool(claims.get("can_assign_leads", False))
            request.state.can_manage_unassigned_leads = bool(
                claims.get("can_manage_unassigned_leads", False)
            )

            role = str(request.state.user_role or "")
            if request.url.path.startswith("/api/v1/subscribers/") and role not in {"subscriber", "admin"}:
                return JSONResponse(status_code=403, content={"detail": "Forbidden"})

            # Lead management (Phase 3): admin + cms_user + technician (read all; write restrictions enforced in lead-service)
            if request.url.path.startswith("/api/v1/leads") and not (
                request.method.upper() == "POST" and request.url.path.rstrip("/") == "/api/v1/leads"
            ):
                if role not in {"admin", "cms_user", "technician"}:
                    return JSONResponse(status_code=403, content={"detail": "Forbidden"})

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
                            return JSONResponse(
                                status_code=400,
                                content={"detail": "Admin cannot be assigned to leads"},
                            )

            # Content management (Phase 3): only admin + cms_user
            if request.url.path.startswith("/api/v1/content/") and role not in {"admin", "cms_user"}:
                return JSONResponse(status_code=403, content={"detail": "Forbidden"})

            # Coupon/discount/referral management
            if request.url.path.startswith("/api/v1/coupons/"):
                # Never expose internal coupon endpoints through the gateway
                if request.url.path.startswith("/api/v1/coupons/internal/"):
                    return JSONResponse(status_code=403, content={"detail": "Forbidden"})

                # Admin-only endpoints
                if request.url.path in {"/api/v1/coupons", "/api/v1/coupons/"}:
                    if role != "admin":
                        return JSONResponse(status_code=403, content={"detail": "Forbidden"})
                if request.url.path.startswith("/api/v1/coupons/referrals/program"):
                    if role != "admin":
                        return JSONResponse(status_code=403, content={"detail": "Forbidden"})

                # Subscriber referral code generation
                if request.url.path.startswith("/api/v1/coupons/referrals/generate"):
                    if role != "subscriber":
                        return JSONResponse(status_code=403, content={"detail": "Forbidden"})

            # Subscription management
            if request.url.path.startswith("/api/v1/subscriptions/"):
                # Never expose internal subscription endpoints through the gateway
                if request.url.path.startswith("/api/v1/subscriptions/internal/"):
                    return JSONResponse(status_code=403, content={"detail": "Forbidden"})
                # Plan change apply: admin only
                if request.url.path.endswith("/plan-change/apply"):
                    if role != "admin":
                        return JSONResponse(status_code=403, content={"detail": "Forbidden"})
                # Plan change request, cancellation: subscriber (own) or admin
                elif request.url.path.endswith("/plan-change") or request.url.path.endswith("/cancel"):
                    if role not in {"subscriber", "admin"}:
                        return JSONResponse(status_code=403, content={"detail": "Forbidden"})
                # Events history: subscriber (own) or admin
                elif request.url.path.endswith("/events"):
                    if role not in {"subscriber", "admin"}:
                        return JSONResponse(status_code=403, content={"detail": "Forbidden"})
                # Other subscription endpoints: subscriber or admin
                elif role not in {"subscriber", "admin"}:
                    return JSONResponse(status_code=403, content={"detail": "Forbidden"})

            # Payment management
            if request.url.path.startswith("/api/v1/payments/"):
                # Never expose internal payment endpoints through the gateway
                if request.url.path.startswith("/api/v1/payments/internal/"):
                    return JSONResponse(status_code=403, content={"detail": "Forbidden"})
                # Admin-only
                if request.url.path.startswith("/api/v1/payments/admin/") and role != "admin":
                    return JSONResponse(status_code=403, content={"detail": "Forbidden"})
                # Subscriber-only
                if request.url.path.startswith("/api/v1/payments/me/") and role != "subscriber":
                    return JSONResponse(status_code=403, content={"detail": "Forbidden"})
                # Payment intent gateway create/retry (Wave 3): subscriber/admin only
                if request.url.path.startswith("/api/v1/payments/intents/") and role not in {"subscriber", "admin"}:
                    return JSONResponse(status_code=403, content={"detail": "Forbidden"})

            # Billing management
            if request.url.path.startswith("/api/v1/billing/"):
                # Never expose internal billing endpoints through the gateway
                if request.url.path.startswith("/api/v1/billing/internal/"):
                    return JSONResponse(status_code=403, content={"detail": "Forbidden"})
                # Admin-only
                if request.url.path.startswith("/api/v1/billing/admin/") and role != "admin":
                    return JSONResponse(status_code=403, content={"detail": "Forbidden"})
                # Subscriber-only
                if request.url.path.startswith("/api/v1/billing/me/") and role != "subscriber":
                    return JSONResponse(status_code=403, content={"detail": "Forbidden"})
                # Subscriber credits endpoint (Wave 3)
                if request.url.path.startswith("/api/v1/billing/credits/me") and role != "subscriber":
                    return JSONResponse(status_code=403, content={"detail": "Forbidden"})

            # Plan management (public read is allowed in _is_public_request)
            if request.url.path.startswith("/api/v1/plans") and request.method.upper() != "GET":
                if role != "admin":
                    return JSONResponse(status_code=403, content={"detail": "Forbidden"})

            # Ticket management (Phase 6)
            if request.url.path.startswith("/api/v1/tickets"):
                # Never expose internal ticket endpoints through the gateway
                if request.url.path.startswith("/api/v1/tickets/internal/"):
                    return JSONResponse(status_code=403, content={"detail": "Forbidden"})
                # Public: POST /api/v1/tickets (subscriber creates ticket)
                if request.method.upper() == "POST" and request.url.path.rstrip("/") == "/api/v1/tickets":
                    if role not in {"subscriber", "admin"}:
                        return JSONResponse(status_code=403, content={"detail": "Forbidden"})
                # Admin-only: /api/v1/tickets/admin
                elif request.url.path.startswith("/api/v1/tickets/admin"):
                    if role != "admin":
                        return JSONResponse(status_code=403, content={"detail": "Forbidden"})
                # Subscriber, technician, admin: GET /api/v1/tickets/{id}, PATCH /api/v1/tickets/{id}
                # Subscriber: GET /api/v1/tickets/me
                elif request.url.path.startswith("/api/v1/tickets/me"):
                    if role != "subscriber":
                        return JSONResponse(status_code=403, content={"detail": "Forbidden"})
                # Other ticket endpoints: subscriber, technician, admin (enforced in ticket-service)
                elif role not in {"subscriber", "technician", "admin"}:
                    return JSONResponse(status_code=403, content={"detail": "Forbidden"})

            # Assignment management (Phase 6)
            if request.url.path.startswith("/api/v1/assignments"):
                # Never expose internal assignment endpoints through the gateway
                if request.url.path.startswith("/api/v1/assignments/internal/"):
                    return JSONResponse(status_code=403, content={"detail": "Forbidden"})
                # Admin-only: POST /api/v1/assignments, GET /api/v1/assignments/admin
                if request.url.path.startswith("/api/v1/assignments/admin") or (
                    request.method.upper() == "POST" and request.url.path.rstrip("/") == "/api/v1/assignments"
                ):
                    if role != "admin":
                        return JSONResponse(status_code=403, content={"detail": "Forbidden"})
                # Technician-only: GET /api/v1/assignments/me, POST /api/v1/assignments/{id}/accept, POST /api/v1/assignments/{id}/reject
                elif request.url.path.startswith("/api/v1/assignments/me") or request.url.path.endswith(
                    ("/accept", "/reject")
                ):
                    if role != "technician":
                        return JSONResponse(status_code=403, content={"detail": "Forbidden"})
                # Admin: unassign
                elif request.url.path.endswith("/unassign"):
                    if role != "admin":
                        return JSONResponse(status_code=403, content={"detail": "Forbidden"})

            # Media management (Phase 6: ticket photos)
            if request.url.path.startswith("/api/v1/media"):
                # Never expose internal media endpoints through the gateway
                if request.url.path.startswith("/api/v1/media/internal/"):
                    return JSONResponse(status_code=403, content={"detail": "Forbidden"})
                # Ticket photos: subscriber (own tickets), technician (assigned tickets), admin (any)
                # Other media: admin only (for now)
                # Authorization is enforced in media-service based on owner_type

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


def _filter_headers(headers: Iterable[tuple[str, str]]) -> Dict[str, str]:
    excluded = {"connection", "content-length", "transfer-encoding"}
    return {k: v for k, v in headers if k.lower() not in excluded}


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
        return JSONResponse(status_code=404, content={"detail": "Consolidated OpenAPI not found"})


def custom_openapi():
    global _consolidated_openapi_cache
    if _consolidated_openapi_cache is not None:
        return _consolidated_openapi_cache
    with open(CONSOLIDATED_OPENAPI_PATH, "r", encoding="utf-8") as f:
        data = yaml.safe_load(f)
    _consolidated_openapi_cache = data
    return data


app.openapi = custom_openapi


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        app,
        host="0.0.0.0",
        port=int(os.getenv("SERVICE_PORT", "8000")),
        log_level=LOG_LEVEL.lower(),
    )
