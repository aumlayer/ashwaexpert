# API Gateway API Documentation

## Overview

The API Gateway is the single entry point for all client requests. It routes requests to appropriate microservices.

## Base URL

- Development: `http://localhost:8000`
- Production: `https://api.ashvaexperts.com`

## Authentication

Most endpoints require JWT authentication:

```
Authorization: Bearer <access_token>
```

## Rate Limiting

- General API: 60 requests/minute per IP
- Auth endpoints: 10 requests/minute per IP

## Endpoints

All endpoints are proxied to respective services. See individual service API documentation:

- `/api/v1/auth/*` → auth-service
- `/api/v1/leads/*` → lead-service
- `/api/v1/content/*` → content-service
- `/api/v1/subscribers/*` → subscriber-service
- `/api/v1/plans/*` → plan-service
- `/api/v1/subscriptions/*` → subscription-service
- `/api/v1/billing/*` → billing-service
- `/api/v1/payments/*` → payment-service
- `/api/v1/tickets/*` → ticket-service
- `/api/v1/assignments/*` → assignment-service
- `/api/v1/media/*` → media-service
- `/api/v1/notifications/*` → notification-service
- `/api/v1/reports/*` → reporting-service
- `/api/v1/audit/*` → audit-service

## Health Check

**GET** `/health`

Returns gateway health status.
