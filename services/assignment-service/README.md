# Assignment Service

## Service Overview

**Version**: 1.0.0  
**Technology Stack**: Python FastAPI, PostgreSQL  
**Purpose**: Manages technician job assignments, maintains job queues per technician, and handles assignment lifecycle.

The Assignment Service handles the assignment of tickets to technicians, maintains job queues, and tracks assignment status.

## Responsibilities and Boundaries

### What This Service Owns
- Ticket-to-technician assignments
- Job queue per technician
- Assignment status tracking
- Assignment history

### What This Service Does NOT Own
- Ticket details (ticket-service)
- Technician profiles (auth-service)
- Notifications (notification-service)

## Owned Data and Schema

### Database Schema: `assignment`

#### `ticket_assignments` table
- `id` (UUID, PK)
- `ticket_id` (UUID, FK -> ticket.tickets.id, NOT NULL)
- `technician_id` (UUID, FK -> auth.users.id, NOT NULL)
- `assigned_by` (UUID, FK -> auth.users.id, NOT NULL)
- `status` (VARCHAR) - 'assigned', 'accepted', 'rejected', 'completed'
- `assigned_at` (TIMESTAMP, NOT NULL)
- `accepted_at` (TIMESTAMP, nullable)
- `rejected_at` (TIMESTAMP, nullable)
- `rejection_reason` (TEXT, nullable)
- `completed_at` (TIMESTAMP, nullable)
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

## Public APIs

### 1. Assign Ticket to Technician

**POST** `/api/v1/assignments`

Assign a ticket to a technician.

**Headers:**
```
Authorization: Bearer <admin_token>
```

**Request Body:**
```json
{
  "ticket_id": "bb0e8400-e29b-41d4-a716-446655440000",
  "technician_id": "ee0e8400-e29b-41d4-a716-446655440000"
}
```

**Response:** `201 Created`
```json
{
  "id": "ff0e8400-e29b-41d4-a716-446655440000",
  "ticket_id": "bb0e8400-e29b-41d4-a716-446655440000",
  "technician_id": "ee0e8400-e29b-41d4-a716-446655440000",
  "status": "assigned",
  "assigned_at": "2024-02-01T11:00:00Z"
}
```

### 2. Get My Jobs (Technician)

**GET** `/api/v1/assignments/me`

Get current technician's assigned jobs.

**Headers:**
```
Authorization: Bearer <technician_token>
```

**Query Parameters:**
- `status` (optional)
- `page` (optional)
- `limit` (optional)

**Response:** `200 OK`
```json
{
  "items": [
    {
      "id": "ff0e8400-e29b-41d4-a716-446655440000",
      "ticket": {
        "id": "bb0e8400-e29b-41d4-a716-446655440000",
        "ticket_number": "TKT-2024-000001",
        "title": "AC not cooling properly",
        "priority": "medium",
        "scheduled_date": "2024-02-05"
      },
      "status": "assigned",
      "assigned_at": "2024-02-01T11:00:00Z"
    }
  ],
  "total": 5
}
```

### 3. Accept Assignment

**POST** `/api/v1/assignments/{assignment_id}/accept`

Accept a job assignment.

**Headers:**
```
Authorization: Bearer <technician_token>
```

**Response:** `200 OK`

### 4. Reject Assignment

**POST** `/api/v1/assignments/{assignment_id}/reject`

Reject a job assignment.

**Headers:**
```
Authorization: Bearer <technician_token>
```

**Request Body:**
```json
{
  "rejection_reason": "Already have too many pending jobs"
}
```

**Response:** `200 OK`

### 5. Get Assignment Details

**GET** `/api/v1/assignments/{assignment_id}`

Get assignment details.

**Headers:**
```
Authorization: Bearer <technician_token or admin_token>
```

**Response:** `200 OK`

### 6. List All Assignments (Admin)

**GET** `/api/v1/assignments`

List all assignments with filtering.

**Headers:**
```
Authorization: Bearer <admin_token>
```

**Query Parameters:**
- `technician_id` (optional)
- `ticket_id` (optional)
- `status` (optional)
- `page` (optional)
- `limit` (optional)

**Response:** `200 OK`

## Events Published

### JobAssigned
Emitted when a ticket is assigned to a technician.

```json
{
  "event_type": "JobAssigned",
  "assignment_id": "ff0e8400-e29b-41d4-a716-446655440000",
  "ticket_id": "bb0e8400-e29b-41d4-a716-446655440000",
  "technician_id": "ee0e8400-e29b-41d4-a716-446655440000",
  "timestamp": "2024-02-01T11:00:00Z"
}
```

## Events Consumed

- **TicketCreated** (from ticket-service): Auto-assign based on rules (optional)
- **TicketStatusChanged** (from ticket-service): Update assignment status when ticket completed

## Environment Variables

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `DATABASE_URL` | PostgreSQL connection string | Yes | - |
| `REDIS_URL` | Redis connection string | Yes | - |
| `TICKET_SERVICE_URL` | Ticket service URL | Yes | - |
| `NOTIFICATION_SERVICE_URL` | Notification service URL | Yes | - |
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

- Assignment status must sync with ticket status
- Job queue should be optimized for technician app queries

## Health Checks and SLOs

- **Health Endpoint**: `GET /health`
- **Expected Response Time**: < 200ms
- **SLO**: 99.9% uptime

## Runbook

### Common Failures

- Assignment-ticket sync issues: Verify event consumption
- Job queue performance: Add indexes if needed

## Security Notes

### Authentication Requirements

- Assignment creation requires admin authentication
- Technician endpoints require technician authentication
- Admin endpoints require admin role

### Rate Limits

- Standard rate limits apply

### PII Handling

- Contains technician and ticket references
- Assignment history is sensitive data
