# Mobile Subscriber App

## Overview

React Native mobile application for subscribers to manage their subscriptions, billing, payments, tickets, and profile.

## Technology Stack

- **Framework**: React Native
- **Language**: TypeScript
- **Navigation**: React Navigation
- **State Management**: Redux Toolkit or Zustand
- **HTTP Client**: Axios
- **Storage**: AsyncStorage / SecureStore

## Features

- User authentication (OTP + Password)
- Dashboard with subscription overview
- Subscription management
- View and pay invoices
- Payment history
- Create and track service tickets
- Profile management
- Push notifications (optional)

## Project Structure

```
apps/mobile-subscriber/
├── src/
│   ├── App.tsx                 # Root component
│   ├── navigation/
│   │   ├── AppNavigator.tsx    # Main navigation
│   │   └── types.ts            # Navigation types
│   ├── screens/
│   │   ├── Auth/               # Login, OTP verification
│   │   ├── Dashboard/          # Home dashboard
│   │   ├── Subscription/       # Subscription details
│   │   ├── Billing/            # Invoices list
│   │   ├── Payments/           # Payment history
│   │   ├── Tickets/            # Ticket list and create
│   │   └── Profile/            # Profile and settings
│   ├── components/
│   │   ├── common/             # Reusable components
│   │   ├── forms/              # Form components
│   │   └── cards/              # Card components
│   ├── services/
│   │   ├── api/                # API client
│   │   ├── auth/               # Auth service
│   │   └── storage/            # Local storage
│   ├── hooks/                  # Custom hooks
│   ├── store/                  # State management
│   ├── types/                  # TypeScript types
│   └── utils/                  # Utility functions
├── android/                    # Android native code
└── ios/                        # iOS native code
```

## API Integration

All API calls go through API Gateway:
- auth-service: Authentication
- subscription-service: Subscriptions
- billing-service: Invoices
- payment-service: Payments
- ticket-service: Tickets
- subscriber-service: Profile

## Environment Variables

- `API_URL`: API Gateway URL
- `APP_ENV`: Environment (dev, staging, prod)

## Development

```bash
npm install
npm run android  # For Android
npm run ios      # For iOS
```

## Authentication

- OTP-based login
- JWT token storage in secure storage
- Token refresh mechanism
- Biometric authentication (optional)

## Platform-Specific Notes

### Android
- Minimum SDK: 21
- Target SDK: 33+

### iOS
- Minimum iOS: 13.0
- Supports iPhone and iPad
