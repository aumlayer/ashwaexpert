---
name: Phased Development Plan and Roadmap
overview: Create a comprehensive phased development plan covering all functionalities, a detailed roadmap with milestones, and a project status tracking document for the Ashva Experts platform.
todos:
  - id: phase1-foundation
    content: "Complete Phase 1: Foundation & Infrastructure Setup - Infrastructure, core services, observability, development tools"
    status: pending
  - id: phase2-auth
    content: "Complete Phase 2: Authentication & User Management - Auth service, subscriber service, gateway integration"
    status: pending
    dependencies:
      - phase1-foundation
  - id: phase3-website-cms
    content: "Complete Phase 3: Public Website & CMS - Lead service, content service, public website, CMS app"
    status: pending
    dependencies:
      - phase2-auth
  - id: phase4-subscriptions
    content: "Complete Phase 4: Plans & Subscriptions - Plan service, subscription service, admin UI"
    status: pending
    dependencies:
      - phase2-auth
  - id: phase5-billing-payments
    content: "Complete Phase 5: Billing & Payments - Billing service, payment service, Cashfree integration, invoice PDFs"
    status: pending
    dependencies:
      - phase4-subscriptions
  - id: phase6-ticketing
    content: "Complete Phase 6: Ticketing & Field Operations - Ticket service, assignment service, admin UI"
    status: pending
    dependencies:
      - phase2-auth
      - phase5-billing-payments
  - id: phase7-mobile
    content: "Complete Phase 7: Mobile Applications - Subscriber app and Technician app (React Native)"
    status: pending
    dependencies:
      - phase2-auth
      - phase4-subscriptions
      - phase5-billing-payments
      - phase6-ticketing
  - id: phase8-reporting
    content: "Complete Phase 8: Reporting & Analytics - Reporting service, dashboards, analytics"
    status: pending
    dependencies:
      - phase4-subscriptions
      - phase5-billing-payments
      - phase6-ticketing
  - id: phase9-production
    content: "Complete Phase 9: Observability & Production Readiness - Audit service, enhanced observability, security, deployment"
    status: pending
    dependencies:
      - phase1-foundation
      - phase2-auth
      - phase3-website-cms
      - phase4-subscriptions
      - phase5-billing-payments
      - phase6-ticketing
      - phase7-mobile
      - phase8-reporting
---

# Ashva Experts - Phased Development Plan & Roadmap

## Overview

This document outlines the complete phased development plan for the Ashva Experts Unified Digital Ecosystem. The development is organized into 9 phases, each building upon the previous phase to deliver a fully functional platform.

## Development Phases

### Phase 1: Foundation & Infrastructure Setup

**Duration**: 2-3 weeks

**Priority**: Critical

**Dependencies**: None

#### Objectives

- Set up development environment and infrastructure
- Establish core services foundation
- Configure observability and monitoring

#### Tasks

**1.1 Infrastructure Setup**

- [ ] Set up PostgreSQL database cluster with schema-per-service
- [ ] Configure Redis for caching, rate limiting, and message broker
- [ ] Set up MinIO for object storage
- [ ] Configure Docker Compose for local development
- [ ] Set up Nginx reverse proxy configuration
- [ ] Create database migration framework (Alembic)
- [ ] Set up CI/CD pipeline basics

**1.2 Core Services Foundation**

- [ ] Implement gateway-service (routing, auth validation, rate limiting)
- [ ] Set up service discovery and health checks
- [ ] Implement correlation ID tracking
- [ ] Configure CORS policies
- [ ] Set up request/response logging

**1.3 Observability Foundation**

- [ ] Set up Prometheus for metrics collection
- [ ] Configure Grafana dashboards
- [ ] Set up Loki for log aggregation
- [ ] Implement structured logging (JSON format)
- [ ] Create basic health check endpoints for all services

**1.4 Development Tools**

- [ ] Set up shared Python libraries structure
- [ ] Set up shared TypeScript libraries structure
- [ ] Create API client generators
- [ ] Set up testing frameworks (pytest, jest)
- [ ] Configure linting and code formatting

