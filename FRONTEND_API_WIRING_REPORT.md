# Frontend API Wiring Report (Progress)

Generated: 2026-01-29

This document captures **what has been implemented so far** in the frontend to align with `Frontendplan.md`.

It includes:
- what pages/flows were audited
- what was changed (mock/static → backend API)
- exact file paths updated
- current behavior, fallbacks, and UI implications
- what remains pending

---

## 1) Overview

### Goal
Move the frontend from **static/mock/simulated flows** to **real backend-integrated flows** using the existing `api` client and TanStack Query hooks.

### API base
Frontend uses:
- `NEXT_PUBLIC_API_URL` (default) → `http://localhost:8080/api/v1`
- API client: `apps/web/src/utils/api.ts`

### Hook pattern
- Public/funnel hooks live in: `apps/web/src/hooks/use-api.ts`
- Portal subscription hooks: `apps/web/src/hooks/use-subscription.ts`
- Portal payments hooks: `apps/web/src/hooks/use-payments.ts`
- Portal service hooks: `apps/web/src/hooks/use-service.ts`

---

## 2) Tier-1 Implementations (Completed)

### 2.1 `/plans` uses backend plans
- **Route:** `/plans`
- **Status:** Wired with fallback
- **Backend:** `GET /plans`
- **Hook:** `usePlans()`
- **File changed:**
  - `apps/web/src/app/(public)/plans/page.tsx`
- **What changed:**
  - Added `usePlans()` import and query.
  - Introduced `allPlans = plansQuery.data || plansData` fallback.
  - Updated persona filtering + compare lookup + pricing helper to use `allPlans`.
- **Result:**
  - If backend returns plans → UI uses backend.
  - If backend unavailable/empty → UI still works with `@/data/content`.

### 2.2 `/support` FAQs fetched server-side
- **Route:** `/support`
- **Status:** Wired with fallback
- **Backend:** `GET /faqs`
- **File changed:**
  - `apps/web/src/app/(public)/support/page.tsx`
- **What changed:**
  - Converted page to `async` server component.
  - Fetches `FAQ[]` via `api.get<FAQ[]>("/faqs")`.
  - Falls back to static `faqs` from `@/data/content`.
  - Keeps SEO JSON-LD FAQ schema generation.

### 2.3 `/check-availability` removed simulated serviceability logic
- **Route:** `/check-availability`
- **Status:** Backend-driven (no simulated fallback)
- **Backend:** `POST /availability/check` (+ optional lead capture)
- **Hook:** `useCheckAvailability()`
- **File changed:**
  - `apps/web/src/app/(public)/check-availability/page.tsx`
- **What changed:**
  - Removed hardcoded “serviceable pincodes” + `setTimeout` simulation.
  - On API error: resets state and shows a clean error message.

---

## 3) Tier-2 Implementations (Completed)

### 3.1 `/checkout` uses backend plans for display
- **Route:** `/checkout`
- **Status:** Partial → Improved wiring
- **Backend:**
  - `GET /plans` (for plan display)
  - `POST /checkout` (for checkout)
- **Hooks:**
  - `usePlans()`
  - `useCheckout()`
- **File changed:**
  - `apps/web/src/app/(public)/checkout/page.tsx`
- **What changed:**
  - Uses backend plans data to resolve `selectedPlan`.
  - Falls back to static `plansData` if API empty/unavailable.
  - Checkout submission remains via `useCheckout()`.

### 3.2 `/corporate` inquiry now creates a lead via backend
- **Route:** `/corporate`
- **Status:** Wired
- **Backend:** `POST /leads`
- **Hook:** `useCreateLead()`
- **File changed:**
  - `apps/web/src/app/(public)/corporate/page.tsx`
- **What changed:**
  - Replaced simulated submit delay with real `createLeadMutation.mutateAsync()`.
  - Uses `source: "corporate"`.
  - Packs form details into `message`.
  - Added visible submit error UI.
  - Extracts a 6-digit pincode from `locations` if present (otherwise uses `"000000"`).

---

## 4) Portal (Customer App) Work

### 4.1 `/app/relocation` wired to backend relocation endpoint
- **Route:** `/app/relocation`
- **Status:** Wired
- **Backend:** `POST /subscriptions/relocation`
- **Hook:** `useRequestRelocation()`
- **File changed:**
  - `apps/web/src/app/(portal)/app/relocation/page.tsx`
- **What changed:**
  - Removed simulated `setTimeout`.
  - Calls `useRequestRelocation().mutateAsync({ newAddress, preferredDate })`.
  - Added `submitError` UI.

### 4.2 Removed portal mock fallbacks (real empty states)

#### `/app` (Dashboard)
- **Route:** `/app`
- **Hooks used:** `useSubscription()`, `useMaintenanceSchedule()`, `usePayments()`
- **File changed:**
  - `apps/web/src/app/(portal)/app/page.tsx`
- **What changed:**
  - Removed mock `subscriptionData`, `upcomingVisit`, `recentPayments`.
  - Displays real “empty” text when no subscription/maintenance/payments are returned.

