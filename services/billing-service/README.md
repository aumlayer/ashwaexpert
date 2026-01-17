# Billing Service

## Service Overview

**Version**: 1.0.0  
**Technology Stack**: Python FastAPI, PostgreSQL  
**Purpose**: Handles invoice generation, proration calculations, GST invoicing, invoice numbering, and credit ledger management.

The Billing Service is responsible for all billing operations including invoice generation with proration, GST compliance, invoice numbering, and managing subscriber credit ledgers for advance payments.

## Responsibilities and Boundaries

### What This Service Owns
- Invoice generation and management
- Proration calculations (daily proration, plan changes, pauses)
- GST invoice numbering (FY26-27-INV-000001 format)
- Invoice PDF generation triggers (via media-service)
- Credit ledger for advance payments
- Invoice line items
- Invoice sequences

### What This Service Does NOT Own
- Payment processing (payment-service)
- Subscription lifecycle (subscription-service)
- Plan definitions (plan-service)
- PDF generation (media-service)

## Owned Data and Schema

### Database Schema: `billing`

#### `invoices` table
- `id` (UUID, PK)
- `invoice_number` (VARCHAR, UNIQUE, NOT NULL) - e.g., "FY26-27-INV-000001"
- `subscriber_id` (UUID, FK -> subscriber.subscribers.id, NOT NULL)
- `subscription_id` (UUID, FK -> subscription.subscriptions.id, NOT NULL)
- `invoice_date` (DATE, NOT NULL)
- `due_date` (DATE, NOT NULL)
- `status` (VARCHAR) - 'draft', 'issued', 'paid', 'overdue', 'cancelled'
- `subtotal` (DECIMAL(10,2), NOT NULL)
- `tax_amount` (DECIMAL(10,2), NOT NULL) - GST
- `total_amount` (DECIMAL(10,2), NOT NULL)
- `paid_amount` (DECIMAL(10,2), DEFAULT 0)
- `credit_applied` (DECIMAL(10,2), DEFAULT 0)
- `pdf_url` (VARCHAR, nullable)
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)
- `paid_at` (TIMESTAMP, nullable)

#### `invoice_line_items` table
- `id` (UUID, PK)
- `invoice_id` (UUID, FK -> invoices.id)
- `description` (VARCHAR, NOT NULL)
- `quantity` (DECIMAL(10,2), DEFAULT 1)
- `unit_price` (DECIMAL(10,2), NOT NULL)
- `amount` (DECIMAL(10,2), NOT NULL)
- `is_prorated` (BOOLEAN, DEFAULT false)
- `proration_details` (JSONB, nullable)
- `created_at` (TIMESTAMP)

#### `credit_ledger` table
- `id` (UUID, PK)
- `subscriber_id` (UUID, FK -> subscriber.subscribers.id, NOT NULL)
- `transaction_type` (VARCHAR) - 'credit', 'debit', 'applied'
- `amount` (DECIMAL(10,2), NOT NULL)
- `invoice_id` (UUID, FK -> invoices.id, nullable)
- `description` (TEXT)
- `balance_after` (DECIMAL(10,2), NOT NULL)
- `created_at` (TIMESTAMP)

#### `invoice_sequences` table
- `id` (UUID, PK)
- `financial_year` (VARCHAR, UNIQUE, NOT NULL) - e.g., "FY26-27"
- `last_number` (INTEGER, NOT NULL, DEFAULT 0)
- `updated_at` (TIMESTAMP)

## Public APIs

### 1. Generate Invoice

**POST** `/api/v1/billing/invoices/generate`

Generate invoice for a subscription period.

**Headers:**
```
Authorization: Bearer <admin_token>
```

**Request Body:**
```json
{
  "subscription_id": "660e8400-e29b-41d4-a716-446655440000",
  "invoice_date": "2024-02-01",
  "due_date": "2024-02-15",
  "apply_credit": true
}
```

**Response:** `201 Created`
```json
{
  "id": "990e8400-e29b-41d4-a716-446655440000",
  "invoice_number": "FY26-27-INV-000001",
  "subscriber_id": "770e8400-e29b-41d4-a716-446655440000",
  "subscription_id": "660e8400-e29b-41d4-a716-446655440000",
  "status": "issued",
  "subtotal": 2997.00,
  "tax_amount": 539.46,
  "total_amount": 3536.46,
  "credit_applied": 0.00,
  "due_date": "2024-02-15"
}
```

### 2. Get My Invoices

**GET** `/api/v1/billing/invoices/me`

Get current subscriber's invoices.

**Headers:**
```
Authorization: Bearer <subscriber_token>
```

**Query Parameters:**
- `status` (optional)
- `page` (optional)
- `limit` (optional)

**Response:** `200 OK`

### 3. Get Invoice Details

**GET** `/api/v1/billing/invoices/{invoice_id}`

Get detailed invoice with line items.

**Headers:**
```
Authorization: Bearer <subscriber_token or admin_token>
```

**Response:** `200 OK`
```json
{
  "id": "990e8400-e29b-41d4-a716-446655440000",
  "invoice_number": "FY26-27-INV-000001",
  "invoice_date": "2024-02-01",
  "due_date": "2024-02-15",
  "status": "paid",
  "line_items": [
    {
      "description": "Basic Plan - 3 months",
      "quantity": 1,
      "unit_price": 2997.00,
      "amount": 2997.00,
      "is_prorated": false
    }
  ],
  "subtotal": 2997.00,
  "tax_amount": 539.46,
  "total_amount": 3536.46,
  "paid_amount": 3536.46,
  "pdf_url": "https://...",
  "paid_at": "2024-02-01T10:30:00Z"
}
```

### 4. Calculate Proration

**POST** `/api/v1/billing/proration/calculate`