**Deliverables**

- Working infrastructure (PostgreSQL, Redis, MinIO)
- Gateway service routing requests
- Basic observability stack
- Development environment ready

---

### Phase 2: Authentication & User Management

**Duration**: 2-3 weeks

**Priority**: Critical

**Dependencies**: Phase 1

#### Objectives

- Implement authentication system
- User registration and management
- Role-based access control
- OTP and password authentication

#### Tasks

**2.1 Auth Service Implementation**

- [ ] Implement user registration (email, phone, password)
- [ ] Implement password hashing (bcrypt/argon2)
- [ ] Implement OTP generation and verification
- [ ] Implement JWT token issuance (access + refresh)
- [ ] Implement token refresh mechanism
- [ ] Implement session management
- [ ] Implement role management (admin, subscriber, technician, cms_user)
- [ ] Implement login history tracking
- [ ] Set up MSG91 integration for SMS OTP
- [ ] Set up SMTP integration for email OTP

**2.2 Subscriber Service Implementation**

- [ ] Implement subscriber profile creation
- [ ] Implement subscriber profile management
- [ ] Implement address management (billing, service)
- [ ] Implement GST/PAN number storage
- [ ] Implement subscriber search and filtering
- [ ] Handle UserCreated events from auth-service

**2.3 Gateway Auth Integration**

- [ ] Implement JWT token validation in gateway
- [ ] Implement role-based route protection
- [ ] Implement token introspection endpoint
- [ ] Configure public vs protected routes

**2.4 Testing**

- [ ] Unit tests for auth flows
- [ ] Integration tests for registration/login
- [ ] OTP delivery testing
- [ ] Token refresh testing

**Deliverables**

- Working authentication system
- User registration and login
- OTP verification (SMS + Email)
- JWT token management
- Subscriber profile management
- Role-based access control

---

### Phase 3: Public Website & CMS (Lead Generation)

**Duration**: 3-4 weeks

**Priority**: High

**Dependencies**: Phase 2 (for CMS auth)

#### Objectives

- Build conversion-focused public website
- Implement CMS for lead and content management
- Enable lead capture and tracking

#### Tasks

**3.1 Lead Service Implementation**

- [ ] Implement lead creation endpoint (public)
- [ ] Implement lead pipeline workflow (New → Contacted → Qualified → Closed)
- [ ] Implement lead status management
- [ ] Implement lead assignment to team members
- [ ] Implement lead activity tracking
- [ ] Implement lead source attribution
- [ ] Implement lead search and filtering
- [ ] Emit LeadCreated events

**3.2 Content Service Implementation**

- [ ] Implement case study CRUD operations
- [ ] Implement SEO metadata management (title, description, keywords, OG tags)
- [ ] Implement content publishing workflow (draft → published)
- [ ] Implement slug generation and uniqueness
- [ ] Implement public listing endpoint (published only)
- [ ] Implement detail view by slug
- [ ] Implement content caching (Redis)
- [ ] Emit CaseStudyPublished events

**3.3 Public Website (Next.js)**

- [ ] Design and implement homepage with hero section
- [ ] Implement services page (RO on Rent & Maintenance, Multi-brand Repair)
- [ ] Implement pricing & plans page
- [ ] Implement testimonials section
- [ ] Implement about page
- [ ] Implement FAQs page
- [ ] Implement contact/book service page with enquiry form
- [ ] Implement case studies listing page
- [ ] Implement case study detail pages
- [ ] Implement responsive design (mobile-first)
- [ ] Implement SEO optimization (meta tags, structured data)
- [ ] Implement click-to-call functionality
- [ ] Implement WhatsApp integration
- [ ] Implement conversion tracking
- [ ] Optimize for Core Web Vitals

**3.4 CMS Web Application (Next.js)**

