# Phase 6: Ticketing & Field Operations - Implementation Summary

## Overview

Phase 6 backend implementation completed. All services are API-ready for the end-to-end ticket workflow: Subscriber creates ticket → Admin assigns technician → Technician executes & completes with notes/photos → Subscriber sees updates → Notifications fire.

## Services Implemented

### 1. Ticket Service (`services/ticket-service`)

**New/Enhanced Endpoints:**
- `GET /api/v1/tickets/{ticket_id}` - Get ticket by ID with RBAC (subscriber: own, tech: assigned, admin: any)
- `GET /api/v1/tickets/{ticket_id}?include_history=true` - Get ticket with status history
- `PATCH /api/v1/tickets/{ticket_id}` - Update ticket status with enforced workflow
- `GET /api/v1/tickets/admin` - Admin list with filters (status, type, priority, subscriber, technician, date, SLA)
- `GET /api/v1/tickets/admin/sla-configs` - List SLA configurations
- `PUT /api/v1/tickets/admin/sla-configs` - Upsert SLA configuration
- `PATCH /api/v1/tickets/internal/{ticket_id}/assign-technician` - Internal endpoint for assignment-service

**Database Changes (Migration 0002):**
- Added `assigned_technician_id` (UUID, nullable, indexed) to `tickets`
- Added `sla_due_at` (datetime, nullable, indexed) to `tickets`
- Created `ticket_status_history` table (id, ticket_id, from_status, to_status, actor_user_id, actor_role, notes, created_at)
- Created `sla_configs` table (id, ticket_type, priority, due_hours, is_active, unique constraint on type+priority)

**Status Workflow:**
- Enforced transitions: `created → assigned → in_progress → completed → closed`
- Optional: `created/assigned → cancelled` (admin only)
- Role-based permissions:
  - Admin: `created→assigned`, `completed→closed`, any→`cancelled`
  - Technician: `assigned→in_progress`, `in_progress→completed` (requires completion_notes, must be assigned to them)
  - Subscriber: read-only (no status mutations)

**SLA:**
- SLA due-by computed at ticket creation based on `sla_configs` (ticket_type + priority → due_hours)
- Admin can configure SLA via `/api/v1/tickets/admin/sla-configs`

**Status History:**
- Every status transition recorded in `ticket_status_history`
- Completion notes stored in history row when status becomes "completed"

### 2. Assignment Service (`services/assignment-service`)

**New Service (from stub to full):**

**Endpoints:**
- `POST /api/v1/assignments` - Admin creates assignment (ticket_id, technician_id)
- `POST /api/v1/assignments/{assignment_id}/unassign` - Admin unassigns
- `GET /api/v1/assignments/admin` - Admin list with filters
- `GET /api/v1/assignments/me` - Technician job queue (assigned/accepted/in_progress)
- `POST /api/v1/assignments/{assignment_id}/accept` - Technician accepts
- `POST /api/v1/assignments/{assignment_id}/reject` - Technician rejects

**Database (Migration 0001):**
- Created `ticket_assignments` table (id, ticket_id, subscriber_id, technician_id, status, assigned_by_user_id, notes, assigned_at, updated_at)
- Status values: `assigned`, `accepted`, `rejected`, `unassigned`, `completed`

**Integration:**
- On assignment create: calls ticket-service internal endpoint to set `assigned_technician_id` and status=assigned
- On unassign/reject: clears `assigned_technician_id` in ticket-service
- Best-effort notification to technician on assignment (job_assigned template)

### 3. Media Service (`services/media-service`)

**New Endpoints (ticket photos):**
- `POST /api/v1/media/presign` - Generate presigned upload URL (owner_type=ticket, owner_id, content_type, file_name)
- `POST /api/v1/media/{media_id}/complete` - Mark upload complete (optional validation)
- `GET /api/v1/media?owner_type=ticket&owner_id={ticket_id}` - List media for ticket
- `GET /api/v1/media/{media_id}/download` - Public download with authorization

**Authorization:**
- Ticket photos: subscriber (own tickets), technician (assigned tickets), admin (any)
- Validates ticket access via ticket-service internal call

**Storage:**
- MinIO bucket: `ashva-media`
- Object path: `ticket/{ticket_id}/{uuid}.{ext}`
- Presigned URLs: 1 hour expiry for upload, 5 minutes for download

