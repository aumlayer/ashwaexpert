# Phase 4: Subscription Lifecycle - Implementation Summary

## Overview

Subscription lifecycle features implemented. Business operations can be executed purely via API: plan changes, cancellation with notice, full event history, and auditability.

## Services Modified

### 1. Subscription Service (`services/subscription-service`)

**New/Enhanced Endpoints:**
- `POST /api/v1/subscriptions/{subscription_id}/plan-change` - Request plan change (subscriber: own, admin: any)
- `POST /api/v1/subscriptions/{subscription_id}/plan-change/apply` - Apply plan change (admin only)
- `POST /api/v1/subscriptions/{subscription_id}/cancel` - Request cancellation with notice (subscriber: own, admin: any)
- `POST /api/v1/subscriptions/internal/cancellation/finalize-due` - Internal endpoint to finalize due cancellations
- `GET /api/v1/subscriptions/{subscription_id}/events` - List subscription event history (subscriber: own, admin: any)

**Database Changes (Migrations 0004, 0005, 0006):**

**Migration 0004 - Lifecycle Fields:**
- Added to `subscriptions`:
  - `cancel_requested_at` (timestamp, nullable)
  - `cancel_effective_at` (timestamp, nullable, indexed)
  - `cancel_reason` (text, nullable)
  - `plan_change_requested_plan_id` (UUID, nullable)
  - `plan_change_requested_at` (timestamp, nullable)
  - `plan_change_effective_at` (timestamp, nullable, indexed)
  - `plan_change_mode` (string, default "next_cycle") - immediate | next_cycle
  - `last_billed_invoice_id` (UUID, nullable)
- Ensured `plan_id` is indexed

**Migration 0005 - Subscription Events:**
- Created `subscription_events` table:
  - `id`, `subscription_id` (indexed), `event_type` (indexed)
  - `actor_user_id`, `actor_role`
  - `from_status`, `to_status`
  - `from_plan_id`, `to_plan_id`
  - `payload` (JSONB)
  - `created_at` (indexed)

**Migration 0006 - Subscription Outbox:**
- Created `subscription_outbox` table:
  - `id`, `topic` (indexed), `event_name` (indexed)
  - `payload` (JSONB)
  - `status` (pending|sent|failed, indexed)
  - `created_at` (indexed)
  - `last_attempt_at`, `attempt_count`

**Status Enum Extended:**
- Now supports: `active`, `cancelled`, `paused`, `cancellation_requested`, `past_due`, `expired`

**Event Types:**
- `created`, `renewed`, `payment_marked`, `plan_change_requested`, `plan_changed`, `cancellation_requested`, `cancelled`, `reactivated`, `status_changed`

**Models Added:**
- `SubscriptionEvent` - Immutable event log
- `SubscriptionOutbox` - Lightweight outbox for async processing (no message broker)

**Key Features:**

1. **Plan Change:**
   - Request: Subscriber/admin can request plan change with mode (immediate/next_cycle)
   - Effective date computed: immediate = now, next_cycle = current_period_end
   - Apply: Admin applies pending request (with force option to bypass effective date)
   - Proration hook: Records in outbox if billing-service proration endpoint not available
   - Events: `plan_change_requested`, `plan_changed`

2. **Cancellation with Notice:**
   - Request: Subscriber/admin can request cancellation
   - Effective modes:
     - `notice_1_month`: cancel_effective_at = max(now + 1 calendar month, current_period_end)
     - `end_of_cycle`: cancel_effective_at = current_period_end
   - Status: Immediately set to `cancellation_requested`
   - Finalization: Internal endpoint/job finds subscriptions where `cancel_effective_at <= now` and sets status to `cancelled`
   - Events: `cancellation_requested`, `cancelled`

3. **Event History:**
   - Every lifecycle action writes to `subscription_events`
   - Includes actor (user_id, role), status transitions, plan changes, payload
   - Paginated list endpoint with RBAC

4. **Outbox Pattern:**
   - Lightweight outbox for best-effort async processing
   - Topics: `SubscriptionLifecycle`
   - Event names: `SubscriptionPlanChangeRequested`, `SubscriptionPlanChanged`, `SubscriptionProrationPending`, `SubscriptionCancellationRequested`, `SubscriptionCancelled`
   - Status tracking: pending → sent/failed

### 2. Notification Service (`services/notification-service`)