- [ ] Implement CMS login (auth integration)
- [ ] Implement lead pipeline dashboard
  - [ ] Lead list with filtering (status, source, assigned_to)
  - [ ] Lead detail view
  - [ ] Lead status update workflow
  - [ ] Lead assignment interface
  - [ ] Lead activity timeline
- [ ] Implement case study management
  - [ ] Create/edit case study form
  - [ ] SEO metadata editor
  - [ ] Image upload for featured image
  - [ ] Publish/unpublish functionality
  - [ ] Case study list view
- [ ] Implement content preview

**3.5 Notification Integration**

- [ ] Send confirmation SMS/email on lead creation
- [ ] Send internal alerts for new leads (if configured)

**3.6 Testing**

- [ ] Test lead capture flow end-to-end
- [ ] Test CMS workflows
- [ ] Test SEO metadata rendering
- [ ] Test responsive design on multiple devices

**Deliverables**

- Fully functional public website
- CMS for lead and case study management
- Lead capture and tracking system
- SEO-optimized content pages

---

### Phase 4: Core SaaS Platform - Plans & Subscriptions

**Duration**: 3-4 weeks

**Priority**: Critical

**Dependencies**: Phase 2

#### Objectives

- Implement plan catalog management
- Implement subscription lifecycle
- Enable subscription creation and management

#### Tasks

**4.1 Plan Service Implementation**

- [ ] Implement plan CRUD operations
- [ ] Implement plan components (features, limits, pricing)
- [ ] Implement plan activation/deactivation
- [ ] Implement plan sorting and featured plans
- [ ] Implement public plan listing endpoint
- [ ] Implement plan detail endpoint
- [ ] Implement plan caching
- [ ] Emit PlanUpdated events

**4.2 Subscription Service Implementation**

- [ ] Implement subscription creation
- [ ] Implement billing cycle selection (user-selectable months)
- [ ] Implement subscription status management (active, paused, cancelled, expired)
- [ ] Implement plan change (upgrade/downgrade)
- [ ] Implement subscription pause/resume
- [ ] Implement cancellation request (with one-month notice enforcement)
- [ ] Implement subscription renewal logic
- [ ] Implement subscription event history
- [ ] Handle plan changes and trigger proration events
- [ ] Emit SubscriptionCreated, SubscriptionChanged, SubscriptionPaused, SubscriptionCancelled events

**4.3 Admin Portal - Plans & Subscriptions**

- [ ] Implement plan management UI
  - [ ] Create/edit plan form
  - [ ] Plan components editor
  - [ ] Plan list with activation toggle
- [ ] Implement subscription management UI
  - [ ] Subscription list with filtering
  - [ ] Subscription detail view
  - [ ] Plan change interface
  - [ ] Pause/resume subscription
  - [ ] Cancellation request handling
  - [ ] Subscription history view

**4.4 Testing**

- [ ] Test subscription creation flow
- [ ] Test plan change with proration
- [ ] Test cancellation with notice period
- [ ] Test subscription pause/resume

**Deliverables**

- Plan catalog system
- Subscription lifecycle management
- Admin UI for plans and subscriptions
- Subscription event tracking

---

### Phase 5: Billing & Payments

**Duration**: 4-5 weeks

**Priority**: Critical

**Dependencies**: Phase 4

#### Objectives

- Implement invoice generation with GST
- Implement proration calculations
- Integrate Cashfree payment gateway
- Enable online and offline payments

#### Tasks

**5.1 Billing Service Implementation**

- [ ] Implement invoice generation
- [ ] Implement proration calculation engine
  - [ ] Daily proration logic
  - [ ] Plan change proration
  - [ ] Mid-cycle start proration
  - [ ] Pause period proration
- [ ] Implement GST calculation (18%)
- [ ] Implement invoice numbering (FY26-27-INV-000001 format)
- [ ] Implement invoice sequence management
- [ ] Implement credit ledger for advance payments
- [ ] Implement credit application to invoices
- [ ] Implement invoice status management (draft, issued, paid, overdue, cancelled)
- [ ] Implement invoice PDF generation trigger
- [ ] Implement overdue detection
- [ ] Emit InvoiceGenerated, InvoicePaid, InvoiceOverdue events
- [ ] Handle PaymentSucceeded events

