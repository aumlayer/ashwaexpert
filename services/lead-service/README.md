# Lead Service

## Service Overview

**Version**: 1.0.0  
**Technology Stack**: Python FastAPI, PostgreSQL  
**Purpose**: Manages lead capture from public website, lead pipeline workflow, and lead attribution tracking.

The Lead Service handles all lead-related operations including capture, status management, and pipeline tracking from initial enquiry to closed/won status.

## Responsibilities and Boundaries

### What This Service Owns
- Lead creation and storage
- Lead pipeline status management (New → Contacted → Qualified → Proposal → Closed/Won)
- Lead activity tracking
- Lead source attribution
- Lead assignment to sales team

### What This Service Does NOT Own
- User authentication (auth-service)
- Content/case studies (content-service)
- Notifications (notification-service handles alerts)

## Owned Data and Schema

### Database Schema: `lead`

#### `leads` table
- `id` (UUID, PK)
- `name` (VARCHAR, NOT NULL)
- `email` (VARCHAR, NOT NULL)
- `phone` (VARCHAR)
- `company` (VARCHAR)
- `message` (TEXT)
- `source` (VARCHAR) - 'website', 'referral', 'social', 'other'
- `status` (VARCHAR) - 'new', 'contacted', 'qualified', 'proposal', 'closed_won', 'closed_lost'
- `priority` (VARCHAR) - 'low', 'medium', 'high'
- `assigned_to` (UUID, FK -> auth.users.id, nullable)
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)
- `closed_at` (TIMESTAMP, nullable)

#### `lead_activities` table
- `id` (UUID, PK)
- `lead_id` (UUID, FK -> leads.id)
- `activity_type` (VARCHAR) - 'created', 'status_changed', 'note_added', 'contacted'
- `description` (TEXT)
- `performed_by` (UUID, FK -> auth.users.id, nullable)
- `created_at` (TIMESTAMP)

## Public APIs

### 1. Create Lead (Public)

**POST** `/api/v1/leads`

Create a new lead from public website enquiry form.

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "+919876543210",
  "company": "Acme Corp",
  "message": "Interested in your services",
  "source": "website"
}
```

**Response:** `201 Created`
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "John Doe",
  "email": "john@example.com",
  "status": "new",
  "created_at": "2024-01-15T10:30:00Z"
}
```

**Rate Limit**: 10 requests per hour per IP

### 2. List Leads (Admin/CMS)

**GET** `/api/v1/leads`

List all leads with filtering and pagination.

**Query Parameters:**
- `status` (optional): Filter by status
- `source` (optional): Filter by source
- `assigned_to` (optional): Filter by assignee
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20)

**Headers:**
```
Authorization: Bearer <admin_token>
```

**Response:** `200 OK`
```json
{
  "items": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "John Doe",
      "email": "john@example.com",
      "status": "new",
      "source": "website",
      "created_at": "2024-01-15T10:30:00Z"
    }
  ],
  "total": 100,
  "page": 1,
  "limit": 20
}
```

### 3. Get Lead Details

**GET** `/api/v1/leads/{lead_id}`

Get detailed lead information including activities.

**Headers:**
```
Authorization: Bearer <admin_token>
```

**Response:** `200 OK`
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "+919876543210",
  "company": "Acme Corp",
  "message": "Interested in your services",
  "source": "website",
  "status": "new",
  "priority": "medium",
  "assigned_to": null,
  "activities": [
    {
      "id": "660e8400-e29b-41d4-a716-446655440000",
      "activity_type": "created",
      "description": "Lead created from website",
      "created_at": "2024-01-15T10:30:00Z"
    }
  ],
  "created_at": "2024-01-15T10:30:00Z",
  "updated_at": "2024-01-15T10:30:00Z"
}
```

### 4. Update Lead Status

**PATCH** `/api/v1/leads/{lead_id}/status`

Update lead status in pipeline.

**Headers:**
```
Authorization: Bearer <admin_token>
```

**Request Body:**
```json
{
  "status": "contacted",
  "notes": "Called customer, interested in proposal"
}
```

**Response:** `200 OK`
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "status": "contacted",
  "updated_at": "2024-01-15T11:00:00Z"
}
```

### 5. Assign Lead

**POST** `/api/v1/leads/{lead_id}/assign`

Assign lead to a team member.

**Headers:**
```
Authorization: Bearer <admin_token>
```

**Request Body:**
```json
{
  "assigned_to": "550e8400-e29b-41d4-a716-446655440000"
}
```

**Response:** `200 OK`

### 6. Add Activity Note

**POST** `/api/v1/leads/{lead_id}/activities`

Add activity note to lead.

**Headers:**
```
Authorization: Bearer <admin_token>
```

**Request Body:**
```json
{
  "activity_type": "note_added",
  "description": "Customer requested pricing information"
}
```

**Response:** `201 Created`

## Events Published

### LeadCreated
Emitted when a new lead is created.

```json
{
  "event_type": "LeadCreated",
  "lead_id": "550e8400-e29b-41d4-a716-446655440000",
  "email": "john@example.com",
  "source": "website",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### LeadStatusChanged
Emitted when lead status changes.

```json
{
  "event_type": "LeadStatusChanged",
  "lead_id": "550e8400-e29b-41d4-a716-446655440000",
  "old_status": "new",
  "new_status": "contacted",
  "timestamp": "2024-01-15T11:00:00Z"
}
```

## Events Consumed

None. Lead service is source of truth for leads.

## Environment Variables

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `DATABASE_URL` | PostgreSQL connection string | Yes | - |
| `REDIS_URL` | Redis connection string (for caching) | Yes | - |
| `LOG_LEVEL` | Logging level | No | `INFO` |
| `NOTIFICATION_SERVICE_URL` | Notification service URL | Yes | - |

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

- Database migrations must run on deployment
- Service should be accessible from public website (via gateway)
- Admin endpoints require authentication

## Health Checks and SLOs

- **Health Endpoint**: `GET /health`
- **Expected Response Time**: < 200ms
- **SLO**: 99.9% uptime

## Runbook

### Common Failures

- Database connection issues: Verify DATABASE_URL
- High lead volume: Monitor database performance, add indexes if needed

## Security Notes

### Authentication Requirements

- Public lead creation endpoint is rate-limited (10/hour per IP)
- All admin endpoints require admin/CMS user authentication
- PII (email, phone) should be handled securely

### Rate Limits

- Lead creation: 10 requests/hour per IP
- Admin endpoints: Standard rate limits apply

### PII Handling

- Lead data contains PII (email, phone, name)
- Ensure GDPR compliance for data retention
- Audit logs track who accessed lead data
