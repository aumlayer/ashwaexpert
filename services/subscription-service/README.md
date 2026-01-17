# Subscription Service

## Service Overview

**Version**: 1.0.0  
**Technology Stack**: Python FastAPI, PostgreSQL  
**Purpose**: Manages subscription lifecycle including creation, changes, pauses, cancellations, and billing cycle management.

The Subscription Service handles the complete subscription lifecycle from creation to cancellation, including plan changes, pauses, and billing cycle selection.

## Responsibilities and Boundaries

### What This Service Owns
- Subscription creation and lifecycle
- Billing cycle selection (user-selectable months)
- Subscription status management
- Plan changes and upgrades/downgrades
- Subscription pauses and resumes
- Cancellation requests (with one-month notice requirement)
- Subscription events history

### What This Service Does NOT Own
- Invoice generation (billing-service)
- Payment processing (payment-service)
- Plan definitions (plan-service)
- Subscriber profiles (subscriber-service)

## Owned Data and Schema

### Database Schema: `subscription`

#### `subscriptions` table
- `id` (UUID, PK)
- `subscriber_id` (UUID, FK -> subscriber.subscribers.id, NOT NULL)
- `plan_id` (UUID, FK -> plan.plans.id, NOT NULL)
- `status` (VARCHAR) - 'active', 'paused', 'cancelled', 'expired'
- `billing_cycle_months` (INTEGER, NOT NULL) - User-selected billing cycle
- `start_date` (DATE, NOT NULL)
- `end_date` (DATE, nullable)
- `next_billing_date` (DATE, NOT NULL)
- `cancellation_requested_at` (TIMESTAMP, nullable)
- `cancellation_effective_date` (DATE, nullable)
- `pause_start_date` (DATE, nullable)
- `pause_end_date` (DATE, nullable)
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

#### `subscription_events` table
- `id` (UUID, PK)
- `subscription_id` (UUID, FK -> subscriptions.id)
- `event_type` (VARCHAR) - 'created', 'plan_changed', 'paused', 'resumed', 'cancelled', 'renewed'
- `old_value` (JSONB, nullable)
- `new_value` (JSONB, nullable)
- `metadata` (JSONB)
- `created_at` (TIMESTAMP)

## Public APIs

### 1. Create Subscription

**POST** `/api/v1/subscriptions`

Create a new subscription for a subscriber.

**Headers:**
```
Authorization: Bearer <subscriber_token>
```

**Request Body:**
```json
{
  "plan_id": "550e8400-e29b-41d4-a716-446655440000",
  "billing_cycle_months": 3,
  "start_date": "2024-02-01"
}
```

**Response:** `201 Created`
```json
{
  "id": "660e8400-e29b-41d4-a716-446655440000",
  "subscriber_id": "770e8400-e29b-41d4-a716-446655440000",
  "plan_id": "550e8400-e29b-41d4-a716-446655440000",
  "status": "active",
  "billing_cycle_months": 3,
  "start_date": "2024-02-01",
  "next_billing_date": "2024-05-01",
  "created_at": "2024-01-15T10:30:00Z"
}
```

### 2. Get My Subscriptions

**GET** `/api/v1/subscriptions/me`

Get current subscriber's subscriptions.

**Headers:**
```
Authorization: Bearer <subscriber_token>
```

**Response:** `200 OK`
```json
{
  "items": [
    {
      "id": "660e8400-e29b-41d4-a716-446655440000",
      "plan": {
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "name": "Basic Plan",
        "base_price_monthly": 999.00
      },
      "status": "active",
      "billing_cycle_months": 3,
      "start_date": "2024-02-01",
      "next_billing_date": "2024-05-01"
    }
  ]
}
```

### 3. Get Subscription Details

**GET** `/api/v1/subscriptions/{subscription_id}`

Get detailed subscription information.

**Headers:**
```
Authorization: Bearer <subscriber_token or admin_token>
```

**Response:** `200 OK`

### 4. Change Plan

**POST** `/api/v1/subscriptions/{subscription_id}/change-plan`

Change subscription plan (upgrade/downgrade).

**Headers:**
```
Authorization: Bearer <subscriber_token>
```

**Request Body:**
```json
{
  "new_plan_id": "880e8400-e29b-41d4-a716-446655440000",
  "effective_date": "2024-02-01"
}
```

**Response:** `200 OK`

