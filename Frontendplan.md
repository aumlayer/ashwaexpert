# AshwaExperts Frontend UI Plan (Revenue-First, CTA-Driven, Premium Motion)

**Doc version:** 1.0  
**Scope:** Public marketing site + conversion funnel + Customer Portal + Admin Workspace  
**Primary objective:** Maximize conversions (subscription/installation) while improving retention (renewals, add-ons, service satisfaction) through a high-trust, high-clarity, high-motion UI.

---

## 1) Product Strategy: What the UI must optimize for

### North-star metrics
- **Visitor → Pincode Check conversion** (top-of-funnel intent capture)
- **Pincode Check → Plan View**
- **Plan View → Checkout Start**
- **Checkout Start → Payment Success**
- **Payment Success → Installation Scheduled**
- **Activation → Month 2 retention**
- **ARPU uplift via add-ons** (Copper/Alkaline/Hot/Pre-filter/extra unit)
- **Support ticket resolution SLA + CSAT**

### Core revenue levers (must be visible in UI)
1. **Price anchoring** (starting at ₹X/month) + transparent inclusions
2. **Installation urgency** (book slot, limited availability by area)
3. **Risk reversal** (trial/guarantee language if applicable)
4. **Trust acceleration** (service SLA, technicians, replacements, hygiene)
5. **Upsell surfaces** (add-ons, prepaid savings, second device)
6. **Retention loop** (service + proactive maintenance + ticket tracking)
7. **Lead capture fallback** (callback/WhatsApp when user drops)

---

## 2) Target users & primary intents

### Personas
- **Homeowner / Tenant:** wants clean water without upfront purchase
- **Family decision maker:** wants reliability + low maintenance
- **Hostel/PG / Small office:** wants quick install, predictable cost
- **Apartment association / Corporate buyer:** wants bulk pricing + SLA contracts

### Primary intents mapped to UI
- “Is service available in my area?” → **Pincode-first CTA**
- “What will I pay monthly and what’s included?” → **plan cards + inclusions**
- “Which purifier is right for my water?” → **3-step recommendation quiz**
- “How fast can you install?” → **slot scheduler**
- “Will you service it?” → **SLA + ticket journey preview**
- “Can I cancel or switch plan?” → **clear terms + portal demo**

---

## 3) Information Architecture (IA)

### A) Public marketing site (highest conversion priority)
- `/` Home (story funnel)
- `/plans` Plans (primary conversion page)
- `/purifiers` Purifier catalog (secondary browsing route)
- `/recommend` Water Check Quiz (interactive recommender)
- `/how-it-works` 3-step explanation
- `/service-promise` SLA + maintenance + replacement + relocation
- `/offers` Promo / prepaid savings / bundles
- `/corporate` Apartments/Corporate/Bulk
- `/support` Support hub + WhatsApp + FAQ
- `/login` Auth entry (OTP/password based on backend)
- `/legal/*` Terms, privacy, cancellation policy

### B) Conversion funnel (fast path)
- `/check-availability` Pincode → locality
- `/recommend` quiz → recommended plan
- `/checkout` schedule → payment
- `/confirmation` tracking + share + WhatsApp

### C) Customer Portal (authenticated)
- `/app` Dashboard
- `/app/subscription` Plan status, upgrade/downgrade, renew
- `/app/payments` invoices, retries, UPI mandates (if supported)
- `/app/service` tickets: raise, track, reschedule
- `/app/relocation` request relocation (free/paid)
- `/app/addons` add-ons, second purifier, prepaid savings
- `/app/referrals` referral code, earnings
- `/app/profile` address, contact, preferences

### D) Admin Workspace (authenticated, RBAC)
- `/admin` Overview
- `/admin/leads` lead capture + follow-ups
- `/admin/plans` plans, pricing rules, offers, tenure rules
- `/admin/subscriptions` ops: activation, pauses, cancellations
- `/admin/payments` reconciliation, failures, refunds
- `/admin/tickets` SLA tracking, assignments, escalations
- `/admin/inventory` device allocation, serial mapping, replacements
- `/admin/content` CMS: FAQs, cities, banners
- `/admin/settings` templates (SMS/email), WhatsApp, policy text
- `/admin/analytics` funnel + cohort + campaign attribution

