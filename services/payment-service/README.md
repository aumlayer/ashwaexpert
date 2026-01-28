# Payment Service

## Service Overview

**Version**: 1.0.0  
**Technology Stack**: Python FastAPI, PostgreSQL  
**Purpose**: Handles payment processing via Cashfree gateway, webhook handling, payment reconciliation, and offline payment entry.

The Payment Service orchestrates all payment operations including Cashfree integration, webhook processing, payment status tracking, and supports offline payment entry for manual reconciliation.

## Responsibilities and Boundaries

### What This Service Owns
- Payment order creation (Cashfree)
- Payment status tracking
- Webhook event processing and validation
- Payment reconciliation
- Offline payment entry
- Payment retry logic

### What This Service Does NOT Own
- Invoice generation (billing-service)
- Subscription management (subscription-service)
- Notification sending (notification-service)

## Owned Data and Schema

### Database Schema: `payment`

#### `payments` table
- `id` (UUID, PK)
- `invoice_id` (UUID, FK -> billing.invoices.id, NOT NULL)
- `subscriber_id` (UUID, FK -> subscriber.subscribers.id, NOT NULL)
- `amount` (DECIMAL(10,2), NOT NULL)
- `currency` (VARCHAR, DEFAULT 'INR')
- `status` (VARCHAR) - 'created', 'pending', 'success', 'failed', 'cancelled', 'refunded'
- `payment_method` (VARCHAR) - 'upi', 'card', 'netbanking', 'offline'
- `cashfree_order_id` (VARCHAR, nullable)
- `cashfree_payment_id` (VARCHAR, nullable)
- `failure_reason` (TEXT, nullable)
- `idempotency_key` (VARCHAR, UNIQUE, nullable)
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)
- `completed_at` (TIMESTAMP, nullable)

#### `payment_orders` table
- `id` (UUID, PK)
- `payment_id` (UUID, FK -> payments.id)
- `cashfree_order_id` (VARCHAR, UNIQUE, NOT NULL)
- `order_amount` (DECIMAL(10,2), NOT NULL)
- `order_currency` (VARCHAR, DEFAULT 'INR')
- `order_status` (VARCHAR)
- `payment_session_id` (VARCHAR, nullable)
- `payment_url` (VARCHAR, nullable)
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

#### `payment_webhook_events` table
- `id` (UUID, PK)
- `event_id` (VARCHAR, UNIQUE, NOT NULL) - Cashfree event ID
- `event_type` (VARCHAR, NOT NULL)
- `payment_id` (UUID, FK -> payments.id, nullable)
- `raw_payload` (JSONB, NOT NULL)
- `is_processed` (BOOLEAN, DEFAULT false)
- `processed_at` (TIMESTAMP, nullable)
- `created_at` (TIMESTAMP)

#### `offline_payments` table
- `id` (UUID, PK)
- `invoice_id` (UUID, FK -> billing.invoices.id, NOT NULL)
- `subscriber_id` (UUID, FK -> subscriber.subscribers.id, NOT NULL)
- `amount` (DECIMAL(10,2), NOT NULL)
- `payment_method` (VARCHAR) - 'cash', 'cheque', 'bank_transfer', 'other'
- `reference_number` (VARCHAR)
- `payment_date` (DATE, NOT NULL)
- `notes` (TEXT)
- `entered_by` (UUID, FK -> auth.users.id, NOT NULL)
- `status` (VARCHAR) - 'pending', 'verified', 'rejected'
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

## Public APIs

### 1. Create Payment

**POST** `/api/v1/payments`

Create a payment order for an invoice.

**Headers:**
```
Authorization: Bearer <subscriber_token>
Idempotency-Key: <unique_key>
```

**Request Body:**
```json
{
  "invoice_id": "990e8400-e29b-41d4-a716-446655440000",
  "payment_method": "upi",
  "return_url": "https://app.example.com/payment/callback"
}
```

**Response:** `201 Created`
```json
{
  "id": "aa0e8400-e29b-41d4-a716-446655440000",
  "invoice_id": "990e8400-e29b-41d4-a716-446655440000",
  "amount": 3536.46,
  "status": "pending",
  "payment_url": "https://payments.cashfree.com/...",
  "payment_session_id": "session_xxx"
}
```

### 2. Get Payment Status

**GET** `/api/v1/payments/{payment_id}`

## Testing

### Pytest (unit tests, no Postgres required)

```bash
cd services/payment-service
python3 -m pip install -r requirements.txt
python3 -m pytest -q
```

### Test env defaults

Unit tests set safe defaults in `tests/conftest.py` to avoid import-time failures:
- `DATABASE_URL`: dummy local Postgres URL (engine is created but **no connections are made** for unit tests)
- `INTERNAL_API_KEY`: `dev-internal`
- `ENVIRONMENT`: `test`
- `LOG_LEVEL`: `WARNING`

### External calls

Tests must not hit real external services (Cashfree). Current unit tests only validate helper behavior and do not perform HTTP.

Get payment status and details.

**Headers:**
```
Authorization: Bearer <subscriber_token or admin_token>
```

**Response:** `200 OK`
```json
{
  "id": "aa0e8400-e29b-41d4-a716-446655440000",
  "invoice_id": "990e8400-e29b-41d4-a716-446655440000",
  "amount": 3536.46,
  "status": "success",
  "payment_method": "upi",
  "cashfree_order_id": "order_xxx",
  "completed_at": "2024-02-01T10:35:00Z"
}
```

