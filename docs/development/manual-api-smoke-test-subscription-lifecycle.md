# Subscription Lifecycle - Manual API Smoke Test

This document provides a curl-based smoke test sequence to verify subscription lifecycle features: plan change and cancellation with notice.

## Prerequisites

1. All services running (via docker-compose or local)
2. Database migrations run for subscription-service (0004, 0005, 0006)
3. At least one admin user and one subscriber user created
4. At least one active plan exists
5. Gateway accessible at `http://localhost:8000`

## Test Sequence

### Step 1: Login as Subscriber

```bash
# Get access token
TOKEN=$(curl -s -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "subscriber@example.com", "password": "password123"}' \
  | jq -r '.access_token')

echo "Subscriber token: $TOKEN"
```

### Step 2: Get Current Subscription

```bash
SUBSCRIPTION_RESPONSE=$(curl -s -X GET http://localhost:8000/api/v1/subscriptions/me \
  -H "Authorization: Bearer $TOKEN")

SUBSCRIPTION_ID=$(echo $SUBSCRIPTION_RESPONSE | jq -r '.id')
CURRENT_PLAN_ID=$(echo $SUBSCRIPTION_RESPONSE | jq -r '.plan_id')

echo "Subscription ID: $SUBSCRIPTION_ID"
echo "Current Plan ID: $CURRENT_PLAN_ID"
```

### Step 3: Get Available Plans

```bash
# Get list of plans (public endpoint)
PLANS=$(curl -s -X GET http://localhost:8000/api/v1/plans | jq '.items')

# Pick a different plan ID
NEW_PLAN_ID=$(echo $PLANS | jq -r '.[] | select(.id != "'$CURRENT_PLAN_ID'") | .id' | head -1)

echo "New Plan ID: $NEW_PLAN_ID"
```

### Step 4: Request Plan Change (Subscriber)

```bash
PLAN_CHANGE_RESPONSE=$(curl -s -X POST "http://localhost:8000/api/v1/subscriptions/$SUBSCRIPTION_ID/plan-change" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{
    \"new_plan_id\": \"$NEW_PLAN_ID\",
    \"mode\": \"next_cycle\"
  }")

echo "Plan change requested:"
echo $PLAN_CHANGE_RESPONSE | jq

# Verify request fields
echo $PLAN_CHANGE_RESPONSE | jq '.plan_change_requested_plan_id'
echo $PLAN_CHANGE_RESPONSE | jq '.plan_change_effective_at'
```

### Step 5: View Subscription Events

```bash
EVENTS_RESPONSE=$(curl -s -X GET "http://localhost:8000/api/v1/subscriptions/$SUBSCRIPTION_ID/events" \
  -H "Authorization: Bearer $TOKEN")

echo "Subscription events:"
echo $EVENTS_RESPONSE | jq

# Should see "plan_change_requested" event
echo $EVENTS_RESPONSE | jq '.items[] | select(.event_type == "plan_change_requested")'
```

### Step 6: Login as Admin

```bash
ADMIN_TOKEN=$(curl -s -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@example.com", "password": "password123"}' \
  | jq -r '.access_token')

echo "Admin token: $ADMIN_TOKEN"
```

### Step 7: Apply Plan Change (Admin)

```bash
APPLY_RESPONSE=$(curl -s -X POST "http://localhost:8000/api/v1/subscriptions/$SUBSCRIPTION_ID/plan-change/apply?force=true" \
  -H "Authorization: Bearer $ADMIN_TOKEN")

echo "Plan change applied:"
echo $APPLY_RESPONSE | jq

# Verify plan_id updated
echo $APPLY_RESPONSE | jq '.plan_id'
# Should equal NEW_PLAN_ID

# Verify request fields cleared
echo $APPLY_RESPONSE | jq '.plan_change_requested_plan_id'
# Should be null
```

### Step 8: Verify Events After Apply

```bash
EVENTS_AFTER=$(curl -s -X GET "http://localhost:8000/api/v1/subscriptions/$SUBSCRIPTION_ID/events" \
  -H "Authorization: Bearer $ADMIN_TOKEN")

echo "Events after apply:"
echo $EVENTS_AFTER | jq '.items[] | select(.event_type == "plan_changed")'
```