---

## 4) Conversion architecture: CTA map & funnel logic

### Global CTA hierarchy (must be consistent)
- **Primary CTA (1 per screen):** “Check availability” or “Subscribe now”
- **Secondary CTA:** “View plans”, “Get recommendation”, “Talk on WhatsApp”
- **Tertiary CTA:** “How it works”, “Service promise”, “Compare plans”

### CTA placements (rules)
- Hero section: **Primary CTA + input** (pincode field)
- Sticky CTA: On scroll, show **floating pill** “Check availability”
- Plans page: plan cards with **Subscribe** + “Know inclusions”
- Quiz: CTA becomes **See recommendation** → **Subscribe recommended**
- Checkout: single CTA “Pay & schedule” (avoid choice overload)
- Exit intent: if user tries to leave, show **callback/WhatsApp** lead capture

### Funnel fallback (anti-drop)
If checkout fails or user abandons:
- Persist cart + slot selection for 24h
- Send WhatsApp/SMS “Complete your booking”
- Provide “Retry payment” deep link from portal

---

## 5) Visual Design System (Colors, Typography, Layout)

### 5.1 Brand positioning
**Premium + clean + trustworthy + modern SaaS** (water = purity, hygiene, calm confidence)

### 5.2 Color system (tokens)
Primary palette (light mode)
- **Ashwa Blue (Primary):** `#1E40AF` (buttons, links, focus)
- **Aqua Teal (Accent):** `#0EA5A4` (highlights, progress, badges)
- **Mint Glow (Soft Accent):** `#A7F3D0` (background accents, success tints)
- **Slate Ink (Text):** `#0F172A`
- **Slate (Body):** `#334155`
- **Border:** `#E2E8F0`
- **Surface:** `#FFFFFF`
- **Surface-2:** `#F8FAFC`
- **Hero Gradient:** `linear-gradient(135deg, #1E40AF 0%, #0EA5A4 55%, #A7F3D0 100%)`

Semantic colors
- **Success:** `#16A34A`
- **Warning:** `#F59E0B`
- **Error:** `#EF4444`
- **Info:** `#2563EB`

Dark mode (optional but recommended for portal/admin)
- **BG:** `#0B1220`
- **Surface:** `#0F172A`
- **Text:** `#E2E8F0`
- **Border:** `#1F2937`
- **Primary:** `#60A5FA`
- **Accent:** `#2DD4BF`

**Usage rules**
- Primary CTA always uses **Ashwa Blue** background with white text.
- Accent used for **trust micro-highlights** (badges, progress, icons), not for primary CTAs.
- Gradients only in hero and section dividers; keep content cards flat for readability.

### 5.3 Typography (font family + sizes)
Recommended stack (Google Fonts / web-safe):
- **Headings:** `Sora` (modern, premium)
- **Body/UI:** `Inter` (high legibility)
- **Numbers (prices):** `Inter` (tabular nums enabled)

Font scale (desktop; mobile uses one step smaller)
- **H1:** 44px / 52px, weight 700
- **H2:** 32px / 40px, weight 700
- **H3:** 24px / 32px, weight 600
- **H4:** 20px / 28px, weight 600
- **Body Large:** 18px / 28px, weight 400–500
- **Body:** 16px / 26px, weight 400
- **Small:** 14px / 22px, weight 400
- **Caption:** 12px / 18px, weight 400

CTA button typography
- **Primary button label:** 16px weight 600, letter spacing 0.2px
- **Hero price:** 28–32px weight 700, tabular numbers

### 5.4 Layout & spacing
- 12-column grid, max width **1200px**
- Section padding: **72px desktop**, **48px mobile**
- Card radius: **16px** (premium), buttons **14px**
- Spacing scale (4px grid): 4, 8, 12, 16, 24, 32, 48, 64, 72

