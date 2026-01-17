# API Client

Generated or manually maintained TypeScript API clients for microservices.

## Usage

```typescript
import { AuthClient, BillingClient } from '@ashvaexperts/api-client';

const authClient = new AuthClient({ baseURL: 'https://api.ashvaexperts.com' });
```

## Clients

- Auth API client
- Billing API client
- Payment API client
- Ticket API client
- ... (one per service)

## Generation

API clients can be generated from OpenAPI specifications using openapi-generator or similar tools.
