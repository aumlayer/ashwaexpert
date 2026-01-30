# Ashva Experts — Specs & Demo Credentials

This document captures:
- How to run/deploy the system (local demo)
- Demo credentials (by role)
- What functionality exists so far per user type
- What is still pending / missing workflows

---

## 1) Local deployment / demo setup

### Prerequisites
- Docker + Docker Compose
- Node.js 18+ (for the web app)

### Start the full local stack (recommended)
1) Copy env template:

```bash
cp infra/docker-compose/.env.example infra/docker-compose/.env
```

2) Start all infra + microservices + gateway + nginx:

```bash
docker compose -f infra/docker-compose/docker-compose.yml up -d --build
```

### URLs
- **Web app (Next.js)**: typically `http://127.0.0.1:<port>` (dev server)
- **Gateway via Nginx (API base)**: `http://localhost:8080/api/v1`
- **Swagger UI**: `http://localhost:8080/docs`
- **Consolidated OpenAPI**: `http://localhost:8080/openapi.yaml`

### Run the web app
From `apps/web` (run with your usual package manager):

```bash
npm install
npm run dev
```

Environment:
- `NEXT_PUBLIC_API_URL` defaults to `http://localhost:8080/api/v1`

---

## 2) Demo credentials

### Common (OTP)
- **Static dev OTP**: `123456`

### Subscriber (portal)
- **Login method**: Phone OTP (auto-creates subscriber user in local dev)
- **Example**: any 10-digit phone + OTP `123456`

Password login (seeded in local dev):
- `subscriber@example.com` / `password123`

### Admin
- **Login method (web)**: Email OTP
- **Admin email policy**: only `@ashvaexperts.com` emails can be `admin`
- **Example**: `admin@ashvaexperts.com` + OTP `123456`

Password login (seeded in local dev):
- `admin@example.com` / `password123`

### Technician
- **Technician portal (web)**: `/tech`
- **Login method**:
  - Password login (seeded in local dev): `technician@example.com` / `password123`
  - Or OTP login (local dev auto-create) via phone OTP

---

## 3) Current capabilities (by user type)

### Public website (unauthenticated)
- **Plans page**: badge visibility, consistent cards, button styling fixes applied
- **Support page**: FAQ accordion + category pills layout fixed
- **Lead capture**: Corporate form creates lead (visible in admin)

### Subscriber portal (`/app/*`)
- **Auth**: phone/email identifier login (OTP)
- **Dashboard**: shows subscription + invoices (via billing)
- **Subscription**:
  - `GET /subscriptions/me` (current subscription)
- **Payments**:
  - `GET /billing/me/invoices` (invoice list)
  - Payment methods UI exists but backend method management is not implemented
- **Service Requests**:
  - Subscriber ticket creation and ticket list UI exists

### Admin portal (`/admin/*`)
- **Auth/Access control**: admin-only guard + redirect
- **Leads**: list + status update + assignment (API-backed)
- **Plans**: plan listing/management UI (API-backed)
- **Subscriptions**: admin list of subscriptions (API-backed)
- **Billing**: admin invoices list (API-backed)
- **Tickets**: admin list tickets (API-backed)

### Technician portal (`/tech`)
- **Auth/Access control**: technician-only guard + redirect
- **Assignments**:
  - View job queue via `GET /assignments/me`
  - Accept / Reject assignment

---

## 4) Realtime events (Phase B)

### SSE (Server-Sent Events)
- **Gateway SSE endpoint**: `GET /api/v1/events/stream`
- Backed by Redis PubSub channel `ashva:events`

### What triggers events today
- Gateway publishes events on successful mutations (200/201/204) for:
  - `tickets.*`
  - `assignments.*`

### What the web app does on events
- Global listener invalidates React Query caches:
  - admin dashboard/tickets
  - technician assignments
  - subscriber subscription/payments

---

## 5) Known gaps / pending workflows

### Auth / Credentials
- Password-based admin/subscriber demo users are not guaranteed seeded.
  - Recommendation: treat OTP flows as the primary demo path.

### Subscriber ↔ Technician ↔ Admin workflow
- **Ticket creation** → visible to admin
- **Assignment creation** → visible to technician
- **Status propagation** depends on service implementations; UI uses polling + SSE invalidation.

Missing / pending:
- Automatic notifications (SMS/Email/WhatsApp) on:
  - ticket created
  - assignment created
  - assignment accepted
  - ticket completed
- Subscriber-facing live ticket status updates beyond polling/SSE invalidation
- Technician ticket detail view (beyond assignment list)

### Payments
Missing / pending:
- Payment methods management endpoints
- Invoice PDF download endpoint
- Full payment initiation UX from subscription purchase/renew

### Inventory
Missing / pending:
- Inventory backend endpoints (admin inventory currently shows empty state if 404)

### UI polish
- Admin dark-theme contrast improvements are in progress (token-based dark mode enabled)

---

## 6) Quick demo script (suggested)

1) Start stack (docker compose) + start web (`apps/web`)
2) Subscriber login with phone OTP → `/app`
3) Admin login with `admin@ashvaexperts.com` OTP → `/admin`
4) Create a ticket as subscriber → visible in admin tickets
5) Assign ticket to technician (admin) → visible in `/tech` assignments
6) Technician accepts assignment → admin/tech UIs refresh via SSE
