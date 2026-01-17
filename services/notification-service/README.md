# Notification Service

## Service Overview

**Version**: 1.0.0  
**Technology Stack**: Python FastAPI, PostgreSQL, MSG91 API, SMTP  
**Purpose**: Handles SMS and email notifications via MSG91 and local SMTP, template management, and delivery tracking.

The Notification Service is responsible for sending all notifications including SMS (via MSG91) and emails (via local SMTP), managing templates, and tracking delivery status.

## Responsibilities and Boundaries

### What This Service Owns
- SMS sending via MSG91
- Email sending via SMTP
- Notification template management
- Delivery logs and retry logic
- Template versioning

### What This Service Does NOT Own
- Business event generation (other services)
- User contact information (auth-service, subscriber-service)

## Owned Data and Schema

### Database Schema: `notification`

#### `templates` table
- `id` (UUID, PK)
- `name` (VARCHAR, UNIQUE, NOT NULL) - e.g., "invoice_generated"
- `channel` (VARCHAR, NOT NULL) - 'sms', 'email'
- `subject` (VARCHAR, nullable) - For email
- `body` (TEXT, NOT NULL) - Template with variables
- `variables` (JSONB) - List of required variables
- `version` (INTEGER, NOT NULL, DEFAULT 1)
- `is_active` (BOOLEAN, DEFAULT true)
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

#### `delivery_logs` table
- `id` (UUID, PK)
- `template_id` (UUID, FK -> templates.id, nullable)
- `channel` (VARCHAR, NOT NULL) - 'sms', 'email'
- `recipient` (VARCHAR, NOT NULL) - Phone or email
- `subject` (VARCHAR, nullable)
- `content` (TEXT, NOT NULL)
- `status` (VARCHAR) - 'pending', 'sent', 'delivered', 'failed'
- `external_id` (VARCHAR, nullable) - MSG91 message ID or email ID
- `failure_reason` (TEXT, nullable)
- `retry_count` (INTEGER, DEFAULT 0)
- `sent_at` (TIMESTAMP, nullable)
- `delivered_at` (TIMESTAMP, nullable)
- `created_at` (TIMESTAMP)

## Public APIs

### 1. Send SMS

**POST** `/api/v1/notifications/sms`

Send SMS notification.

**Headers:**
```
Authorization: Bearer <internal_service_token>
```

**Request Body:**
```json
{
  "recipient": "+919876543210",
  "template_name": "invoice_generated",
  "variables": {
    "invoice_number": "FY26-27-INV-000001",
    "amount": "3536.46",
    "due_date": "2024-02-15"
  }
}
```

**Response:** `201 Created`
```json
{
  "id": "130e8400-e29b-41d4-a716-446655440000",
  "status": "sent",
  "external_id": "MSG91_123456",
  "created_at": "2024-02-01T10:30:00Z"
}
```

### 2. Send Email

**POST** `/api/v1/notifications/email`

Send email notification.

**Headers:**
```
Authorization: Bearer <internal_service_token>
```

**Request Body:**
```json
{
  "recipient": "user@example.com",
  "template_name": "invoice_generated",
  "variables": {
    "invoice_number": "FY26-27-INV-000001",
    "amount": "3536.46",
    "due_date": "2024-02-15",
    "subscriber_name": "John Doe"
  }
}
```

**Response:** `201 Created`

### 3. Create/Update Template

**POST** `/api/v1/notifications/templates`

Create a new notification template.

**Headers:**
```
Authorization: Bearer <admin_token>
```

**Request Body:**
```json
{
  "name": "invoice_generated",
  "channel": "email",
  "subject": "Invoice {{invoice_number}} Generated",
  "body": "Dear {{subscriber_name}},\n\nYour invoice {{invoice_number}} for ₹{{amount}} is due on {{due_date}}.",
  "variables": ["invoice_number", "amount", "due_date", "subscriber_name"]
}
```

**Response:** `201 Created`

### 4. Get Template

**GET** `/api/v1/notifications/templates/{template_name}`

Get template details.

**Headers:**
```
Authorization: Bearer <admin_token>
```

**Response:** `200 OK`

### 5. List Templates

**GET** `/api/v1/notifications/templates`

List all templates.

**Headers:**
```
Authorization: Bearer <admin_token>
```

**Query Parameters:**
- `channel` (optional)
- `is_active` (optional)