#### `/app/payments`
- **Route:** `/app/payments`
- **Hooks used:**
  - `usePayments()`, `usePaymentMethods()`, `useRetryPayment()`, `useDownloadInvoice()`
  - `useSubscription()` (to render next-billing + member-since)
- **File changed:**
  - `apps/web/src/app/(portal)/app/payments/page.tsx`
- **What changed:**
  - Removed mock payment history + methods fallbacks.
  - Added loading skeletons + proper empty states.
  - “Member Since” now derived from `subscription.startDate` (instead of hardcoded “Jan 2024”).

#### `/app/subscription`
- **Route:** `/app/subscription`
- **Hooks used:** `useSubscription()`, `useUpgradeSubscription()`, `useCancelSubscription()`
- **File changed:**
  - `apps/web/src/app/(portal)/app/subscription/page.tsx`
- **What changed:**
  - Removed mock subscription object fallback.
  - Added **early-return** if there’s no subscription.
  - Status badge now reflects `subscription.status`.
  - Fixed a TS/JSX syntax issue introduced during refactor.

#### `/app/service`
- **Route:** `/app/service`
- **Hooks used:** `useServiceTickets()`, `useCreateServiceTicket()`, `useMaintenanceSchedule()`
- **File changed:**
  - `apps/web/src/app/(portal)/app/service/page.tsx`
- **What changed:**
  - Removed mock ticket list fallback.
  - Upcoming maintenance banner now only shows if backend provides `nextVisit`.
  - Existing “No service requests” empty state now reflects real backend data.

---

## 5) What is still pending

### 5.1 Git branch + push
- A branch creation/push was prepared earlier, but not executed yet.
- Pending task: create branch `frontend` and push current changes.

### 5.2 Pages still using mock/static/simulated behavior
These remain **not wired** (or only partially wired) because hooks and/or backend endpoints are missing or not yet implemented:

#### Portal
- `/app/profile` (still uses simulated save)
  - File: `apps/web/src/app/(portal)/app/profile/page.tsx`
- `/app/addons` (static addon catalog + TODO)
  - File: `apps/web/src/app/(portal)/app/addons/page.tsx`
- `/app/referrals` (static mock referral code/history)
  - File: `apps/web/src/app/(portal)/app/referrals/page.tsx`

#### Admin
- `/admin/content` (explicitly sample data)
  - File: `apps/web/src/app/(admin)/admin/content/page.tsx`
- `/admin/analytics` (explicitly sample data)
  - File: `apps/web/src/app/(admin)/admin/analytics/page.tsx`
- `/admin/settings` (explicitly not persisted)
  - File: `apps/web/src/app/(admin)/admin/settings/page.tsx`

#### Public marketing sections
Some homepage sections still rely on static content (`@/data/content`) or simulated flows (e.g., pincode check delays in some components). These were audited but not part of the latest portal push.

---

## 6) Notes / Important implementation details

### 6.1 Intentional use of fallback
For critical marketing pages (`/plans`, `/support`, `/checkout` display), we kept a **fallback to static content** to avoid breaking the UI if the backend is unavailable during development.

### 6.2 Portal behavior change
For portal pages, the direction is stricter:
- **do not** show fake data
- show loading skeletons while fetching
- show clear empty states when the backend returns none

This prevents misleading users.

---

## 7) Files changed (summary)

### Public
- `apps/web/src/app/(public)/plans/page.tsx`
- `apps/web/src/app/(public)/support/page.tsx`
- `apps/web/src/app/(public)/check-availability/page.tsx`
- `apps/web/src/app/(public)/checkout/page.tsx`
- `apps/web/src/app/(public)/corporate/page.tsx`

### Portal
- `apps/web/src/app/(portal)/app/page.tsx`
- `apps/web/src/app/(portal)/app/payments/page.tsx`
- `apps/web/src/app/(portal)/app/subscription/page.tsx`
- `apps/web/src/app/(portal)/app/service/page.tsx`
- `apps/web/src/app/(portal)/app/relocation/page.tsx`

---

## 8) Suggested next steps

1) Create and push branch `frontend`.
2) Decide whether homepage sections (`HeroSection`, `TopPlansSection`, `TestimonialsSection`, CTA pincode flow) should:
   - remain static for now, or
   - be upgraded to backend-backed hooks (`usePlans`, `useTestimonials`, real availability check).
3) Implement missing backend endpoints + hooks for:
   - profile update
   - addons
   - referrals
   - admin content/analytics/settings

---

## 9) Quick verification checklist

After backend is running:
- `/plans` shows backend plans
- `/support` shows backend FAQs (and JSON-LD present)
- `/check-availability` success/failure reflects backend only
- `/checkout` displays correct backend plan name/price
- `/corporate` creates a lead (visible in admin leads)
- portal `/app/*` shows empty states when backend returns none (no fake data)
- `/app/relocation` triggers `/subscriptions/relocation` request