**5.2 Payment Service Implementation**

- [ ] Integrate Cashfree SDK
- [ ] Implement payment order creation
- [ ] Implement payment status tracking
- [ ] Implement Cashfree webhook handler
  - [ ] Webhook signature validation
  - [ ] Idempotency enforcement
  - [ ] Raw event storage
- [ ] Implement payment retry logic
- [ ] Implement offline payment entry
- [ ] Implement offline payment verification
- [ ] Implement payment reconciliation
- [ ] Support UPI, cards, netbanking
- [ ] Emit PaymentSucceeded, PaymentFailed events
- [ ] Handle InvoiceGenerated events

**5.3 Media Service - Invoice PDFs**

- [ ] Implement invoice PDF template
- [ ] Implement PDF generation (using reportlab or similar)
- [ ] Implement PDF storage in MinIO
- [ ] Implement secure PDF download URLs
- [ ] Handle invoice PDF generation requests from billing-service

**5.4 Notification Service - Payment Notifications**

- [ ] Create payment success template (SMS + Email)
- [ ] Create payment failure template
- [ ] Create invoice generated template
- [ ] Create due reminder template
- [ ] Create overdue reminder template
- [ ] Handle PaymentSucceeded, PaymentFailed, InvoiceGenerated events

**5.5 Admin Portal - Billing & Payments**

- [ ] Implement invoice management UI
  - [ ] Invoice list with filtering
  - [ ] Invoice detail view with line items
  - [ ] Invoice PDF download
  - [ ] Manual invoice generation
- [ ] Implement payment tracking UI
  - [ ] Payment list with status filtering
  - [ ] Payment detail view
  - [ ] Offline payment entry form
  - [ ] Payment reconciliation view
- [ ] Implement credit ledger UI
  - [ ] Credit balance view
  - [ ] Credit transaction history
  - [ ] Manual credit entry

**5.6 Testing**

- [ ] Test invoice generation with proration
- [ ] Test GST calculation
- [ ] Test Cashfree integration (sandbox)
- [ ] Test webhook handling
- [ ] Test offline payment flow
- [ ] Test credit application

**Deliverables**

- Invoice generation with GST
- Proration calculation engine
- Cashfree payment integration
- Invoice PDF generation
- Payment tracking and reconciliation
- Payment notifications

---

### Phase 6: Ticketing & Field Operations

**Duration**: 4-5 weeks

**Priority**: High

**Dependencies**: Phase 2, Phase 5

#### Objectives

- Implement service ticket system
- Implement technician assignment
- Enable field operations workflow

#### Tasks

**6.1 Ticket Service Implementation**

- [ ] Implement ticket creation (installation, service, repair)
- [ ] Implement ticket status workflow (created → assigned → in_progress → completed → closed)
- [ ] Implement priority management (low, medium, high, urgent)
- [ ] Implement SLA configuration per ticket type and priority
- [ ] Implement SLA timer calculation
- [ ] Implement SLA breach detection
- [ ] Implement ticket status history
- [ ] Implement completion notes storage
- [ ] Implement ticket search and filtering
- [ ] Emit TicketCreated, TicketStatusChanged, SLABreached events
- [ ] Handle JobAssigned events

**6.2 Assignment Service Implementation**

- [ ] Implement ticket-to-technician assignment
- [ ] Implement job queue per technician
- [ ] Implement assignment status (assigned, accepted, rejected)
- [ ] Implement assignment history
- [ ] Implement technician workload view
- [ ] Emit JobAssigned events
- [ ] Handle TicketCreated events (for auto-assignment if configured)

**6.3 Media Service - Ticket Photos**

- [ ] Implement photo upload endpoint
- [ ] Implement photo compression
- [ ] Implement multiple photo support
- [ ] Implement secure photo access URLs
- [ ] Handle ticket photo uploads

**6.4 Notification Service - Ticket Notifications**