**Response:** `200 OK`

### 6. Get Delivery Status

**GET** `/api/v1/notifications/deliveries/{delivery_id}`

Get notification delivery status.

**Headers:**
```
Authorization: Bearer <admin_token>
```

**Response:** `200 OK`
```json
{
  "id": "130e8400-e29b-41d4-a716-446655440000",
  "channel": "sms",
  "recipient": "+919876543210",
  "status": "delivered",
  "sent_at": "2024-02-01T10:30:00Z",
  "delivered_at": "2024-02-01T10:30:05Z"
}
```

## Events Published

### NotificationSent
Emitted when notification is successfully sent.

```json
{
  "event_type": "NotificationSent",
  "delivery_id": "130e8400-e29b-41d4-a716-446655440000",
  "channel": "sms",
  "recipient": "+919876543210",
  "template_name": "invoice_generated",
  "timestamp": "2024-02-01T10:30:00Z"
}
```

### NotificationFailed
Emitted when notification delivery fails.

```json
{
  "event_type": "NotificationFailed",
  "delivery_id": "130e8400-e29b-41d4-a716-446655440000",
  "channel": "sms",
  "recipient": "+919876543210",
  "failure_reason": "Invalid phone number",
  "timestamp": "2024-02-01T10:30:00Z"
}
```

## Events Consumed

- **LeadCreated** (from lead-service): Send confirmation SMS/email
- **InvoiceGenerated** (from billing-service): Send invoice notification
- **PaymentSucceeded** (from payment-service): Send payment receipt
- **PaymentFailed** (from payment-service): Send payment failure notification
- **TicketCreated** (from ticket-service): Send ticket confirmation
- **JobAssigned** (from assignment-service): Notify technician
- **SLABreached** (from ticket-service): Send escalation notification
- **SubscriptionCancelled** (from subscription-service): Send cancellation confirmation

## Environment Variables

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `DATABASE_URL` | PostgreSQL connection string | Yes | - |
| `REDIS_URL` | Redis connection string | Yes | - |
| `MSG91_API_KEY` | MSG91 API key | Yes | - |
| `MSG91_SENDER_ID` | MSG91 sender ID | Yes | - |
| `SMTP_HOST` | SMTP server host | Yes | - |
| `SMTP_PORT` | SMTP server port | No | `587` |
| `SMTP_USER` | SMTP username | Yes | - |
| `SMTP_PASSWORD` | SMTP password | Yes | - |
| `SMTP_FROM_EMAIL` | From email address | Yes | - |
| `SMTP_FROM_NAME` | From name | No | `Ashva Experts` |
| `MAX_RETRY_ATTEMPTS` | Maximum retry attempts | No | `3` |
| `RETRY_DELAY_SECONDS` | Delay between retries | No | `60` |
| `LOG_LEVEL` | Logging level | No | `INFO` |

## Local Development

### Setup

1. Install dependencies:
```bash
pip install -r requirements.txt
```

2. Configure MSG91 and SMTP credentials in `.env`

3. Run service:
```bash
python src/main.py
```

## Deployment Notes

- SMS and email credentials must be securely stored
- Retry logic for failed notifications
- Rate limiting for SMS (MSG91 limits)
- Template versioning for auditability

## Health Checks and SLOs

- **Health Endpoint**: `GET /health`
- **Expected Response Time**: < 500ms (async sending)
- **SLO**: 99.9% uptime
- **Delivery Rate**: > 95% success rate

## Runbook

### Common Failures

#### SMS Sending Fails

**Recovery**: 
- Check MSG91 API key and balance
- Verify phone number format
- Check MSG91 service status

#### Email Sending Fails

**Recovery**:
- Verify SMTP credentials
- Check SMTP server connectivity
- Review email server logs

#### Template Not Found

**Recovery**: Create missing template or use default

## Security Notes

### Authentication Requirements

- All endpoints require authentication
- Internal service endpoints use service tokens
- Admin endpoints require admin role

### Rate Limits

- SMS: Respect MSG91 rate limits
- Email: 100 emails/minute per SMTP server limits

### PII Handling

- Contains phone numbers and email addresses
- Notification content may contain sensitive data
- Delivery logs must be secured
- Ensure GDPR compliance for notification preferences

### Additional Security

- Template injection prevention (validate variables)
- Phone number and email validation
- Secure storage of SMTP credentials
- Audit all notification sends
