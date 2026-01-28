# Kubernetes Networking and Service Discovery

This repository is **Kubernetes-first** for service discovery.

## Canonical internal URLs (Kubernetes DNS)

All services listen on port `8000` inside the cluster and are reachable via `http://<service-name>:8000`.

- `GATEWAY_SERVICE_URL=http://gateway-service:8000`
- `AUTH_SERVICE_URL=http://auth-service:8000`
- `LEAD_SERVICE_URL=http://lead-service:8000`
- `CONTENT_SERVICE_URL=http://content-service:8000`
- `SUBSCRIBER_SERVICE_URL=http://subscriber-service:8000`
- `PLAN_SERVICE_URL=http://plan-service:8000`
- `SUBSCRIPTION_SERVICE_URL=http://subscription-service:8000`
- `BILLING_SERVICE_URL=http://billing-service:8000`
- `PAYMENT_SERVICE_URL=http://payment-service:8000`
- `TICKET_SERVICE_URL=http://ticket-service:8000`
- `ASSIGNMENT_SERVICE_URL=http://assignment-service:8000`
- `MEDIA_SERVICE_URL=http://media-service:8000`
- `NOTIFICATION_SERVICE_URL=http://notification-service:8000`
- `REPORTING_SERVICE_URL=http://reporting-service:8000`
- `AUDIT_SERVICE_URL=http://audit-service:8000`
- `COUPON_SERVICE_URL=http://coupon-service:8000`

## Gateway routing

Gateway routes requests to upstream services using the service DNS names above.

Only the gateway should be exposed via Ingress.

## Probes

Every service exposes:

- `GET /health`
- `GET /ready`
- `GET /live`

Kubernetes should configure:

- `readinessProbe` -> `GET /ready`
- `livenessProbe` -> `GET /live`

## Internal endpoints

Some services have internal endpoints (e.g. `/api/v1/*/internal/*`).

- These endpoints are intended for service-to-service calls.
- Internal calls must include `X-Internal-API-Key`.
- Gateway must not expose internal endpoints externally.

## Local development (docker-compose)

`docker-compose` should use the same service names so that in-cluster DNS matches local service discovery.
