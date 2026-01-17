# Ticket Service

## Service Overview

**Version**: 1.0.0  
**Technology Stack**: Python FastAPI, PostgreSQL  
**Purpose**: Manages service tickets (installation, service, repair), SLA tracking, status management, and ticket history.

The Ticket Service handles the complete ticket lifecycle from creation to closure, including SLA monitoring, status transitions, and completion proof management.

## Responsibilities and Boundaries

### What This Service Owns
- Ticket creation and management
- Ticket status workflow (created → assigned → in_progress → completed → closed)
- SLA configuration and tracking
- Ticket status history
- Completion notes and proof references

### What This Service Does NOT Own
- Technician assignment (assignment-service)
- Media files/photos (media-service)
- Notifications (notification-service)
- Subscriber data (subscriber-service)

## Owned Data and Schema

### Database Schema: `ticket`

#### `tickets` table
- `id` (UUID, PK)
- `ticket_number` (VARCHAR, UNIQUE, NOT NULL) - e.g., "TKT-2024-000001"
- `subscriber_id` (UUID, FK -> subscriber.subscribers.id, NOT NULL)
- `subscription_id` (UUID, FK -> subscription.subscriptions.id, nullable)
- `ticket_type` (VARCHAR, NOT NULL) - 'installation', 'service', 'repair'
- `priority` (VARCHAR) - 'low', 'medium', 'high', 'urgent'
- `status` (VARCHAR) - 'created', 'assigned', 'in_progress', 'completed', 'closed', 'cancelled'
- `title` (VARCHAR, NOT NULL)
- `description` (TEXT, NOT NULL)
- `location_address` (TEXT)
- `scheduled_date` (DATE, nullable)
- `scheduled_time` (TIME, nullable)
- `sla_deadline` (TIMESTAMP, nullable)
- `sla_status` (VARCHAR) - 'on_time', 'at_risk', 'breached'
- `completed_at` (TIMESTAMP, nullable)
- `closed_at` (TIMESTAMP, nullable)
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

#### `ticket_status_history` table
- `id` (UUID, PK)
- `ticket_id` (UUID, FK -> tickets.id)
- `old_status` (VARCHAR, nullable)
- `new_status` (VARCHAR, NOT NULL)
- `changed_by` (UUID, FK -> auth.users.id, nullable)
- `notes` (TEXT, nullable)
- `created_at` (TIMESTAMP)

#### `ticket_completion_notes` table
- `id` (UUID, PK)
- `ticket_id` (UUID, FK -> tickets.id, UNIQUE)
- `technician_notes` (TEXT)
- `completion_photos` (JSONB) - Array of media IDs
- `completed_by` (UUID, FK -> auth.users.id)
- `created_at` (TIMESTAMP)

#### `sla_configs` table
- `id` (UUID, PK)
- `ticket_type` (VARCHAR, NOT NULL)
- `priority` (VARCHAR, NOT NULL)
- `sla_hours` (INTEGER, NOT NULL) - Hours to resolve
- `is_active` (BOOLEAN, DEFAULT true)
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

## Public APIs

### 1. Create Ticket

**POST** `/api/v1/tickets`

Create a new service ticket.

**Headers:**
```
Authorization: Bearer <subscriber_token>
```

**Request Body:**
```json
{
  "ticket_type": "service",
  "priority": "medium",
  "title": "AC not cooling properly",
  "description": "AC unit is running but not cooling the room",
  "location_address": "123 Main St, Mumbai",
  "scheduled_date": "2024-02-05",
  "scheduled_time": "10:00:00"
}
```

**Response:** `201 Created`
```json
{
  "id": "bb0e8400-e29b-41d4-a716-446655440000",
  "ticket_number": "TKT-2024-000001",
  "ticket_type": "service",
  "priority": "medium",
  "status": "created",
  "sla_deadline": "2024-02-07T10:00:00Z",
  "sla_status": "on_time",
  "created_at": "2024-02-01T10:30:00Z"
}
```

### 2. Get My Tickets

**GET** `/api/v1/tickets/me`

Get current subscriber's tickets.

**Headers:**
```
Authorization: Bearer <subscriber_token>
```

**Query Parameters:**
- `status` (optional)
- `ticket_type` (optional)
- `page` (optional)
- `limit` (optional)

**Response:** `200 OK`

### 3. Get Ticket Details

**GET** `/api/v1/tickets/{ticket_id}`

Get detailed ticket information.

**Headers:**
```
Authorization: Bearer <subscriber_token or technician_token or admin_token>
```

**Response:** `200 OK`
```json
{
  "id": "bb0e8400-e29b-41d4-a716-446655440000",
  "ticket_number": "TKT-2024-000001",
  "ticket_type": "service",
  "priority": "medium",
  "status": "in_progress",
  "title": "AC not cooling properly",
  "description": "AC unit is running but not cooling the room",
  "location_address": "123 Main St, Mumbai",
  "scheduled_date": "2024-02-05",
  "scheduled_time": "10:00:00",
  "sla_deadline": "2024-02-07T10:00:00Z",
  "sla_status": "on_time",
  "status_history": [
    {
      "old_status": "created",
      "new_status": "assigned",
      "changed_at": "2024-02-01T11:00:00Z"
    }
  ],
  "created_at": "2024-02-01T10:30:00Z"
}
```