### 5.5 Component library (minimum set)
- **Navbar:** sticky, compact on scroll
- **Hero with pincode input + CTA**
- **Plan cards:** price, lock-in, inclusions, compare
- **Feature list:** icons + short copy
- **Trust strip:** badges (service engineers, SLA, trial)
- **Recommendation quiz:** stepper, radio cards, result summary
- **Slot scheduler:** date + time chips
- **Checkout summary:** fixed sidebar on desktop
- **FAQ accordion**
- **Testimonial carousel**
- **Pricing savings banner** (prepaid)
- **WhatsApp floating button** + contextual triggers
- **Toast + modal system**
- **Skeleton loaders**

---

## 6) Motion & Animation System (High engagement, performance-safe)

### Motion principles
- Motion must **increase clarity**, not distract.
- Use **micro-interactions** for confidence (selected states, progress, form validation).
- Use **scroll-triggered reveals** to extend time-on-site.

### Tooling
- **Framer Motion** for page transitions, micro-interactions
- **CSS + IntersectionObserver** for lightweight reveals
- **Lottie** only for a few hero/illustration elements (keep below 150KB each)

### Motion tokens
- **Durations:** 120ms (micro), 220ms (standard), 400ms (hero)
- **Easing:** `cubic-bezier(0.22, 1, 0.36, 1)` (easeOutExpo-ish)
- **Hover lift:** translateY(-2px), shadow increase
- **Card reveal:** opacity 0→1 + y 10→0 over 220ms
- **Page transition:** fade + slight slide (avoid heavy animations)

### Signature interactions (recommended)
1. **Hero waterline shader-lite effect** (subtle gradient shimmer, not WebGL-heavy)
2. **Plan card “savings reveal”** on hover or when toggling prepaid tenure
3. **Compare plans**: sticky comparison drawer that slides up
4. **Recommendation quiz**: animated stepper + result “confidence score”
5. **Checkout reassurance**: live “Includes installation + maintenance” pill animation

---

## 7) Page-by-page UI plan (Public site)

### 7.1 Home (`/`)
**Above fold**
- Headline: *“Pure water on subscription. Installed fast.”*
- Subtext: *“Maintenance, filters, service included. Pay monthly.”*
- Pincode input + Primary CTA: **Check availability**
- Secondary CTA: **Get recommendation**
- Trust strip: SLA, technicians, free maintenance, risk-free (if applicable)

**Scroll narrative sections**
1) **How it works (3 steps)**: Check → Install → Maintain  
2) **Find my purifier**: mini-quiz teaser  
3) **Top plans**: 3 cards, “Most Popular” badge  
4) **Buying vs Subscription** comparison slider  
5) **Service promise**: ticket flow preview  
6) **Testimonials by city**  
7) **Referral & bundles**  
8) Footer CTA: pincode + callback

**CTA plan**
- Sticky CTA appears after user scrolls 20%: “Check availability”
- WhatsApp CTA appears after 40% scroll: “Need help picking a plan?”

### 7.2 Plans (`/plans`)
- Filter tabs: **Home / PG / Office / Apartment**
- Toggle: **Monthly vs Prepaid (3/6/12 months)** (prepaid shows savings)
- Plan cards show:
  - Price (₹/month), lock-in, deposit (if any)
  - Inclusions (installation, maintenance, filter replacement)
  - Badge: “Best for borewell” / “Best for municipal”
  - Primary CTA: **Subscribe**
  - Secondary: **Compare**
- Sticky compare bar at bottom once user selects 2 plans.

### 7.3 Purifiers (`/purifiers`)
- Category chips: RO, UV, Copper, Alkaline, Under-sink
- Each tile:
  - “Best for …” tag
  - Monthly price
  - Service inclusions
  - CTA: Subscribe / View plan