- [ ] Create ticket created template
- [ ] Create job assigned template (for technicians)
- [ ] Create job completed template (for subscribers)
- [ ] Create SLA breach escalation template
- [ ] Handle TicketCreated, JobAssigned, TicketStatusChanged events

**6.5 Admin Portal - Tickets & Assignments**

- [ ] Implement ticket management UI
  - [ ] Ticket list with filtering (status, type, priority, SLA status)
  - [ ] Ticket detail view
  - [ ] Ticket creation form
  - [ ] Status update interface
  - [ ] SLA status indicators
- [ ] Implement assignment UI
  - [ ] Technician list view
  - [ ] Assignment interface
  - [ ] Job queue view per technician
  - [ ] Workload dashboard

**6.6 Testing**

- [ ] Test ticket creation flow
- [ ] Test assignment workflow
- [ ] Test SLA calculation
- [ ] Test photo upload
- [ ] Test status transitions

**Deliverables**

- Complete ticketing system
- Technician assignment system
- SLA tracking and alerts
- Photo upload for completion proof

---

### Phase 7: Mobile Applications

**Duration**: 5-6 weeks

**Priority**: High

**Dependencies**: Phase 2, Phase 4, Phase 5, Phase 6

#### Objectives

- Build subscriber mobile app
- Build technician mobile app
- Enable mobile-first operations

#### Tasks

**7.1 Subscriber Mobile App (React Native)**

- [ ] Set up React Native project structure
- [ ] Implement navigation (React Navigation)
- [ ] Implement authentication screens
  - [ ] Login screen (OTP + Password)
  - [ ] OTP verification screen
  - [ ] Profile screen
- [ ] Implement dashboard
  - [ ] Subscription overview
  - [ ] Quick actions
  - [ ] Recent activity
- [ ] Implement subscription screens
  - [ ] Subscription details
  - [ ] Plan information
  - [ ] Billing cycle display
- [ ] Implement billing screens
  - [ ] Invoice list
  - [ ] Invoice detail
  - [ ] Invoice PDF view
- [ ] Implement payment screens
  - [ ] Payment initiation
  - [ ] Payment status
  - [ ] Payment history
- [ ] Implement ticket screens
  - [ ] Ticket list
  - [ ] Create ticket form
  - [ ] Ticket detail with status
  - [ ] Ticket history
- [ ] Implement profile screens
  - [ ] Profile view/edit
  - [ ] Address management
  - [ ] Settings
- [ ] Implement push notifications (optional)
- [ ] Implement offline support (basic)
- [ ] Android build and testing
- [ ] iOS build and testing

**7.2 Technician Mobile App (React Native)**

- [ ] Set up React Native project structure
- [ ] Implement navigation
- [ ] Implement authentication screens
- [ ] Implement jobs list screen
  - [ ] Assigned jobs
  - [ ] Job status indicators
  - [ ] Priority and SLA indicators
  - [ ] Pull-to-refresh
- [ ] Implement job detail screen
  - [ ] Customer information
  - [ ] Job description
  - [ ] Location details
  - [ ] Scheduled date/time
  - [ ] Status update buttons
- [ ] Implement job completion screen
  - [ ] Completion notes input
  - [ ] Photo capture/upload (multiple)
  - [ ] Completion submission
- [ ] Implement camera integration
  - [ ] Photo capture
  - [ ] Photo preview
  - [ ] Multiple photo selection
- [ ] Implement profile screen
- [ ] Implement offline job sync (optional)
- [ ] Android build and testing
- [ ] iOS build and testing

**7.3 Mobile App Infrastructure**

- [ ] Set up API client for mobile apps
- [ ] Implement token storage (secure storage)
- [ ] Implement token refresh mechanism
- [ ] Implement error handling
- [ ] Implement loading states
- [ ] Implement network status detection

**7.4 Testing**

- [ ] Test authentication flows
- [ ] Test subscription management
- [ ] Test payment flows
- [ ] Test ticket creation and tracking
- [ ] Test job assignment and completion
- [ ] Test on multiple devices and OS versions