### Step 9: Request Cancellation (Subscriber)

```bash
CANCEL_RESPONSE=$(curl -s -X POST "http://localhost:8000/api/v1/subscriptions/$SUBSCRIPTION_ID/cancel" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "reason": "Testing cancellation flow",
    "effective_mode": "notice_1_month"
  }')

echo "Cancellation requested:"
echo $CANCEL_RESPONSE | jq

# Verify status changed
echo $CANCEL_RESPONSE | jq '.status'
# Should be "cancellation_requested"

# Verify effective_at computed (1 month from now)
echo $CANCEL_RESPONSE | jq '.cancel_effective_at'
echo $CANCEL_RESPONSE | jq '.cancel_reason'
```

### Step 10: Verify Cancellation Event

```bash
CANCEL_EVENTS=$(curl -s -X GET "http://localhost:8000/api/v1/subscriptions/$SUBSCRIPTION_ID/events" \
  -H "Authorization: Bearer $TOKEN")

echo "Cancellation event:"
echo $CANCEL_EVENTS | jq '.items[] | select(.event_type == "cancellation_requested")'
```

### Step 11: Finalize Cancellation (Internal Endpoint)

```bash
# This would typically be called by a scheduled job
# For testing, call directly (requires internal API key or admin access)
# Note: In production, this should be a cron job

FINALIZE_RESPONSE=$(curl -s -X POST "http://localhost:8000/api/v1/subscriptions/internal/cancellation/finalize-due" \
  -H "X-Internal-API-Key: dev-internal")

echo "Finalized cancellations:"
echo $FINALIZE_RESPONSE | jq

# If subscription's cancel_effective_at <= now, it should be finalized
```

### Step 12: Verify Finalized Cancellation

```bash
FINAL_SUB=$(curl -s -X GET "http://localhost:8000/api/v1/subscriptions/$SUBSCRIPTION_ID" \
  -H "Authorization: Bearer $ADMIN_TOKEN")

echo "Final subscription status:"
echo $FINAL_SUB | jq '.status'
# Should be "cancelled" if effective_at has passed

echo $FINAL_SUB | jq '.cancel_effective_at'
```

### Step 13: View All Events

```bash
ALL_EVENTS=$(curl -s -X GET "http://localhost:8000/api/v1/subscriptions/$SUBSCRIPTION_ID/events?limit=100" \
  -H "Authorization: Bearer $ADMIN_TOKEN")

echo "All subscription events:"
echo $ALL_EVENTS | jq '.items[] | {event_type, created_at, from_plan_id, to_plan_id, from_status, to_status}'
```

## Expected Results

- ✅ Plan change request creates `plan_change_requested_plan_id` and `plan_change_effective_at`
- ✅ Plan change request writes `plan_change_requested` event
- ✅ Admin can apply plan change (updates `plan_id`, clears request fields)
- ✅ Plan change apply writes `plan_changed` event
- ✅ Cancellation request sets status to `cancellation_requested`
- ✅ Cancellation request computes `cancel_effective_at` (1 month from now, or end of cycle if later)
- ✅ Cancellation request writes `cancellation_requested` event
- ✅ Finalize endpoint/job cancels subscriptions where `cancel_effective_at <= now`
- ✅ Finalized cancellation writes `cancelled` event
- ✅ Events endpoint returns ordered history with pagination

## Troubleshooting

- **401 Unauthorized**: Check token is valid
- **403 Forbidden**: Verify user role matches endpoint requirements
- **404 Not Found**: Ensure subscription/plan IDs are correct
- **400 Bad Request**: Check request body (plan change mode, cancellation mode)
- **Plan validation fails**: Ensure plan exists and is active in plan-service

## Notes

- Plan change apply requires admin role (or internal API key)
- Cancellation finalization is typically a scheduled job (cron), but can be triggered manually for testing
- Events are immutable and provide full audit trail
- Outbox events are created for async processing (notifications, reporting)