**New Templates Added:**
- `subscription_plan_change_requested` - SMS + Email
- `subscription_plan_changed` - SMS + Email
- `subscription_cancellation_requested` - SMS + Email
- `subscription_cancelled` - SMS + Email

**Wiring:**
- Subscription-service calls notification-service on lifecycle events (best-effort)
- Failures logged but don't break core transactions

### 3. Gateway Service (`services/gateway-service`)

**New RBAC Rules:**
- `/api/v1/subscriptions/{id}/plan-change`: subscriber (own), admin (any)
- `/api/v1/subscriptions/{id}/plan-change/apply`: admin only
- `/api/v1/subscriptions/{id}/cancel`: subscriber (own), admin (any)
- `/api/v1/subscriptions/{id}/events`: subscriber (own), admin (any)
- `/api/v1/subscriptions/internal/*`: blocked externally

### 4. Billing Service (`services/billing-service`)

**Proration Hook:**
- Subscription-service attempts to call `/api/v1/billing/internal/proration/invoice` (if exists)
- If endpoint not available or call fails, proration data recorded in outbox for Wave 3 implementation
- Non-blocking: core plan change transaction succeeds even if proration fails

## API Flow Examples

### Plan Change Flow

1. **Subscriber requests plan change:**
   ```
   POST /api/v1/subscriptions/{id}/plan-change
   {
     "new_plan_id": "...",
     "mode": "next_cycle"
   }
   ```
   - Sets `plan_change_requested_plan_id`, `plan_change_effective_at`
   - Writes `plan_change_requested` event
   - Enqueues outbox event
   - Sends notification (best-effort)

2. **Admin applies plan change:**
   ```
   POST /api/v1/subscriptions/{id}/plan-change/apply?force=true
   ```
   - Updates `plan_id`
   - Clears request fields
   - Writes `plan_changed` event
   - Attempts proration invoice creation (or records in outbox)
   - Sends notification (best-effort)

### Cancellation Flow

1. **Subscriber requests cancellation:**
   ```
   POST /api/v1/subscriptions/{id}/cancel
   {
     "reason": "No longer needed",
     "effective_mode": "notice_1_month"
   }
   ```
   - Computes `cancel_effective_at` (1 month from now, or end of cycle if later)
   - Sets status to `cancellation_requested`
   - Writes `cancellation_requested` event
   - Enqueues outbox event
   - Sends notification (best-effort)

2. **System finalizes cancellation (scheduled job or manual):**
   ```
   POST /api/v1/subscriptions/internal/cancellation/finalize-due
   ```
   - Finds subscriptions where `cancel_effective_at <= now` and `status = cancellation_requested`
   - Sets status to `cancelled`
   - Writes `cancelled` event
   - Enqueues outbox event
   - Sends notification (best-effort)

## Database Migrations Required

Run these migrations before starting services:

```bash
cd services/subscription-service
alembic upgrade head
```

This will apply migrations 0004, 0005, 0006.

## Environment Variables

**Subscription Service:**
- `NOTIFICATION_SERVICE_URL` (optional, for notifications)
- `BILLING_SERVICE_URL` (optional, for proration)
- `INTERNAL_API_KEY` (for internal endpoints)

## Testing

- Basic pytest test structure created in `services/subscription-service/tests/test_subscription_lifecycle.py`
- Manual API smoke test guide: `docs/development/manual-api-smoke-test-subscription-lifecycle.md`

## Scheduled Job Recommendation

For production, create a cron job or scheduled task that calls:
```
POST /api/v1/subscriptions/internal/cancellation/finalize-due
```
Every hour (or as needed) to finalize due cancellations.

Alternatively, implement a background worker that:
1. Polls `subscription_outbox` for pending events
2. Processes notifications/reporting
3. Marks outbox entries as sent/failed

## Next Steps (Wave 3 - Optional)

- Implement billing-service proration endpoint (`/internal/proration/invoice`)
- Credit ledger for proration credits
- Full proration calculation engine
- Outbox processor worker for async event handling
- Enhanced admin filters (upcoming_plan_change, cancel_effective_before/after)

## Notes

- All lifecycle actions write immutable events for auditability
- Outbox pattern used instead of message broker (sufficient for this wave)
- Notifications are best-effort (failures logged, don't break transactions)
- Cancellation effective date uses calendar month addition (not 30 days)
- Plan change apply requires admin role for safety (can be automated later)
- Proration is "hooked" but not fully implemented (Wave 3)