**Deliverables**

- Subscriber mobile app (Android + iOS)
- Technician mobile app (Android + iOS)
- Mobile API integration
- App store deployment readiness

---

### Phase 8: Reporting & Analytics

**Duration**: 2-3 weeks

**Priority**: Medium

**Dependencies**: Phase 4, Phase 5, Phase 6

#### Objectives

- Implement reporting service
- Build analytics dashboards
- Enable business insights

#### Tasks

**8.1 Reporting Service Implementation**

- [ ] Set up event consumption from message broker
- [ ] Implement projection building
  - [ ] Subscription analytics projection
  - [ ] Ticket analytics projection
  - [ ] Revenue analytics projection
  - [ ] SLA analytics projection
- [ ] Implement materialized views
- [ ] Implement dashboard metrics queries
- [ ] Implement revenue reporting
- [ ] Implement subscription metrics
- [ ] Implement ticket metrics
- [ ] Implement SLA compliance metrics
- [ ] Implement date range filtering
- [ ] Implement data aggregation (daily, monthly, yearly)

**8.2 Admin Portal - Dashboards**

- [ ] Implement main dashboard
  - [ ] Key metrics cards (total subscribers, active subscriptions, revenue, pending invoices, open tickets)
  - [ ] Revenue trend chart
  - [ ] Subscription growth chart
  - [ ] Ticket pipeline visualization
  - [ ] Recent activity feed
- [ ] Implement subscription analytics dashboard
  - [ ] Subscription by plan
  - [ ] Subscription trends
  - [ ] Churn analysis
- [ ] Implement revenue dashboard
  - [ ] Revenue by period
  - [ ] Revenue by plan
  - [ ] Payment success rate
- [ ] Implement ticket analytics dashboard
  - [ ] Tickets by type
  - [ ] Tickets by priority
  - [ ] Resolution time trends
  - [ ] SLA compliance rate
- [ ] Implement technician productivity dashboard
  - [ ] Jobs completed per technician
  - [ ] Average resolution time
  - [ ] SLA adherence

**8.3 Testing**

- [ ] Test projection updates
- [ ] Test dashboard queries performance
- [ ] Test date range filtering
- [ ] Test data accuracy

**Deliverables**

- Reporting service with projections
- Comprehensive admin dashboards
- Business metrics and insights

---

### Phase 9: Observability & Production Readiness

**Duration**: 2-3 weeks

**Priority**: Critical

**Dependencies**: All previous phases

#### Objectives

- Complete observability setup
- Implement audit logging
- Production deployment preparation
- Performance optimization

#### Tasks

**9.1 Audit Service Implementation**

- [ ] Implement audit log append endpoint
- [ ] Implement audit log querying
- [ ] Implement retention policy (90 days)
- [ ] Implement cleanup job
- [ ] Integrate audit logging in all services
- [ ] Implement audit trail view in admin portal

**9.2 Enhanced Observability**

- [ ] Complete Prometheus metrics for all services
- [ ] Create comprehensive Grafana dashboards
  - [ ] Service health dashboard
  - [ ] API latency dashboard
  - [ ] Error rates dashboard
  - [ ] Payment webhook dashboard
  - [ ] Notification delivery dashboard
- [ ] Set up alerting rules
- [ ] Configure log aggregation for all services
- [ ] Implement distributed tracing (optional)

**9.3 Performance Optimization**

- [ ] Implement caching strategies
- [ ] Optimize database queries
- [ ] Add database indexes
- [ ] Optimize API response times
- [ ] Implement pagination everywhere
- [ ] Optimize image handling
- [ ] Implement CDN for static assets (if needed)

**9.4 Security Hardening**

- [ ] Security audit of all endpoints
- [ ] Implement rate limiting on all endpoints
- [ ] Validate input sanitization
- [ ] Implement output encoding
- [ ] Review and secure environment variables
- [ ] Implement security headers
- [ ] Set up SSL/TLS certificates
- [ ] Implement backup encryption

