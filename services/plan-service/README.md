# Plan Service

## Service Overview

**Version**: 1.0.0  
**Technology Stack**: Python FastAPI, PostgreSQL  
**Purpose**: Manages subscription plan catalog, plan components, and pricing.

The Plan Service maintains the catalog of available subscription plans, their components, features, and pricing information.

## Responsibilities and Boundaries

### What This Service Owns
- Plan definitions and catalog
- Plan components (features, limits, pricing)
- Plan availability and status
- Plan versioning (for pricing changes)

### What This Service Does NOT Own
- Subscriptions (subscription-service)
- Billing (billing-service)
- Payments (payment-service)

## Owned Data and Schema

### Database Schema: `plan`

#### `plans` table
- `id` (UUID, PK)
- `name` (VARCHAR, NOT NULL)
- `slug` (VARCHAR, UNIQUE, NOT NULL)
- `description` (TEXT)
- `base_price_monthly` (DECIMAL(10,2), NOT NULL)
- `is_active` (BOOLEAN, DEFAULT true)
- `is_featured` (BOOLEAN, DEFAULT false)
- `sort_order` (INTEGER, DEFAULT 0)
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

#### `plan_components` table
- `id` (UUID, PK)
- `plan_id` (UUID, FK -> plans.id)
- `component_type` (VARCHAR) - 'feature', 'limit', 'addon'
- `name` (VARCHAR, NOT NULL)
- `value` (VARCHAR) - e.g., "100", "unlimited", "true"
- `description` (TEXT)
- `sort_order` (INTEGER, DEFAULT 0)
- `created_at` (TIMESTAMP)

## Public APIs

### 1. List Plans (Public/Subscriber)

**GET** `/api/v1/plans`

List all active plans.

**Query Parameters:**
- `featured` (optional): Filter featured plans only

**Response:** `200 OK`
```json
{
  "items": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "Basic Plan",
      "slug": "basic-plan",
      "description": "Perfect for small businesses",
      "base_price_monthly": 999.00,
      "is_featured": false,
      "components": [
        {
          "component_type": "feature",
          "name": "Service Visits",
          "value": "4",
          "description": "4 service visits per month"
        }
      ]
    }
  ],
  "total": 3
}
```

### 2. Get Plan Details

**GET** `/api/v1/plans/{plan_id}`

Get detailed plan information.

**Response:** `200 OK`
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "Basic Plan",
  "slug": "basic-plan",
  "description": "Perfect for small businesses",
  "base_price_monthly": 999.00,
  "components": [
    {
      "id": "660e8400-e29b-41d4-a716-446655440000",
      "component_type": "feature",
      "name": "Service Visits",
      "value": "4",
      "description": "4 service visits per month"
    },
    {
      "id": "770e8400-e29b-41d4-a716-446655440000",
      "component_type": "limit",
      "name": "Max Devices",
      "value": "10",
      "description": "Maximum 10 devices"
    }
  ],
  "created_at": "2024-01-15T10:30:00Z"
}
```

### 3. Create Plan (Admin)

**POST** `/api/v1/plans`

Create a new plan.

**Headers:**
```
Authorization: Bearer <admin_token>
```

**Request Body:**
```json
{
  "name": "Premium Plan",
  "slug": "premium-plan",
  "description": "For large enterprises",
  "base_price_monthly": 4999.00,
  "is_featured": true,
  "components": [
    {
      "component_type": "feature",
      "name": "Service Visits",
      "value": "unlimited"
    }
  ]
}
```

**Response:** `201 Created`

### 4. Update Plan (Admin)

**PUT** `/api/v1/plans/{plan_id}`

Update plan details.

**Headers:**
```
Authorization: Bearer <admin_token>
```

**Response:** `200 OK`

### 5. Deactivate Plan (Admin)

**DELETE** `/api/v1/plans/{plan_id}`

Deactivate a plan (soft delete).

**Headers:**
```
Authorization: Bearer <admin_token>
```

**Response:** `204 No Content`

## Events Published

### PlanUpdated
Emitted when a plan is updated (pricing, features, etc.).

```json
{
  "event_type": "PlanUpdated",
  "plan_id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "Basic Plan",
  "base_price_monthly": 999.00,
  "timestamp": "2024-01-15T11:00:00Z"
}
```

## Events Consumed

None. Plan service is source of truth for plans.

## Environment Variables

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `DATABASE_URL` | PostgreSQL connection string | Yes | - |
| `REDIS_URL` | Redis connection string (for caching) | Yes | - |
| `LOG_LEVEL` | Logging level | No | `INFO` |
| `CACHE_TTL_SECONDS` | Cache TTL for plans | No | `3600` |

## Local Development

### Setup

1. Install dependencies:
```bash
pip install -r requirements.txt
```

2. Run migrations:
```bash
alembic upgrade head
```

3. Run service:
```bash
python src/main.py
```

## Deployment Notes

- Plans are cached for performance
- Plan updates should be carefully managed (affects existing subscriptions)
- Consider versioning for pricing changes

## Health Checks and SLOs

- **Health Endpoint**: `GET /health`
- **Expected Response Time**: < 100ms (cached)
- **SLO**: 99.9% uptime

## Runbook

### Common Failures

- Cache invalidation: Clear cache after plan updates
- Database connection: Verify DATABASE_URL

## Security Notes

### Authentication Requirements

- Public listing/details endpoints are open
- Admin endpoints require admin authentication

### Rate Limits

- Standard rate limits apply

### PII Handling

- No PII stored in plan service
