# Development Setup Guide

## Prerequisites

- Docker and Docker Compose
- Python 3.11+
- Node.js 18+
- PostgreSQL 14+ (optional, can use Docker)
- Redis 7+ (optional, can use Docker)

## Initial Setup

1. **Clone Repository**
   ```bash
   git clone <repository-url>
   cd ashwaexperts
   ```

2. **Start Infrastructure**
   ```bash
   cd infra/docker-compose
   cp .env.example .env
   # Edit .env with your configuration
   # NOTE: Rotate default credentials before production deployment
   docker-compose up -d
   ```

## Phase 2 (Auth) – Manual API testing

- **Swagger UI (via gateway + Nginx)**: `http://localhost:8080/docs`
- **Consolidated OpenAPI YAML**: `http://localhost:8080/openapi.yaml`

### Static OTP (local dev)

Phase 2 uses a static OTP for local development:
- **OTP code**: `123456`

Suggested flow:
- `POST /api/v1/auth/register`
- `POST /api/v1/auth/otp/verify` (purpose: `registration`)
- `POST /api/v1/auth/otp/request` (purpose: `login`)
- `POST /api/v1/auth/otp/verify` (purpose: `login`) → copy `access_token`
- `GET /api/v1/subscribers/me` with `Authorization: Bearer <access_token>`

Admin/staff (entitlements):
- Set plan limit `limits.number_of_users`, then create staff users under a subscriber tenant:
  - `POST /api/v1/auth/subscribers/{subscriber_id}/staff` (admin)

## Phase 3 (Leads + Content) – Manual API testing

### Leads

- Public lead capture:
  - `POST /api/v1/leads`
- Lead management (requires `cms_user` / `technician` / `admin` token):
  - `GET /api/v1/leads`
  - `PATCH /api/v1/leads/{lead_id}/status`
  - `PATCH /api/v1/leads/{lead_id}/assign` (requires admin or `can_assign_leads=true`; assignee cannot be admin)

### Content (CMS)

- Public:
  - `GET /api/v1/content/case-studies`
  - `GET /api/v1/content/case-studies/{slug}`
- Protected (admin/cms_user):
  - `POST /api/v1/content/case-studies` (creates draft)
  - `POST /api/v1/content/case-studies/{id}/publish`
  - `POST /api/v1/content/case-studies/{id}/unpublish` (back to draft)
  - `PATCH /api/v1/content/case-studies/{id}` (slug immutable after publish)
  - `GET /api/v1/content/manage/case-studies` (list drafts/published/archived)

## Phase 4 (Plans + Subscriptions + Coupons) – Manual API testing

### Plans

- Public:
  - `GET /api/v1/plans`
  - `GET /api/v1/plans/{plan_id}`
- Admin:
  - `POST /api/v1/plans`
  - `PATCH /api/v1/plans/{plan_id}`

### Subscriptions

- Subscriber:
  - `POST /api/v1/subscriptions` (choose `billing_period` and `auto_renew`)
  - `GET /api/v1/subscriptions/me`
  - `POST /api/v1/subscriptions/me/quote` (stack promo + referral discounts; discounts apply before GST; GST slab applied per service type)
  - `POST /api/v1/subscriptions/me/purchase` (creates **pending** order + `payment_intent_id`)
  - `POST /api/v1/subscriptions/me/renew` (creates **pending** renewal order + `payment_intent_id`)
  - `POST /api/v1/payments/webhooks/mock` (local dev) to mark the intent as paid; this triggers subscription-service to redeem codes + apply credits + advance renewals
- Admin:
  - `PATCH /api/v1/subscriptions/{subscription_id}`
  - `GET /api/v1/subscriptions/taxes` (GST slabs)
  - `PUT /api/v1/subscriptions/taxes` (update GST slabs)

### Billing (Invoices)

- Subscriber:
  - `GET /api/v1/billing/me/invoices`
- Admin:
  - `GET /api/v1/billing/admin/invoices`

### Payments (Gateway config + initiate)

- Admin:
  - `GET /api/v1/payments/admin/gateway-config`
  - `PUT /api/v1/payments/admin/gateway-config` (choose `mock` / `cashfree` / `razorpay`)
- Subscriber:
  - `POST /api/v1/payments/me/intents/{intent_id}/initiate` (returns provider payload scaffold)

### Coupons / Discounts / Referrals

- Admin:
  - `POST /api/v1/coupons` (promo coupons like `diwali2026_*`)
  - `GET /api/v1/coupons`
  - `PUT /api/v1/coupons/referrals/program` (set referred % + fixed referrer credit amount)
- Subscriber:
  - `POST /api/v1/coupons/referrals/generate` (creates referral code)

### Tickets (Service Requests)

- Subscriber:
  - `POST /api/v1/tickets` (creates a service ticket; enforces plan limit `service_requests_per_month` if set)
  - `GET /api/v1/tickets/me` (lists current subscriber tickets)

3. **Initialize Database Schemas**
   ```bash
   psql -U ashva -d ashva_db -f ../db-migrations/init-schemas.sql
   ```

4. **Setup Individual Services**
   ```bash
   # For each service
   cd services/{service-name}
   cp config/example.env .env
   # Edit .env
   pip install -r requirements.txt
   alembic upgrade head
   python src/main.py
   ```

## Running Services Locally

Each service can be run independently:

```bash
cd services/{service-name}
./scripts/dev-run.sh
```

## Running Frontend Apps

```bash
# Public website
cd apps/web-public
npm install
npm run dev

# Admin portal
cd apps/web-admin-portal
npm install
npm run dev

# CMS
cd apps/web-cms
npm install
npm run dev
```

## Running Mobile Apps

```bash
# Subscriber app
cd apps/mobile-subscriber
npm install
npm run android  # or ios

# Technician app
cd apps/mobile-technician
npm install
npm run android  # or ios
```

## Testing

```bash
# Service tests
cd services/{service-name}
pytest

# Frontend tests
cd apps/{app-name}
npm test
```

## Development Workflow

1. Make changes to service/app
2. Run tests
3. Check linting
4. Test locally
5. Commit and push
