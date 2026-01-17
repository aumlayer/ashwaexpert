# Audit Service

## Service Overview

**Version**: 1.0.0  
**Technology Stack**: Python FastAPI, PostgreSQL  
**Purpose**: Centralized append-only audit log store with 90-day retention policy.

The Audit Service provides a centralized location for all audit events from across the system. It maintains an append-only log with automatic retention enforcement.

## Responsibilities and Boundaries

### What This Service Owns
- Centralized audit log storage
- Audit log retention (90 days)
- Audit log querying
- Retention policy enforcement

### What This Service Does NOT Own
- Business logic (other services)
- Event generation (other services emit events)

## Owned Data and Schema

### Database Schema: `audit`

#### `audit_logs` table
- `id` (UUID, PK)
- `event_type` (VARCHAR, NOT NULL) - e.g., "UserCreated", "InvoicePaid"
- `service_name` (VARCHAR, NOT NULL) - Source service
- `user_id` (UUID, FK -> auth.users.id, nullable)
- `entity_type` (VARCHAR, nullable) - e.g., "invoice", "subscription"
- `entity_id` (UUID, nullable)
- `action` (VARCHAR, NOT NULL) - 'create', 'update', 'delete', 'view'
- `changes` (JSONB, nullable) - Before/after values
- `metadata` (JSONB, nullable) - Additional context
- `ip_address` (VARCHAR, nullable)
- `user_agent` (VARCHAR, nullable)
- `correlation_id` (VARCHAR, nullable)
- `created_at` (TIMESTAMP, NOT NULL)

## Public APIs

### 1. Append Audit Log

**POST** `/api/v1/audit/logs`

Append an audit log entry (called by other services).

**Headers:**
```
Authorization: Bearer <internal_service_token>
```

**Request Body:**
```json
{
  "event_type": "InvoicePaid",
  "service_name": "billing-service",
  "user_id": "550e8400-e29b-41d4-a716-446655440000",
  "entity_type": "invoice",
  "entity_id": "990e8400-e29b-41d4-a716-446655440000",
  "action": "update",
  "changes": {
    "status": {
      "old": "issued",
      "new": "paid"
    }
  },
  "metadata": {
    "payment_id": "aa0e8400-e29b-41d4-a716-446655440000",
    "amount": 3536.46
  },
  "ip_address": "192.168.1.1",
  "correlation_id": "req_123456"
}
```

**Response:** `201 Created`
```json
{
  "id": "140e8400-e29b-41d4-a716-446655440000",
  "created_at": "2024-02-01T10:30:00Z"
}
```

### 2. Query Audit Logs

**GET** `/api/v1/audit/logs`

Query audit logs with filtering.

**Headers:**
```
Authorization: Bearer <admin_token>
```

**Query Parameters:**
- `event_type` (optional)
- `service_name` (optional)
- `user_id` (optional)
- `entity_type` (optional)
- `entity_id` (optional)
- `action` (optional)
- `start_date` (optional)
- `end_date` (optional)
- `page` (optional)
- `limit` (optional)

**Response:** `200 OK`
```json
{
  "items": [
    {
      "id": "140e8400-e29b-41d4-a716-446655440000",
      "event_type": "InvoicePaid",
      "service_name": "billing-service",
      "user_id": "550e8400-e29b-41d4-a716-446655440000",
      "entity_type": "invoice",
      "entity_id": "990e8400-e29b-41d4-a716-446655440000",
      "action": "update",
      "changes": {
        "status": {
          "old": "issued",
          "new": "paid"
        }
      },
      "created_at": "2024-02-01T10:30:00Z"
    }
  ],
  "total": 1000,
  "page": 1,
  "limit": 20
}
```

### 3. Get Audit Log by ID

**GET** `/api/v1/audit/logs/{log_id}`

Get specific audit log entry.

**Headers:**
```
Authorization: Bearer <admin_token>
```

**Response:** `200 OK`

### 4. Get Audit Trail for Entity

**GET** `/api/v1/audit/entities/{entity_type}/{entity_id}`

Get complete audit trail for an entity.

**Headers:**
```
Authorization: Bearer <admin_token>
```

**Response:** `200 OK`
```json
{
  "entity_type": "invoice",
  "entity_id": "990e8400-e29b-41d4-a716-446655440000",
  "logs": [
    {
      "event_type": "InvoiceGenerated",
      "action": "create",
      "created_at": "2024-02-01T10:00:00Z"
    },
    {
      "event_type": "InvoicePaid",
      "action": "update",
      "created_at": "2024-02-01T10:30:00Z"
    }
  ]
}
```

### 5. Get User Activity

**GET** `/api/v1/audit/users/{user_id}/activity`

Get audit logs for a specific user.

**Headers:**
```
Authorization: Bearer <admin_token>
```

**Query Parameters:**
- `start_date` (optional)
- `end_date` (optional)
- `page` (optional)
- `limit` (optional)

**Response:** `200 OK`

## Events Published

None. Audit service only stores events.

## Events Consumed

All services emit audit events. The audit service listens to:
- All events from all services (via message broker)
- Direct API calls from services (synchronous)

## Environment Variables

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `DATABASE_URL` | PostgreSQL connection string | Yes | - |
| `REDIS_URL` | Redis connection string | Yes | - |
| `RETENTION_DAYS` | Audit log retention period | No | `90` |
| `CLEANUP_INTERVAL_HOURS` | How often to run cleanup job | No | `24` |
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

- Retention policy is enforced by scheduled cleanup job
- Audit logs are append-only (no updates/deletes)
- Indexes on entity_type, entity_id, user_id, created_at for query performance
- Consider partitioning by date for large volumes

## Health Checks and SLOs

- **Health Endpoint**: `GET /health`
- **Expected Response Time**: < 300ms (queries may take longer)
- **SLO**: 99.9% uptime

## Runbook

### Common Failures

- Cleanup job not running: Verify scheduled job status
- Query performance: Review indexes and consider partitioning
- Storage growth: Verify retention policy is working

### Cleanup Job

The cleanup job runs periodically to delete audit logs older than retention period:

```sql
DELETE FROM audit_logs 
WHERE created_at < NOW() - INTERVAL '90 days';
```

## Security Notes

### Authentication Requirements

- Append endpoint requires internal service token
- Query endpoints require admin authentication
- Audit logs themselves should not be modifiable

### Rate Limits

- Append endpoint: High rate limit (services need to log frequently)
- Query endpoints: Standard rate limits

### PII Handling

- Audit logs may contain PII (user actions, IP addresses)
- Ensure secure storage and access controls
- Audit log access itself should be logged
- 90-day retention is a compliance requirement

### Additional Security

- Append-only enforcement (database constraints)
- Immutable logs (no update/delete operations)
- Secure query access (admin only)
- Encryption at rest recommended
