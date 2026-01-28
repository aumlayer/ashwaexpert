# Billing (Wave 3) — Credits + Proration Manual Smoke Test

## Prereqs
- Gateway running at `http://localhost:8000`
- `billing-service` migrations applied (including `0003_credits_proration_invoices`)
- `INTERNAL_API_KEY` known (default `dev-internal` in compose)
- A subscriber user + subscriber profile exists

## 1) Add credit to subscriber

```bash
SUBSCRIBER_ID="<subscriber-uuid>"   # subscriber.subscribers.id

curl -s -X POST "http://localhost:8000/api/v1/billing/internal/credits/${SUBSCRIBER_ID}/add" \
  -H "Content-Type: application/json" \
  -H "X-Internal-API-Key: dev-internal" \
  -d '{
    "amount": 250,
    "reason": "manual",
    "reference_type": "admin",
    "reference_id": "support-ticket-123",
    "idempotency_key": "credit:add:support-ticket-123",
    "notes": "Manual goodwill credit"
  }' | jq
```

## 2) Create an invoice (existing flow)

If you have an existing paid subscription order, billing will already generate invoices. Otherwise use existing purchase/renew flows to create an order and invoice.

Get invoices:

```bash
TOKEN="<subscriber-access-token>"
curl -s "http://localhost:8000/api/v1/billing/me/invoices" \
  -H "Authorization: Bearer $TOKEN" | jq
```

Pick:

```bash
INVOICE_ID="<invoice-uuid>"
```

## 3) Apply credits to invoice (partial/full)

```bash
curl -s -X POST "http://localhost:8000/api/v1/billing/internal/credits/${SUBSCRIBER_ID}/apply-to-invoice" \
  -H "Content-Type: application/json" \
  -H "X-Internal-API-Key: dev-internal" \
  -d "{
    \"invoice_id\": \"${INVOICE_ID}\",
    \"amount\": 100,
    \"idempotency_key\": \"credit:apply:${INVOICE_ID}:100\"
  }" | jq
```

Verify invoice:

```bash
curl -s "http://localhost:8000/api/v1/billing/admin/invoices?status=issued&limit=10" \
  -H "Authorization: Bearer <admin-token>" | jq
```

## 4) Check credits balance (subscriber)

```bash
curl -s "http://localhost:8000/api/v1/billing/credits/me" \
  -H "Authorization: Bearer $TOKEN" | jq
```

## 5) Proration estimate/apply (internal)

```bash
SUBSCRIPTION_ID="<subscription-uuid>"

curl -s -X POST "http://localhost:8000/api/v1/billing/internal/proration/estimate" \
  -H "Content-Type: application/json" \
  -H "X-Internal-API-Key: dev-internal" \
  -d "{
    \"subscriber_id\": \"${SUBSCRIBER_ID}\",
    \"subscription_id\": \"${SUBSCRIPTION_ID}\",
    \"from_plan_price\": 499,
    \"to_plan_price\": 799,
    \"current_period_start\": \"2026-01-01T00:00:00Z\",
    \"current_period_end\": \"2026-02-01T00:00:00Z\",
    \"effective_at\": \"2026-01-16T00:00:00Z\",
    \"mode\": \"immediate\",
    \"currency\": \"INR\"
  }" | jq

curl -s -X POST "http://localhost:8000/api/v1/billing/internal/proration/apply" \
  -H "Content-Type: application/json" \
  -H "X-Internal-API-Key: dev-internal" \
  -d "{
    \"subscriber_id\": \"${SUBSCRIBER_ID}\",
    \"subscription_id\": \"${SUBSCRIPTION_ID}\",
    \"from_plan_price\": 499,
    \"to_plan_price\": 799,
    \"current_period_start\": \"2026-01-01T00:00:00Z\",
    \"current_period_end\": \"2026-02-01T00:00:00Z\",
    \"effective_at\": \"2026-01-16T00:00:00Z\",
    \"mode\": \"immediate\",
    \"currency\": \"INR\",
    \"create_invoice_if_positive\": true,
    \"create_credit_if_negative\": true,
    \"idempotency_key\": \"proration:${SUBSCRIPTION_ID}:2026-01-16\"
  }" | jq
```