Calculate proration for plan change or mid-cycle start.

**Headers:**
```
Authorization: Bearer <admin_token>
```

**Request Body:**
```json
{
  "subscription_id": "660e8400-e29b-41d4-a716-446655440000",
  "old_plan_id": "550e8400-e29b-41d4-a716-446655440000",
  "new_plan_id": "880e8400-e29b-41d4-a716-446655440000",
  "effective_date": "2024-02-15",
  "billing_cycle_start": "2024-02-01",
  "billing_cycle_end": "2024-05-01"
}
```

**Response:** `200 OK`
```json
{
  "prorated_amount": 666.67,
  "days_remaining": 45,
  "total_days": 90,
  "old_plan_daily_rate": 33.30,
  "new_plan_daily_rate": 166.63,
  "credit_amount": 1498.50,
  "charge_amount": 2165.17
}
```

### 5. Add Credit

**POST** `/api/v1/billing/credits`

Add credit to subscriber's ledger (for advance payments).

**Headers:**
```
Authorization: Bearer <admin_token>
```

**Request Body:**
```json
{
  "subscriber_id": "770e8400-e29b-41d4-a716-446655440000",
  "amount": 5000.00,
  "description": "Advance payment"
}
```

**Response:** `201 Created`

### 6. Get Credit Balance

**GET** `/api/v1/billing/credits/me`

Get current subscriber's credit balance.

**Headers:**
```
Authorization: Bearer <subscriber_token>
```

**Response:** `200 OK`
```json
{
  "balance": 5000.00,
  "transactions": [
    {
      "transaction_type": "credit",
      "amount": 5000.00,
      "description": "Advance payment",
      "created_at": "2024-01-15T10:30:00Z"
    }
  ]
}
```

### 7. Mark Invoice Paid

**POST** `/api/v1/billing/invoices/{invoice_id}/mark-paid`

Mark invoice as paid (called by payment-service).

**Headers:**
```
Authorization: Bearer <internal_service_token>
```

**Request Body:**
```json
{
  "paid_amount": 3536.46,
  "paid_at": "2024-02-01T10:30:00Z",
  "payment_id": "aa0e8400-e29b-41d4-a716-446655440000"
}
```

**Response:** `200 OK`

### 8. Generate Invoice PDF

**POST** `/api/v1/billing/invoices/{invoice_id}/generate-pdf`

Trigger PDF generation for invoice.

**Headers:**
```
Authorization: Bearer <admin_token>
```

**Response:** `200 OK`
```json
{
  "pdf_url": "https://minio.example.com/invoices/FY26-27-INV-000001.pdf"
}
```

## Events Published

### InvoiceGenerated
Emitted when a new invoice is generated.

```json
{
  "event_type": "InvoiceGenerated",
  "invoice_id": "990e8400-e29b-41d4-a716-446655440000",
  "invoice_number": "FY26-27-INV-000001",
  "subscriber_id": "770e8400-e29b-41d4-a716-446655440000",
  "subscription_id": "660e8400-e29b-41d4-a716-446655440000",
  "total_amount": 3536.46,
  "due_date": "2024-02-15",
  "timestamp": "2024-02-01T10:30:00Z"
}
```

### InvoicePaid
Emitted when invoice is marked as paid.

```json
{
  "event_type": "InvoicePaid",
  "invoice_id": "990e8400-e29b-41d4-a716-446655440000",
  "invoice_number": "FY26-27-INV-000001",
  "subscriber_id": "770e8400-e29b-41d4-a716-446655440000",
  "paid_amount": 3536.46,
  "timestamp": "2024-02-01T10:30:00Z"
}
```

### InvoiceOverdue
Emitted when invoice becomes overdue.

```json
{
  "event_type": "InvoiceOverdue",
  "invoice_id": "990e8400-e29b-41d4-a716-446655440000",
  "invoice_number": "FY26-27-INV-000001",
  "subscriber_id": "770e8400-e29b-41d4-a716-446655440000",
  "due_date": "2024-02-15",
  "timestamp": "2024-02-16T00:00:00Z"
}
```

## Events Consumed

- **SubscriptionCreated** (from subscription-service): Generate initial invoice
- **SubscriptionChanged** (from subscription-service): Generate prorated invoice
- **PaymentSucceeded** (from payment-service): Mark invoice as paid
- **SubscriptionPaused** (from subscription-service): Handle proration for pause period

## Environment Variables

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `DATABASE_URL` | PostgreSQL connection string | Yes | - |
| `REDIS_URL` | Redis connection string | Yes | - |
| `GST_RATE` | GST rate percentage | No | `18.0` |
| `INVOICE_PREFIX` | Invoice number prefix | No | `FY26-27-INV-` |
| `MEDIA_SERVICE_URL` | Media service URL for PDF generation | Yes | - |
| `SUBSCRIPTION_SERVICE_URL` | Subscription service URL | Yes | - |
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

- Invoice numbering is sequential and must be thread-safe
- Proration calculations must be accurate (daily basis)
- GST compliance is critical
- PDF generation is async (via media-service)

## Health Checks and SLOs

- **Health Endpoint**: `GET /health`
- **Expected Response Time**: < 500ms (invoice generation may take longer)
- **SLO**: 99.9% uptime

## Runbook

### Common Failures

- Invoice numbering conflicts: Use database-level locking
- Proration calculation errors: Validate all date ranges
- PDF generation failures: Retry mechanism required

## Security Notes

### Authentication Requirements

- All endpoints require authentication
- Subscribers can only access their own invoices
- Admin endpoints require admin role
- Payment service uses internal service token

### Rate Limits

- Standard rate limits apply

### PII Handling

- Contains financial data and subscriber information
- Invoice PDFs contain sensitive data
- Ensure secure storage and access controls