**Note**: Triggers proration calculation in billing-service

### 5. Pause Subscription

**POST** `/api/v1/subscriptions/{subscription_id}/pause`

Pause an active subscription.

**Headers:**
```
Authorization: Bearer <subscriber_token>
```

**Request Body:**
```json
{
  "pause_start_date": "2024-02-01",
  "pause_end_date": "2024-03-01"
}
```

**Response:** `200 OK`

### 6. Resume Subscription

**POST** `/api/v1/subscriptions/{subscription_id}/resume`

Resume a paused subscription.

**Headers:**
```
Authorization: Bearer <subscriber_token>
```

**Response:** `200 OK`

### 7. Request Cancellation

**POST** `/api/v1/subscriptions/{subscription_id}/cancel`

Request subscription cancellation (requires one-month notice).

**Headers:**
```
Authorization: Bearer <subscriber_token>
```

**Request Body:**
```json
{
  "reason": "No longer needed"
}
```

**Response:** `200 OK`
```json
{
  "cancellation_requested_at": "2024-01-15T10:30:00Z",
  "cancellation_effective_date": "2024-02-15",
  "message": "Cancellation will be effective on 2024-02-15 (one month notice)"
}
```

### 8. List All Subscriptions (Admin)

**GET** `/api/v1/subscriptions`

List all subscriptions with filtering.

**Headers:**
```
Authorization: Bearer <admin_token>
```

**Query Parameters:**
- `status` (optional)
- `subscriber_id` (optional)
- `plan_id` (optional)
- `page` (optional)
- `limit` (optional)

**Response:** `200 OK`

## Events Published

### SubscriptionCreated
Emitted when a new subscription is created.

```json
{
  "event_type": "SubscriptionCreated",
  "subscription_id": "660e8400-e29b-41d4-a716-446655440000",
  "subscriber_id": "770e8400-e29b-41d4-a716-446655440000",
  "plan_id": "550e8400-e29b-41d4-a716-446655440000",
  "billing_cycle_months": 3,
  "start_date": "2024-02-01",
  "next_billing_date": "2024-05-01",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### SubscriptionChanged
Emitted when subscription plan is changed.

```json
{
  "event_type": "SubscriptionChanged",
  "subscription_id": "660e8400-e29b-41d4-a716-446655440000",
  "old_plan_id": "550e8400-e29b-41d4-a716-446655440000",
  "new_plan_id": "880e8400-e29b-41d4-a716-446655440000",
  "effective_date": "2024-02-01",
  "timestamp": "2024-01-15T11:00:00Z"
}
```

### SubscriptionPaused
Emitted when subscription is paused.

```json
{
  "event_type": "SubscriptionPaused",
  "subscription_id": "660e8400-e29b-41d4-a716-446655440000",
  "pause_start_date": "2024-02-01",
  "pause_end_date": "2024-03-01",
  "timestamp": "2024-01-15T11:00:00Z"
}
```

### SubscriptionCancelled
Emitted when subscription cancellation is requested.

```json
{
  "event_type": "SubscriptionCancelled",
  "subscription_id": "660e8400-e29b-41d4-a716-446655440000",
  "cancellation_effective_date": "2024-02-15",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

## Events Consumed

- **PlanUpdated** (from plan-service): Invalidate cached plan data

## Environment Variables

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `DATABASE_URL` | PostgreSQL connection string | Yes | - |
| `REDIS_URL` | Redis connection string | Yes | - |
| `BILLING_SERVICE_URL` | Billing service URL | Yes | - |
| `PLAN_SERVICE_URL` | Plan service URL | Yes | - |
| `LOG_LEVEL` | Logging level | No | `INFO` |

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

- Cancellation requires one-month notice (enforced in business logic)
- Plan changes trigger proration events to billing-service
- Subscription status transitions must be atomic

## Health Checks and SLOs

- **Health Endpoint**: `GET /health`
- **Expected Response Time**: < 200ms
- **SLO**: 99.9% uptime

## Runbook

### Common Failures

- Billing service unavailable: Subscription creation may fail
- Plan service unavailable: Cannot validate plan changes

## Security Notes

### Authentication Requirements

- All endpoints require authentication
- Subscribers can only access their own subscriptions
- Admin endpoints require admin role

### Rate Limits

- Standard rate limits apply

### PII Handling

- Contains subscriber references
- Subscription history is sensitive data
