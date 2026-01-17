# Gateway Service

## Service Overview

**Version**: 1.0.0  
**Technology Stack**: Python FastAPI  
**Purpose**: API Gateway that routes traffic to microservices, enforces authentication, and provides rate limiting.

The Gateway Service acts as the single entry point for all client applications (web and mobile). It handles request routing, authentication validation, rate limiting, and request/response transformation.

## Responsibilities and Boundaries

### What This Service Owns
- Request routing to backend microservices
- JWT token validation and introspection
- Rate limiting per client/IP
- Request correlation ID generation
- Request/response logging
- CORS policy enforcement
- Request size limits
- Upload routing to media-service

### What This Service Does NOT Own
- Business logic (delegated to downstream services)
- User authentication (auth-service handles this)
- Data persistence (no database)
- Payment processing
- Notification sending

## Owned Data and Schema

This service does not own any persistent data. It maintains:
- In-memory rate limit counters (backed by Redis)
- Request correlation IDs (passed through headers)
- Route configuration (loaded from environment/config)

## Public APIs

The Gateway Service does not expose business endpoints. It proxies requests to downstream services.

### Routing Configuration

All requests are routed based on path prefixes:

- `/api/v1/auth/*` → `auth-service`
- `/api/v1/leads/*` → `lead-service`
- `/api/v1/content/*` → `content-service`
- `/api/v1/subscribers/*` → `subscriber-service`
- `/api/v1/plans/*` → `plan-service`
- `/api/v1/subscriptions/*` → `subscription-service`
- `/api/v1/billing/*` → `billing-service`
- `/api/v1/payments/*` → `payment-service`
- `/api/v1/tickets/*` → `ticket-service`
- `/api/v1/assignments/*` → `assignment-service`
- `/api/v1/media/*` → `media-service`
- `/api/v1/notifications/*` → `notification-service`
- `/api/v1/reports/*` → `reporting-service`
- `/api/v1/audit/*` → `audit-service`

### Health Check Endpoint

**GET** `/health`

Returns gateway service health status.

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00Z",
  "version": "1.0.0"
}
```

### Metrics Endpoint

**GET** `/metrics`

Returns Prometheus metrics (if enabled).

## Events Published

None. Gateway is a stateless proxy.

## Events Consumed

None. Gateway does not consume events.

## Environment Variables

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `GATEWAY_PORT` | Port to listen on | Yes | `8000` |
| `GATEWAY_HOST` | Host to bind to | No | `0.0.0.0` |
| `AUTH_SERVICE_URL` | Auth service URL for token validation | Yes | - |
| `LEAD_SERVICE_URL` | Lead service URL | Yes | - |
| `CONTENT_SERVICE_URL` | Content service URL | Yes | - |
| `SUBSCRIBER_SERVICE_URL` | Subscriber service URL | Yes | - |
| `PLAN_SERVICE_URL` | Plan service URL | Yes | - |
| `SUBSCRIPTION_SERVICE_URL` | Subscription service URL | Yes | - |
| `BILLING_SERVICE_URL` | Billing service URL | Yes | - |
| `PAYMENT_SERVICE_URL` | Payment service URL | Yes | - |
| `TICKET_SERVICE_URL` | Ticket service URL | Yes | - |
| `ASSIGNMENT_SERVICE_URL` | Assignment service URL | Yes | - |
| `MEDIA_SERVICE_URL` | Media service URL | Yes | - |
| `NOTIFICATION_SERVICE_URL` | Notification service URL | Yes | - |
| `REPORTING_SERVICE_URL` | Reporting service URL | Yes | - |
| `AUDIT_SERVICE_URL` | Audit service URL | Yes | - |
| `REDIS_URL` | Redis connection string for rate limiting | Yes | `redis://localhost:6379` |
| `JWT_SECRET` | Secret for JWT validation | Yes | - |
| `JWT_ALGORITHM` | JWT algorithm | No | `HS256` |
| `RATE_LIMIT_PER_MINUTE` | Requests per minute per IP | No | `60` |
| `RATE_LIMIT_AUTH_PER_MINUTE` | Auth endpoint requests per minute | No | `10` |
| `CORS_ORIGINS` | Allowed CORS origins (comma-separated) | Yes | - |
| `LOG_LEVEL` | Logging level | No | `INFO` |
| `ENABLE_METRICS` | Enable Prometheus metrics | No | `true` |

## Local Development

### Prerequisites
- Python 3.11+
- Redis running locally

### Setup

1. Install dependencies:
```bash
cd services/gateway-service
pip install -r requirements.txt
```

2. Copy environment file:
```bash
cp config/example.env .env
```

3. Update `.env` with service URLs and configuration.

4. Run the service:
```bash
python src/main.py
```

Or use the dev script:
```bash
./scripts/dev-run.sh
```

### Testing

```bash
# Run unit tests
pytest tests/unit/

# Run integration tests
pytest tests/integration/
```

## Deployment Notes

### Docker

The service includes a `Dockerfile` for containerization:

```bash
docker build -t gateway-service:latest .
docker run -p 8000:8000 --env-file .env gateway-service:latest
```

### Health Checks

The service exposes `/health` endpoint for container health checks.

### Scaling

The gateway is stateless and can be horizontally scaled. Use a load balancer (Nginx) in front of multiple gateway instances.

### Dependencies

- All microservices must be running and accessible
- Redis must be available for rate limiting
- Auth service must be accessible for token validation

## Health Checks and SLOs

### Health Endpoint

**Endpoint**: `GET /health`  
**Expected Response Time**: < 50ms  
**SLO**: 99.9% uptime

### Metrics

- Request rate (requests/second)
- Response time (p50, p95, p99)
- Error rate (4xx, 5xx)
- Rate limit hits
- Downstream service availability

## Runbook

### Common Failures

#### Gateway cannot connect to downstream services

**Symptoms**: 502 Bad Gateway errors

**Diagnosis**:
1. Check service URLs in environment variables
2. Verify services are running and accessible
3. Check network connectivity

**Recovery**:
1. Verify service health endpoints
2. Restart gateway service
3. Check Docker network configuration

#### Rate limiting too aggressive

**Symptoms**: Clients receiving 429 Too Many Requests

**Diagnosis**:
1. Check Redis connection
2. Review rate limit configuration
3. Check for IP address sharing issues

**Recovery**:
1. Adjust `RATE_LIMIT_PER_MINUTE` if needed
2. Verify Redis is running
3. Clear rate limit counters if needed

### Log Locations

- Container logs: `docker logs gateway-service`
- Application logs: stdout/stderr (JSON format)
- Access logs: If enabled, check configured log file

### Recovery Steps

1. **Service restart**: `docker restart gateway-service`
2. **Check dependencies**: Verify all downstream services are healthy
3. **Review logs**: Check for connection errors or configuration issues
4. **Validate configuration**: Ensure all environment variables are set correctly

## Security Notes

### Authentication Requirements

- Public endpoints (health, metrics) do not require authentication
- All `/api/v1/*` endpoints require valid JWT token in `Authorization: Bearer <token>` header
- Token validation is performed via auth-service introspection endpoint

### Rate Limits

- General API: 60 requests/minute per IP
- Auth endpoints: 10 requests/minute per IP
- Rate limits are enforced using Redis

### PII Handling

- Gateway does not store PII
- Request/response logging may contain PII - ensure log retention policies are followed
- Correlation IDs are used for request tracking without exposing user data

### Additional Security

- CORS is strictly enforced based on `CORS_ORIGINS` configuration
- Request size limits prevent DoS attacks
- TLS termination should be handled by Nginx reverse proxy
- IP allow lists can be configured for admin endpoints