### 3. Get My Payments

**GET** `/api/v1/payments/me`

Get current subscriber's payment history.

**Headers:**
```
Authorization: Bearer <subscriber_token>
```

**Query Parameters:**
- `status` (optional)
- `page` (optional)
- `limit` (optional)

**Response:** `200 OK`

### 4. Cashfree Webhook

**POST** `/api/v1/payments/webhooks/cashfree`

Receive webhook events from Cashfree.

**Headers:**
```
x-cf-signature: <signature>
```

**Request Body:** (Cashfree webhook payload)
```json
{
  "type": "PAYMENT_SUCCESS_WEBHOOK",
  "data": {
    "order": {
      "orderId": "order_xxx",
      "orderAmount": 3536.46,
      "orderStatus": "PAID"
    },
    "payment": {
      "paymentId": "payment_xxx",
      "paymentStatus": "SUCCESS"
    }
  }
}
```

**Response:** `200 OK`

**Note**: Must validate signature and enforce idempotency

### 5. Enter Offline Payment

**POST** `/api/v1/payments/offline`

Enter an offline payment manually.

**Headers:**
```
Authorization: Bearer <admin_token>
```

**Request Body:**
```json
{
  "invoice_id": "990e8400-e29b-41d4-a716-446655440000",
  "amount": 3536.46,
  "payment_method": "bank_transfer",
  "reference_number": "TXN123456",
  "payment_date": "2024-02-01",
  "notes": "NEFT transfer"
}
```

**Response:** `201 Created`

### 6. Verify Offline Payment

**POST** `/api/v1/payments/offline/{offline_payment_id}/verify`

Verify an offline payment entry.

**Headers:**
```
Authorization: Bearer <admin_token>
```

**Request Body:**
```json
{
  "status": "verified",
  "notes": "Payment confirmed in bank statement"
}
```

**Response:** `200 OK`

### 7. Retry Payment

**POST** `/api/v1/payments/{payment_id}/retry`

Retry a failed payment.

**Headers:**
```
Authorization: Bearer <subscriber_token>
Idempotency-Key: <unique_key>
```

**Response:** `200 OK`

## Events Published

### PaymentSucceeded
Emitted when payment is successfully completed.

```json
{
  "event_type": "PaymentSucceeded",
  "payment_id": "aa0e8400-e29b-41d4-a716-446655440000",
  "invoice_id": "990e8400-e29b-41d4-a716-446655440000",
  "subscriber_id": "770e8400-e29b-41d4-a716-446655440000",
  "amount": 3536.46,
  "payment_method": "upi",
  "timestamp": "2024-02-01T10:35:00Z"
}
```

### PaymentFailed
Emitted when payment fails.

```json
{
  "event_type": "PaymentFailed",
  "payment_id": "aa0e8400-e29b-41d4-a716-446655440000",
  "invoice_id": "990e8400-e29b-41d4-a716-446655440000",
  "failure_reason": "Insufficient funds",
  "timestamp": "2024-02-01T10:35:00Z"
}
```

## Events Consumed

- **InvoiceGenerated** (from billing-service): Notify subscriber about new invoice

## Environment Variables

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `DATABASE_URL` | PostgreSQL connection string | Yes | - |
| `REDIS_URL` | Redis connection string | Yes | - |
| `CASHFREE_APP_ID` | Cashfree App ID | Yes | - |
| `CASHFREE_SECRET_KEY` | Cashfree Secret Key | Yes | - |
| `CASHFREE_API_URL` | Cashfree API base URL | Yes | - |
| `CASHFREE_WEBHOOK_SECRET` | Webhook signature secret | Yes | - |
| `BILLING_SERVICE_URL` | Billing service URL | Yes | - |
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

3. Configure Cashfree test credentials in `.env`

4. Run service:
```bash
python src/main.py
```

## Deployment Notes

- Webhook endpoint must be publicly accessible
- Webhook signature validation is critical
- Idempotency must be enforced for all payment operations
- Payment retry logic should have exponential backoff

## Health Checks and SLOs

- **Health Endpoint**: `GET /health`
- **Expected Response Time**: < 500ms
- **SLO**: 99.9% uptime
- **Webhook Processing**: < 2 seconds

## Runbook

### Common Failures

#### Webhook Signature Validation Fails

**Recovery**: Verify CASHFREE_WEBHOOK_SECRET matches Cashfree dashboard

#### Payment Status Mismatch

**Recovery**: Reconcile with Cashfree API, update payment status

#### Duplicate Webhook Events

**Recovery**: Check idempotency handling, verify event_id uniqueness

## Security Notes

### Authentication Requirements

- Payment creation requires subscriber authentication
- Webhook endpoint validates signature (no auth token)
- Admin endpoints require admin role
- Offline payment entry requires admin authentication

### Rate Limits

- Payment creation: 10 requests/minute per subscriber
- Webhook endpoint: No rate limit (Cashfree controlled)

### PII Handling

- Contains financial transaction data
- Payment methods and reference numbers are sensitive
- Ensure PCI compliance for card data (handled by Cashfree)
- Webhook payloads contain sensitive data - log carefully

### Additional Security

- Webhook signature validation is mandatory
- Idempotency keys prevent duplicate payments
- All payment operations must be logged for audit
- Offline payments require manual verification
