# Subscriber Service

## Service Overview

**Version**: 1.0.0  
**Technology Stack**: Python FastAPI, PostgreSQL  
**Purpose**: Manages subscriber profiles, contact information, and addresses.

The Subscriber Service is responsible for all subscriber-related data including profiles, contact details, and address management.

## Responsibilities and Boundaries

### What This Service Owns
- Subscriber profile information
- Contact details (email, phone)
- Address management (billing, service addresses)
- Subscriber preferences

### What This Service Does NOT Own
- Authentication (auth-service)
- Subscriptions (subscription-service)
- Billing (billing-service)
- Payments (payment-service)

## Owned Data and Schema

### Database Schema: `subscriber`

#### `subscribers` table
- `id` (UUID, PK)
- `user_id` (UUID, FK -> auth.users.id, UNIQUE)
- `first_name` (VARCHAR, NOT NULL)
- `last_name` (VARCHAR, NOT NULL)
- `email` (VARCHAR, NOT NULL)
- `phone` (VARCHAR)
- `company_name` (VARCHAR)
- `gst_number` (VARCHAR)
- `pan_number` (VARCHAR)
- `is_active` (BOOLEAN, DEFAULT true)
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

#### `subscriber_addresses` table
- `id` (UUID, PK)
- `subscriber_id` (UUID, FK -> subscribers.id)
- `address_type` (VARCHAR) - 'billing', 'service', 'both'
- `address_line1` (VARCHAR, NOT NULL)
- `address_line2` (VARCHAR)
- `city` (VARCHAR, NOT NULL)
- `state` (VARCHAR, NOT NULL)
- `postal_code` (VARCHAR, NOT NULL)
- `country` (VARCHAR, DEFAULT 'India')
- `is_default` (BOOLEAN, DEFAULT false)
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

## Public APIs

### 1. Get Subscriber Profile

**GET** `/api/v1/subscribers/me`

Get current subscriber's profile.

**Headers:**
```
Authorization: Bearer <subscriber_token>
```

**Response:** `200 OK`
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "user_id": "660e8400-e29b-41d4-a716-446655440000",
  "first_name": "John",
  "last_name": "Doe",
  "email": "john@example.com",
  "phone": "+919876543210",
  "company_name": "Acme Corp",
  "gst_number": "27ABCDE1234F1Z5",
  "addresses": [
    {
      "id": "770e8400-e29b-41d4-a716-446655440000",
      "address_type": "billing",
      "address_line1": "123 Main St",
      "city": "Mumbai",
      "state": "Maharashtra",
      "postal_code": "400001",
      "is_default": true
    }
  ],
  "created_at": "2024-01-15T10:30:00Z"
}
```

### 2. Update Subscriber Profile

**PUT** `/api/v1/subscribers/me`

Update subscriber profile.

**Headers:**
```
Authorization: Bearer <subscriber_token>
```

**Request Body:**
```json
{
  "first_name": "John",
  "last_name": "Doe",
  "phone": "+919876543210",
  "company_name": "Acme Corp",
  "gst_number": "27ABCDE1234F1Z5"
}
```

**Response:** `200 OK`

### 3. Add Address

**POST** `/api/v1/subscribers/me/addresses`

Add a new address.

**Headers:**
```
Authorization: Bearer <subscriber_token>
```

**Request Body:**
```json
{
  "address_type": "billing",
  "address_line1": "123 Main St",
  "address_line2": "Suite 100",
  "city": "Mumbai",
  "state": "Maharashtra",
  "postal_code": "400001",
  "country": "India",
  "is_default": true
}
```

**Response:** `201 Created`

### 4. Update Address

**PUT** `/api/v1/subscribers/me/addresses/{address_id}`

Update an address.

**Headers:**
```
Authorization: Bearer <subscriber_token>
```

**Response:** `200 OK`

### 5. Delete Address

**DELETE** `/api/v1/subscribers/me/addresses/{address_id}`

Delete an address.

**Headers:**
```
Authorization: Bearer <subscriber_token>
```

**Response:** `204 No Content`

### 6. Get Subscriber by ID (Admin)

**GET** `/api/v1/subscribers/{subscriber_id}`

Get subscriber details (admin only).

**Headers:**
```
Authorization: Bearer <admin_token>
```

**Response:** `200 OK`

### 7. List Subscribers (Admin)

**GET** `/api/v1/subscribers`

List all subscribers with pagination.

**Headers:**
```
Authorization: Bearer <admin_token>
```

**Query Parameters:**
- `page` (optional)
- `limit` (optional)
- `search` (optional): Search by name/email

**Response:** `200 OK`

## Events Published

### SubscriberCreated
Emitted when a new subscriber profile is created.

```json
{
  "event_type": "SubscriberCreated",
  "subscriber_id": "550e8400-e29b-41d4-a716-446655440000",
  "user_id": "660e8400-e29b-41d4-a716-446655440000",
  "email": "john@example.com",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### SubscriberUpdated
Emitted when subscriber profile is updated.

```json
{
  "event_type": "SubscriberUpdated",
  "subscriber_id": "550e8400-e29b-41d4-a716-446655440000",
  "timestamp": "2024-01-15T11:00:00Z"
}
```

## Events Consumed

- **UserCreated** (from auth-service): Create subscriber profile when user registers with subscriber role

## Environment Variables

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `DATABASE_URL` | PostgreSQL connection string | Yes | - |
| `REDIS_URL` | Redis connection string | Yes | - |
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

- Database migrations required
- Service listens for UserCreated events from auth-service
- GST number validation should be implemented

## Health Checks and SLOs

- **Health Endpoint**: `GET /health`
- **Expected Response Time**: < 200ms
- **SLO**: 99.9% uptime

## Runbook

### Common Failures

- Database connection: Verify DATABASE_URL
- Event consumption failures: Check message broker connectivity

## Security Notes

### Authentication Requirements

- All endpoints require authentication
- Subscribers can only access their own data
- Admin endpoints require admin role

### Rate Limits

- Standard rate limits apply

### PII Handling

- Contains sensitive PII (name, email, phone, GST, PAN)
- Ensure encryption at rest
- Audit all access to subscriber data
- GDPR compliance for data retention
