# Phase 6: Ticketing & Field Operations - Manual API Smoke Test

This document provides a curl-based smoke test sequence to verify the end-to-end ticket workflow.

## Prerequisites

1. All services running (via docker-compose or local)
2. Database migrations run for ticket-service and assignment-service
3. At least one admin user, one subscriber user, and one technician user created
4. Gateway accessible at `http://localhost:8000` (or configured port)

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

### Step 2: Create Ticket (Subscriber)

```bash
TICKET_RESPONSE=$(curl -s -X POST http://localhost:8000/api/v1/tickets \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "ticket_type": "service",
    "priority": "high",
    "title": "Water purifier service required",
    "description": "Need annual service for RO system",
    "location_address": "123 Main St, City"
  }')

TICKET_ID=$(echo $TICKET_RESPONSE | jq -r '.id')
TICKET_NUMBER=$(echo $TICKET_RESPONSE | jq -r '.ticket_number')

echo "Created ticket: $TICKET_NUMBER ($TICKET_ID)"
```

### Step 3: Get Ticket Details (Subscriber)

```bash
curl -s -X GET "http://localhost:8000/api/v1/tickets/$TICKET_ID?include_history=true" \
  -H "Authorization: Bearer $TOKEN" | jq
```

### Step 4: Login as Admin

```bash
ADMIN_TOKEN=$(curl -s -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@example.com", "password": "password123"}' \
  | jq -r '.access_token')

echo "Admin token: $ADMIN_TOKEN"
```

### Step 5: List Tickets (Admin)

```bash
curl -s -X GET "http://localhost:8000/api/v1/tickets/admin?status=created&limit=10" \
  -H "Authorization: Bearer $ADMIN_TOKEN" | jq
```

### Step 6: Assign Ticket to Technician (Admin)

```bash
# First, get a technician user_id (from auth-service or known value)
TECHNICIAN_ID="<technician-user-uuid>"

ASSIGNMENT_RESPONSE=$(curl -s -X POST http://localhost:8000/api/v1/assignments \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d "{
    \"ticket_id\": \"$TICKET_ID\",
    \"technician_id\": \"$TECHNICIAN_ID\",
    \"notes\": \"Assigned for service call\"
  }")

ASSIGNMENT_ID=$(echo $ASSIGNMENT_RESPONSE | jq -r '.id')
echo "Assignment created: $ASSIGNMENT_ID"
```

### Step 7: Verify Ticket Status Changed to "assigned"

```bash
curl -s -X GET "http://localhost:8000/api/v1/tickets/$TICKET_ID" \
  -H "Authorization: Bearer $ADMIN_TOKEN" | jq '.status'
# Should return "assigned"
```

### Step 8: Login as Technician

```bash
TECH_TOKEN=$(curl -s -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "technician@example.com", "password": "password123"}' \
  | jq -r '.access_token')

echo "Technician token: $TECH_TOKEN"
```

### Step 9: View Job Queue (Technician)

```bash
curl -s -X GET "http://localhost:8000/api/v1/assignments/me" \
  -H "Authorization: Bearer $TECH_TOKEN" | jq
```

### Step 10: Accept Assignment (Technician)

```bash
curl -s -X POST "http://localhost:8000/api/v1/assignments/$ASSIGNMENT_ID/accept" \
  -H "Authorization: Bearer $TECH_TOKEN" | jq
```

### Step 11: Start Work (Technician) - Update Ticket Status to "in_progress"

```bash
curl -s -X PATCH "http://localhost:8000/api/v1/tickets/$TICKET_ID" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TECH_TOKEN" \
  -d '{"status": "in_progress"}' | jq
```

### Step 12: Upload Completion Photo (Technician)

```bash
# Get presigned upload URL
PRESIGN_RESPONSE=$(curl -s -X POST http://localhost:8000/api/v1/media/presign \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TECH_TOKEN" \
  -d "{
    \"owner_type\": \"ticket\",
    \"owner_id\": \"$TICKET_ID\",
    \"content_type\": \"image/jpeg\",
    \"file_name\": \"completion-photo.jpg\"
  }")

UPLOAD_URL=$(echo $PRESIGN_RESPONSE | jq -r '.upload_url')
MEDIA_ID=$(echo $PRESIGN_RESPONSE | jq -r '.media_id')

echo "Upload URL: $UPLOAD_URL"
echo "Media ID: $MEDIA_ID"

# Upload file (using a test image file)
# curl -X PUT "$UPLOAD_URL" --upload-file test-image.jpg
```

### Step 13: Complete Ticket (Technician)

```bash
curl -s -X PATCH "http://localhost:8000/api/v1/tickets/$TICKET_ID" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TECH_TOKEN" \
  -d '{
    "status": "completed",
    "completion_notes": "Service completed successfully. RO filter replaced and system tested."
  }' | jq
```

### Step 14: Close Ticket (Admin)

```bash
curl -s -X PATCH "http://localhost:8000/api/v1/tickets/$TICKET_ID" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{"status": "closed"}' | jq
```

### Step 15: Verify Status History

```bash
curl -s -X GET "http://localhost:8000/api/v1/tickets/$TICKET_ID?include_history=true" \
  -H "Authorization: Bearer $ADMIN_TOKEN" | jq '.status_history'
```

### Step 16: List Media for Ticket

```bash
curl -s -X GET "http://localhost:8000/api/v1/media?owner_type=ticket&owner_id=$TICKET_ID" \
  -H "Authorization: Bearer $TECH_TOKEN" | jq
```

## Expected Results

- ✅ Ticket created with status "created"
- ✅ Admin can list and view tickets
- ✅ Assignment creates record and updates ticket to "assigned"
- ✅ Technician sees job in queue
- ✅ Technician can accept assignment
- ✅ Technician can update ticket status (assigned → in_progress → completed)
- ✅ Completion requires notes
- ✅ Admin can close completed tickets
- ✅ Status history records all transitions
- ✅ Media upload works (presign → upload → list)

## Troubleshooting

- **401 Unauthorized**: Check token is valid and not expired
- **403 Forbidden**: Verify user role matches endpoint requirements
- **404 Not Found**: Ensure ticket/assignment IDs are correct
- **400 Bad Request**: Check request body matches schema (status transitions, required fields)