**9.5 Production Deployment**

- [ ] Set up production VPS
- [ ] Configure production Docker Compose
- [ ] Set up production database
- [ ] Configure production MinIO
- [ ] Set up production Nginx with SSL
- [ ] Configure domain names and DNS
- [ ] Set up automated backups
- [ ] Create deployment runbook
- [ ] Set up monitoring and alerting
- [ ] Load testing
- [ ] Disaster recovery plan

**9.6 Documentation**

- [ ] Complete API documentation
- [ ] Create user guides
- [ ] Create admin runbooks
- [ ] Document deployment procedures
- [ ] Create troubleshooting guides

**9.7 Testing & QA**

- [ ] End-to-end testing of all flows
- [ ] Performance testing
- [ ] Security testing
- [ ] User acceptance testing
- [ ] Load testing

**Deliverables**

- Complete observability stack
- Audit logging system
- Production-ready deployment
- Comprehensive documentation
- Performance optimized system

---

## Detailed Roadmap

### Timeline Overview (Total: 24-30 weeks)

```
Phase 1: Foundation (Weeks 1-3)
Phase 2: Authentication (Weeks 3-6)
Phase 3: Public Website & CMS (Weeks 6-10)
Phase 4: Plans & Subscriptions (Weeks 10-14)
Phase 5: Billing & Payments (Weeks 14-19)
Phase 6: Ticketing & Field Ops (Weeks 19-24)
Phase 7: Mobile Apps (Weeks 20-26) [Parallel with Phase 6]
Phase 8: Reporting (Weeks 24-27)
Phase 9: Production Readiness (Weeks 27-30)
```

### Critical Path Dependencies

```
Phase 1 → Phase 2 → Phase 3
Phase 2 → Phase 4 → Phase 5
Phase 2, Phase 5 → Phase 6
Phase 2, Phase 4, Phase 5, Phase 6 → Phase 7
Phase 4, Phase 5, Phase 6 → Phase 8
All Phases → Phase 9
```

### Milestones

**M1: Infrastructure Ready** (End of Phase 1)

- All infrastructure services running
- Gateway routing working
- Basic observability

**M2: Authentication Complete** (End of Phase 2)

- Users can register and login
- OTP working
- Role-based access

**M3: Lead Generation Live** (End of Phase 3)

- Public website live
- Lead capture working
- CMS operational

**M4: Core SaaS Ready** (End of Phase 4)

- Plans and subscriptions working
- Admin can manage subscriptions

**M5: Payments Integrated** (End of Phase 5)

- Invoicing working
- Cashfree integrated
- Payments processing

**M6: Operations Platform** (End of Phase 6)

- Ticketing system live
- Technician assignment working
- Field operations enabled

**M7: Mobile Apps Live** (End of Phase 7)

- Subscriber app published
- Technician app published

**M8: Analytics Ready** (End of Phase 8)

- Dashboards operational
- Reporting working

**M9: Production Launch** (End of Phase 9)

- System production-ready
- All features complete
- Monitoring and alerts active

---

## Risk Mitigation

### Technical Risks

- **Payment Gateway Integration**: Start early with Cashfree sandbox, have fallback plan
- **Mobile App Complexity**: Build MVP first, iterate based on feedback
- **Performance at Scale**: Load test early, optimize bottlenecks

### Business Risks

- **Feature Creep**: Stick to phased plan, defer non-critical features
- **Timeline Delays**: Build buffer time, prioritize critical path
- **Third-party Dependencies**: Have backup options (MSG91, SMTP providers)

---

## Success Criteria

### Phase Completion Criteria

Each phase is considered complete when:

- All tasks in the phase are completed
- Unit and integration tests pass (>80% coverage)
- Code review completed
- Documentation updated
- Demo/validation completed

### Overall Project Success

- All 9 phases completed
- System handles expected load
- Security audit passed
- User acceptance testing passed
- Production deployment successful
- Monitoring and alerts operational