### 4. Notification Service (`services/notification-service`)

**New Templates Added:**
- `ticket_created` - SMS + Email (to subscriber)
- `job_assigned` - SMS + Email (to technician)
- `job_completed` - SMS + Email (to subscriber)
- `sla_breach` - SMS + Email (escalation, optional for later)

**Wiring:**
- Ticket-service: calls notification on ticket creation and completion (best-effort, logs if recipient lookup not available)
- Assignment-service: calls notification on assignment (best-effort)

### 5. Gateway Service (`services/gateway-service`)

**New RBAC Rules:**
- `/api/v1/tickets`: 
  - POST: subscriber, admin
  - GET /admin: admin only
  - GET /me: subscriber only
  - GET /{id}, PATCH: subscriber, technician, admin (enforced in ticket-service)
  - Internal endpoints blocked
- `/api/v1/assignments`:
  - POST, GET /admin, POST /{id}/unassign: admin only
  - GET /me, POST /{id}/accept, POST /{id}/reject: technician only
  - Internal endpoints blocked
- `/api/v1/media`:
  - Presign, complete, list, download: authorization enforced in media-service
  - Internal endpoints blocked

## Database Migrations Required

Run these migrations before starting services:

```bash
# Ticket service
cd services/ticket-service
alembic upgrade head

# Assignment service
cd services/assignment-service
alembic upgrade head
```

## Environment Variables

**Ticket Service:**
- `INTERNAL_API_KEY` (for internal endpoints)
- `NOTIFICATION_SERVICE_URL` (optional, for notifications)
- `AUTH_SERVICE_URL` (optional, for user lookup)

**Assignment Service:**
- `INTERNAL_API_KEY`
- `TICKET_SERVICE_URL` (required for ticket updates)
- `NOTIFICATION_SERVICE_URL` (optional, for notifications)

**Media Service:**
- `TICKET_SERVICE_URL` (for ticket access validation)
- `AUTH_SERVICE_URL` (optional, for user lookup)
- `INTERNAL_API_KEY`
- `MINIO_*` (already configured)

## API Flow Example

1. **Subscriber creates ticket** → `POST /api/v1/tickets`
   - Returns ticket with status="created", sla_due_at computed
   - Status history entry created
   - Notification sent (best-effort)

2. **Admin assigns technician** → `POST /api/v1/assignments`
   - Creates assignment record (status="assigned")
   - Calls ticket-service internal to set assigned_technician_id and status="assigned"
   - Notification sent to technician (best-effort)

3. **Technician views queue** → `GET /api/v1/assignments/me`
   - Returns assigned/accepted/in_progress jobs

4. **Technician accepts** → `POST /api/v1/assignments/{id}/accept`
   - Updates assignment status="accepted"

5. **Technician starts work** → `PATCH /api/v1/tickets/{id}` with status="in_progress"
   - Workflow enforced: must be assigned to technician, current status must be "assigned"

6. **Technician uploads photo** → `POST /api/v1/media/presign` then upload to presigned URL
   - Creates MediaObject record
   - Authorization: must have access to ticket

7. **Technician completes** → `PATCH /api/v1/tickets/{id}` with status="completed" + completion_notes
   - Workflow enforced: must be in_progress, completion_notes required
   - Status history records completion with notes
   - Notification sent to subscriber (best-effort)

8. **Admin closes** → `PATCH /api/v1/tickets/{id}` with status="closed"
   - Workflow enforced: must be completed

## Testing

- Basic pytest test structure created in `services/ticket-service/tests/` and `services/assignment-service/tests/`
- Manual API smoke test guide: `docs/development/manual-api-smoke-test-phase6.md`

## Next Steps (Optional Enhancements)

- SLA breach detection job (cron that finds tickets with sla_due_at < now and status not closed)
- Recipient lookup for notifications (call subscriber-service or auth-service to get email/phone)
- Full pytest test suite with proper DB fixtures
- OpenAPI spec updates (each service's openapi.yaml should be updated)

## Notes

- All notification calls are best-effort (failures logged, don't break core flows)
- Assignment-service is source-of-truth for assignments; ticket-service mirrors assigned_technician_id for fast auth
- Media-service validates ticket access via ticket-service internal call (could be optimized with caching)
- Status workflow is strict; invalid transitions return 400 with clear error message