### 7.4 Water Check Quiz (`/recommend`)
- Step 1: Water source (borewell/municipal/tanker)
- Step 2: Family size (1–2 / 3–4 / 5+)
- Step 3: Preference (taste, TDS concerns, copper/alkaline)
- Result page:
  - Recommended plan card + “Why this” explanation
  - Alternatives (2)
  - CTA: **Subscribe recommended**
  - CTA2: **Talk on WhatsApp**

### 7.5 How it works (`/how-it-works`)
- Simple 3-step story with animation
- “What’s included” checklist
- CTA at every section end: **Check availability**

### 7.6 Service promise (`/service-promise`)
- SLA tables (response time, replacement policy)
- “What happens when you raise a ticket” timeline animation
- Portal preview screenshots (static, no heavy media)
- CTA: **Subscribe with confidence**

### 7.7 Corporate (`/corporate`)
- Bulk pricing CTA: **Request proposal**
- Form: org size, locations, water source, timeline
- Trust: case studies, service SLA, onboarding

### 7.8 Support (`/support`)
- Searchable FAQ
- Ticket creation gated to login OR lead capture
- WhatsApp always visible
- “Service status by city” (optional later)

---

## 8) Customer Portal UI plan (Retention + Upsell)

### `/app` Dashboard
- Current plan card: status, next billing, “Upgrade”
- Upcoming visit (if scheduled)
- Quick actions:
  - **Raise service request**
  - **Retry payment**
  - **Add add-ons**
  - **Relocation request**
- Engagement: “Health tips” + referral tile

### `/app/subscription`
- Plan details, lock-in, cancellation policy
- Upgrade/downgrade flow:
  - show delta cost and next billing effect
- Pause/resume (if supported)
- Cancellation:
  - forces 1-month notice explanation and confirmation

### `/app/payments`
- Invoices list, download PDF
- Failed payments banner with retry CTA
- Add UPI mandate (if supported by Cashfree setup)

### `/app/service`
- Ticket list with status chips
- Raise ticket:
  - category, preferred slot, photos, notes
- Reschedule & escalation UI
- After resolution: CSAT + tip/referral prompt

### `/app/addons`
- Copper/Alkaline/Hot/Pre-filter upsells
- Second purifier bundle
- Prepaid savings
- Each card: benefit, price delta, CTA “Add now”

### `/app/referrals`
- Referral code + share buttons
- Wallet/credits status
- Rules + payouts

---

## 9) Admin Workspace UI plan (Ops efficiency + revenue)

### `/admin` Overview
- Funnel KPIs: pincode checks, plan views, checkout starts, successes
- Outstanding tickets by SLA risk
- Payment failure count
- Active subscriptions + churn trend
- Top cities/localities

### `/admin/leads`
- Captured leads with source (exit intent, corporate, WhatsApp)
- Stage pipeline: New → Contacted → Scheduled → Converted
- Notes + follow-up reminders

### `/admin/plans`
- CRUD plans (tenures, lock-in, deposit, add-ons)
- Offers engine (coupon codes, city-based pricing)
- A/B experiment flags (feature gating)

### `/admin/subscriptions`
- Activate, pause, cancel, extend
- Replacement workflow logs
- Relocation approvals

### `/admin/payments`
- Cashfree reconciliation
- Failure reasons
- Manual retry links
- Refund handling (if enabled)

### `/admin/tickets`
- Assign technician/vendor
- SLA timers
- Escalation triggers
- Audit log

### `/admin/inventory`
- Device assignment to subscription
- Serial number tracking
- Replacement history

---

## 10) Frontend technical architecture (Next.js + microservices)

### Stack
- **Next.js (App Router) + TypeScript**
- **Tailwind CSS** + CSS variables for tokens
- **Framer Motion**
- **TanStack Query** for data fetching/caching
- **Zod** for schema validation
- **OpenAPI typed client generation** from consolidated swagger
- **Auth**: cookie-based session/JWT (preferred for web)

