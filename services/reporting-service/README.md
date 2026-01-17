# Reporting Service

## Service Overview

**Version**: 1.0.0  
**Technology Stack**: Python FastAPI, PostgreSQL  
**Purpose**: Provides dashboard queries, analytics, and read-optimized projections for reporting and metrics.

The Reporting Service consumes events from other services to build materialized views and projections for fast dashboard queries and analytics.

## Responsibilities and Boundaries

### What This Service Owns
- Dashboard data aggregations
- Read-optimized projections
- Analytics queries
- Metrics calculations
- Materialized views

### What This Service Does NOT Own
- Source data (other services own their data)
- Real-time data (reads from projections)

## Owned Data and Schema

### Database Schema: `reporting`

#### `dashboard_metrics` table (materialized view)
- `metric_date` (DATE, PK)
- `total_subscribers` (INTEGER)
- `active_subscriptions` (INTEGER)
- `total_revenue` (DECIMAL(10,2))
- `pending_invoices` (INTEGER)
- `overdue_invoices` (INTEGER)
- `open_tickets` (INTEGER)
- `closed_tickets` (INTEGER)
- `sla_breaches` (INTEGER)
- `last_updated` (TIMESTAMP)

#### `subscription_analytics` table
- `id` (UUID, PK)
- `subscription_id` (UUID)
- `plan_id` (UUID)
- `subscriber_id` (UUID)
- `status` (VARCHAR)
- `start_date` (DATE)
- `end_date` (DATE, nullable)
- `total_revenue` (DECIMAL(10,2))
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

#### `ticket_analytics` table
- `id` (UUID, PK)
- `ticket_id` (UUID)
- `ticket_type` (VARCHAR)
- `priority` (VARCHAR)
- `status` (VARCHAR)
- `created_date` (DATE)
- `resolved_date` (DATE, nullable)
- `resolution_time_hours` (DECIMAL(10,2), nullable)
- `sla_status` (VARCHAR)
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

## Public APIs

### 1. Get Dashboard Metrics

**GET** `/api/v1/reports/dashboard`

Get overall dashboard metrics.

**Headers:**
```
Authorization: Bearer <admin_token>
```

**Query Parameters:**
- `start_date` (optional): Start date for metrics
- `end_date` (optional): End date for metrics

**Response:** `200 OK`
```json
{
  "total_subscribers": 150,
  "active_subscriptions": 120,
  "total_revenue": 150000.00,
  "pending_invoices": 15,
  "overdue_invoices": 5,
  "open_tickets": 25,
  "closed_tickets_this_month": 80,
  "sla_breaches_this_month": 3,
  "revenue_trend": [
    {"date": "2024-01-01", "revenue": 50000.00},
    {"date": "2024-02-01", "revenue": 55000.00}
  ]
}
```

### 2. Get Subscription Analytics

**GET** `/api/v1/reports/subscriptions`

Get subscription analytics.

**Headers:**
```
Authorization: Bearer <admin_token>
```

**Query Parameters:**
- `start_date` (optional)
- `end_date` (optional)
- `plan_id` (optional)
- `group_by` (optional) - 'plan', 'month', 'status'

**Response:** `200 OK`
```json
{
  "total_subscriptions": 120,
  "by_plan": [
    {
      "plan_id": "550e8400-e29b-41d4-a716-446655440000",
      "plan_name": "Basic Plan",
      "count": 80,
      "revenue": 80000.00
    }
  ],
  "by_month": [
    {
      "month": "2024-01",
      "new_subscriptions": 15,
      "cancelled": 5,
      "revenue": 15000.00
    }
  ]
}
```

### 3. Get Ticket Analytics

**GET** `/api/v1/reports/tickets`

Get ticket analytics.

**Headers:**
```
Authorization: Bearer <admin_token>
```

**Query Parameters:**
- `start_date` (optional)
- `end_date` (optional)
- `ticket_type` (optional)
- `priority` (optional)

**Response:** `200 OK`
```json
{
  "total_tickets": 200,
  "by_type": [
    {
      "ticket_type": "service",
      "count": 120,
      "avg_resolution_hours": 24.5
    }
  ],
  "by_priority": [
    {
      "priority": "high",
      "count": 30,
      "sla_breaches": 2
    }
  ],
  "resolution_trend": [
    {"date": "2024-01-01", "resolved": 10, "created": 12}
  ]
}
```

### 4. Get Revenue Report

**GET** `/api/v1/reports/revenue`

Get revenue analytics.

**Headers:**
```
Authorization: Bearer <admin_token>
```

**Query Parameters:**
- `start_date` (optional)
- `end_date` (optional)
- `group_by` (optional) - 'day', 'month', 'year'

**Response:** `200 OK`
```json
{
  "total_revenue": 150000.00,
  "by_period": [
    {
      "period": "2024-01",
      "revenue": 50000.00,
      "invoices": 50
    }
  ],
  "by_plan": [
    {
      "plan_id": "550e8400-e29b-41d4-a716-446655440000",
      "plan_name": "Basic Plan",
      "revenue": 80000.00
    }
  ]
}
```

### 5. Get SLA Report

**GET** `/api/v1/reports/sla`

Get SLA performance report.

**Headers:**
```
Authorization: Bearer <admin_token>
```

**Query Parameters:**
- `start_date` (optional)
- `end_date` (optional)

**Response:** `200 OK`
```json
{
  "total_tickets": 200,
  "on_time": 190,
  "at_risk": 5,
  "breached": 5,
  "compliance_rate": 95.0,
  "by_ticket_type": [
    {
      "ticket_type": "service",
      "compliance_rate": 96.0
    }
  ]
}
```

## Events Published

None. Reporting service is read-only.

## Events Consumed

- **SubscriptionCreated** (from subscription-service): Update subscription analytics
- **SubscriptionChanged** (from subscription-service): Update analytics
- **SubscriptionCancelled** (from subscription-service): Update analytics
- **InvoiceGenerated** (from billing-service): Update revenue metrics
- **InvoicePaid** (from billing-service): Update revenue metrics
- **TicketCreated** (from ticket-service): Update ticket analytics
- **TicketStatusChanged** (from ticket-service): Update ticket analytics
- **SLABreached** (from ticket-service): Update SLA metrics

## Environment Variables

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `DATABASE_URL` | PostgreSQL connection string | Yes | - |
| `REDIS_URL` | Redis connection string | Yes | - |
| `PROJECTION_UPDATE_INTERVAL_MINUTES` | How often to refresh projections | No | `15` |
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

3. Start event consumers:
```bash
python src/main.py
```

## Deployment Notes

- Projections are updated asynchronously from events
- Materialized views should be refreshed periodically
- Read-optimized indexes are critical for performance
- Consider caching frequently accessed reports

## Health Checks and SLOs

- **Health Endpoint**: `GET /health`
- **Expected Response Time**: < 500ms (cached), < 2s (uncached)
- **SLO**: 99.9% uptime

## Runbook

### Common Failures

- Projection update failures: Check event consumption
- Slow query performance: Review indexes and materialized views
- Data staleness: Verify event consumption is working

## Security Notes

### Authentication Requirements

- All endpoints require admin authentication
- Reports contain sensitive business data

### Rate Limits

- Standard rate limits apply
- Consider caching for expensive queries

### PII Handling

- Reports may contain aggregated subscriber data
- Ensure proper access controls
- Audit all report access