### 4. Update Ticket Status

**PATCH** `/api/v1/tickets/{ticket_id}/status`

Update ticket status (technician or admin).

**Headers:**
```
Authorization: Bearer <technician_token or admin_token>
```

**Request Body:**
```json
{
  "status": "in_progress",
  "notes": "Started working on AC unit"
}
```

**Response:** `200 OK`

### 5. Complete Ticket

**POST** `/api/v1/tickets/{ticket_id}/complete`

Mark ticket as completed with notes and photos.

**Headers:**
```
Authorization: Bearer <technician_token>
```

**Request Body:**
```json
{
  "technician_notes": "Cleaned filters and recharged refrigerant. AC is now working properly.",
  "completion_photos": [
    "cc0e8400-e29b-41d4-a716-446655440000",
    "dd0e8400-e29b-41d4-a716-446655440000"
  ]
}
```

**Response:** `200 OK`

### 6. Close Ticket

**POST** `/api/v1/tickets/{ticket_id}/close`

Close a completed ticket.

**Headers:**
```
Authorization: Bearer <admin_token or subscriber_token>
```

**Response:** `200 OK`

### 7. List All Tickets (Admin)

**GET** `/api/v1/tickets`

List all tickets with filtering.

**Headers:**
```
Authorization: Bearer <admin_token>
```

**Query Parameters:**
- `status` (optional)
- `ticket_type` (optional)
- `priority` (optional)
- `sla_status` (optional)
- `assigned_to` (optional)
- `page` (optional)
- `limit` (optional)

**Response:** `200 OK`

### 8. Configure SLA

**POST** `/api/v1/tickets/sla-configs`

Configure SLA rules.

**Headers:**
```
Authorization: Bearer <admin_token>
```

**Request Body:**
```json
{
  "ticket_type": "service",
  "priority": "high",
  "sla_hours": 24
}
```

**Response:** `201 Created`

## Events Published

### TicketCreated
Emitted when a new ticket is created.

```json
{
  "event_type": "TicketCreated",
  "ticket_id": "bb0e8400-e29b-41d4-a716-446655440000",
  "ticket_number": "TKT-2024-000001",
  "subscriber_id": "770e8400-e29b-41d4-a716-446655440000",
  "ticket_type": "service",
  "priority": "medium",
  "sla_deadline": "2024-02-07T10:00:00Z",
  "timestamp": "2024-02-01T10:30:00Z"
}
```

### TicketStatusChanged
Emitted when ticket status changes.

```json
{
  "event_type": "TicketStatusChanged",
  "ticket_id": "bb0e8400-e29b-41d4-a716-446655440000",
  "old_status": "assigned",
  "new_status": "in_progress",
  "timestamp": "2024-02-01T11:00:00Z"
}
```

### SLABreached
Emitted when SLA deadline is breached.

```json
{
  "event_type": "SLABreached",
  "ticket_id": "bb0e8400-e29b-41d4-a716-446655440000",
  "ticket_number": "TKT-2024-000001",
  "sla_deadline": "2024-02-07T10:00:00Z",
  "timestamp": "2024-02-07T10:01:00Z"
}
```

## Events Consumed

- **JobAssigned** (from assignment-service): Update ticket status to 'assigned'

## Environment Variables

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `DATABASE_URL` | PostgreSQL connection string | Yes | - |
| `REDIS_URL` | Redis connection string | Yes | - |
| `ASSIGNMENT_SERVICE_URL` | Assignment service URL | Yes | - |
| `NOTIFICATION_SERVICE_URL` | Notification service URL | Yes | - |
| `MEDIA_SERVICE_URL` | Media service URL | Yes | - |
| `LOG_LEVEL` | Logging level | No | `INFO` |
| `SLA_CHECK_INTERVAL_MINUTES` | SLA monitoring interval | No | `15` |

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

- SLA monitoring runs as background job
- Ticket numbering must be sequential and unique
- Status transitions must be validated
- Completion photos are stored as media IDs (references)

## Health Checks and SLOs

- **Health Endpoint**: `GET /health`
- **Expected Response Time**: < 300ms
- **SLO**: 99.9% uptime

## Runbook

### Common Failures

- SLA monitoring not running: Check background job status
- Status transition errors: Validate state machine rules

## Security Notes

### Authentication Requirements

- Ticket creation requires subscriber authentication
- Status updates require technician or admin authentication
- Admin endpoints require admin role

### Rate Limits

- Ticket creation: 10 requests/hour per subscriber
- Standard rate limits for other endpoints

### PII Handling

- Contains subscriber location and contact information
- Completion photos may contain sensitive information
- Ensure proper access controls