### Repository layout (recommended)
```
apps/
  web/              # marketing + funnel
  portal/           # customer portal
  admin/            # admin workspace
packages/
  ui/               # shared components + tokens
  api/              # OpenAPI generated clients + fetchers
  config/           # eslint/tsconfig/tailwind presets
```

### Design patterns
- **Feature-sliced design** (by domain): `plans/`, `checkout/`, `service/`, `auth/`
- **Server components for SEO pages**, client components for interactive flows
- **Edge caching** for marketing pages (fast LCP)
- **Route-level loading** + skeletons for perceived performance
- **Error boundaries** + friendly retry UI

### API integration
- One typed client per service:
  - `subscription-service`
  - `payment-service`
  - (and future: tickets/service, inventory, notifications)
- Use a **BFF/Gateway** for frontend to avoid cross-service complexity where needed.

---

## 11) SEO, Content, and Trust System

### SEO
- City pages (`/city/:name`) with localized copy (high intent)
- Structured data: Organization, Product/Service, FAQ schema
- Fast LCP: optimized hero, minimal JS

### Trust content blocks (must exist)
- “What’s included” checklist
- “Cancellation policy” in plain language
- “Service response times” (SLA)
- Real testimonials (by city)
- Transparent pricing, no hidden costs

---

## 12) Analytics & experimentation (Revenue ops)

### Core events
- `pincode_check_started`, `pincode_check_success`
- `quiz_started`, `quiz_completed`
- `plan_viewed`, `plan_selected`
- `checkout_started`, `slot_selected`
- `payment_initiated`, `payment_success`, `payment_failed`
- `lead_captured`, `whatsapp_clicked`, `callback_requested`
- `addon_viewed`, `addon_added`
- `ticket_created`, `ticket_resolved`, `csat_submitted`

### Experiment ideas (A/B tests)
- Hero: “Plans from ₹X” vs “Installed in 48 hours”
- Quiz placement: section #2 vs #3 on homepage
- Plan card: “Most Popular” badge vs “Best for Borewell”
- Checkout: one-page vs 2-step
- WhatsApp entry points: early vs late

---

## 13) Accessibility & performance checklist
- Minimum contrast: WCAG AA
- Keyboard navigation for all inputs and modals
- Reduced motion mode support
- Image optimization (Next/Image), avoid autoplay videos
- JS budget discipline on landing pages

---

## 14) Delivery roadmap (practical)
**Phase 1 (Revenue Funnel):** Home + Plans + Availability + Quiz + Checkout + Confirmation  
**Phase 2 (Retention):** Customer Portal (subscription + payments + service tickets)  
**Phase 3 (Ops):** Admin workspace core modules  
**Phase 4 (Growth):** SEO city pages + experiments + referral program

---

## 15) Appendix: CSS Variables (Design Tokens)
```css
:root{
  --primary:#1E40AF;
  --accent:#0EA5A4;
  --mint:#A7F3D0;

  --bg:#FFFFFF;
  --surface:#FFFFFF;
  --surface-2:#F8FAFC;
  --text:#0F172A;
  --text-2:#334155;
  --border:#E2E8F0;

  --success:#16A34A;
  --warning:#F59E0B;
  --error:#EF4444;
  --info:#2563EB;

  --radius-card:16px;
  --radius-btn:14px;

  --shadow-sm: 0 1px 2px rgba(2,6,23,.08);
  --shadow-md: 0 10px 20px rgba(2,6,23,.10);
  --shadow-lg: 0 24px 60px rgba(2,6,23,.16);
}
```

---

## 16) Appendix: CTA Copy Bank (high converting)
- **Primary:** Check availability • Subscribe now • Book installation
- **Trust:** No hidden costs • Service included • Filter replacement included
- **Assurance:** Talk on WhatsApp • Get a callback • View service promise
- **Upsell:** Upgrade for better taste • Add copper benefits • Save with prepaid

---

### Notes / Dependencies
- Final copy and policies depend on your exact commercial terms (deposit, trial, cancellation, relocation).
- Payment UX depends on Cashfree checkout/callback implementation and whether mandates are used.
