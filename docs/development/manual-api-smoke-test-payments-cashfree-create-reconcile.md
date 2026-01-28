# Payments (Wave 3) — Cashfree Create/Retry/Reconcile Manual Smoke Test

## Prereqs
- Gateway running at `http://localhost:8000`
- `payment-service` migrations applied (including `0004_payment_attempts`)
- Cashfree gateway config set via `/api/v1/payments/admin/gateway-config` (provider=cashfree)
- `INTERNAL_API_KEY` known (default `dev-internal` in compose)

## 1) Create a payment intent (existing internal flow)

For subscription orders, intents are created via subscription-service purchase/renew.

If you need a standalone intent:

```bash
curl -s -X POST "http://localhost:8000/api/v1/payments/internal/intents" \
  -H "Content-Type: application/json" \
  -H "X-Internal-API-Key: dev-internal" \
  -d '{
    "user_id": "<user-uuid>",
    "reference_type": "billing_invoice",
    "reference_id": "<invoice-uuid>",
    "amount": 299,
    "currency": "INR"
  }' | jq
```

Set:

```bash
INTENT_ID="<intent-uuid>"
TOKEN="<subscriber-access-token>"
```

## 2) Create Cashfree gateway order/session

```bash
curl -s -X POST "http://localhost:8000/api/v1/payments/intents/${INTENT_ID}/create-gateway-order" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "idempotency_key": "cashfree:create:'"${INTENT_ID}"'",
    "return_url": "https://example.com/return"
  }' | jq
```

## 3) Retry (only if failed/expired)

```bash
curl -s -X POST "http://localhost:8000/api/v1/payments/intents/${INTENT_ID}/retry" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "idempotency_key": "cashfree:retry:'"${INTENT_ID}"':1"
  }' | jq
```

## 4) Reconcile job (internal/system)

```bash
curl -s -X POST "http://localhost:8000/api/v1/payments/internal/jobs/reconcile-due" \
  -H "X-Internal-API-Key: dev-internal" | jq
```

Expected:
- Pending intents older than `RECONCILE_PENDING_SECONDS` are queried from Cashfree
- If paid:
  - `subscription_order` → subscription-service mark-paid (idempotent)
  - `billing_invoice` → billing-service mark-paid (idempotent)

