# Web Admin Portal - SaaS Operations Platform

## Overview

Admin web application built with Next.js 13+ for managing subscribers, subscriptions, plans, billing, payments, tickets, assignments, and reports.

## Technology Stack

- **Framework**: Next.js 13+ (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State Management**: Zustand or Redux
- **Authentication**: JWT tokens

## Features

- Dashboard with key metrics
- Subscriber management
- Subscription management
- Plan management
- Billing and invoice management
- Payment tracking
- Ticket management
- Technician assignment
- Reports and analytics
- User authentication

## Project Structure

```
apps/web-admin-portal/
├── src/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── (auth)/
│   │   │   └── login/          # Login page
│   │   └── (dashboard)/
│   │       ├── dashboard/      # Main dashboard
│   │       ├── subscribers/    # Subscriber management
│   │       ├── subscriptions/  # Subscription management
│   │       ├── plans/          # Plan management
│   │       ├── billing/        # Billing and invoices
│   │       ├── payments/       # Payment tracking
│   │       ├── tickets/        # Ticket management
│   │       ├── assignments/    # Technician assignments
│   │       └── reports/        # Reports and analytics
│   ├── components/
│   │   ├── dashboard/          # Dashboard components
│   │   ├── subscribers/        # Subscriber components
│   │   ├── billing/             # Billing components
│   │   ├── tickets/            # Ticket components
│   │   └── common/             # Common components
│   ├── lib/
│   │   ├── api/                # API client
│   │   ├── auth/               # Auth utilities
│   │   └── utils/              # Utilities
│   ├── hooks/                  # Custom hooks
│   ├── types/                  # TypeScript types
│   └── store/                  # State management
└── public/
```

## API Integration

Integrates with all microservices through API Gateway:
- auth-service: Authentication
- subscriber-service: Subscriber management
- subscription-service: Subscription management
- plan-service: Plan management
- billing-service: Invoices
- payment-service: Payments
- ticket-service: Tickets
- assignment-service: Assignments
- reporting-service: Reports

## Environment Variables

- `NEXT_PUBLIC_API_URL`: API Gateway URL
- `NEXT_PUBLIC_APP_URL`: Admin portal URL

## Development

```bash
npm install
npm run dev
```

## Authentication

Uses JWT tokens stored in httpOnly cookies. Login flow:
1. User submits credentials
2. Receives access token and refresh token
3. Tokens stored in secure cookies
4. API calls include token in Authorization header
