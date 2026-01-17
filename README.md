# Ashva Experts Unified Digital Ecosystem

## Overview

This repository contains the complete microservices architecture for the Ashva Experts platform, including:

- **15 Microservices**: Independent, deployable services handling specific business domains
- **3 Web Applications**: Public website, Admin portal, and CMS
- **2 Mobile Applications**: Subscriber app and Technician app (React Native)
- **Infrastructure**: Docker Compose, Nginx, Observability stack
- **Shared Libraries**: Common code for Python and TypeScript

## Architecture

This is a microservices-based architecture where each major capability runs as an independently deployable service. Services communicate via:
- Synchronous REST APIs (through API Gateway)
- Asynchronous events (via Redis Streams message broker)

## Project Structure

```
ashwaexperts/
├── services/              # All microservices (15 services)
├── apps/                  # Frontend and mobile applications
│   ├── web-public/        # Public website (Next.js)
│   ├── web-admin-portal/  # Admin operations platform (Next.js)
│   ├── web-cms/           # CMS for leads and content (Next.js)
│   ├── mobile-subscriber/ # Subscriber mobile app (React Native)
│   └── mobile-technician/ # Technician mobile app (React Native)
├── infra/                 # Infrastructure configurations
│   ├── nginx/             # Reverse proxy configuration
│   ├── docker-compose/    # Container orchestration
│   ├── db-migrations/     # Database schema initialization
│   └── observability/     # Prometheus, Grafana, Loki
├── docs/                  # Documentation
│   ├── architecture/      # Architecture diagrams and decisions
│   ├── api/               # API documentation
│   ├── runbooks/          # Operational procedures
│   └── development/       # Development guides
└── shared/                # Shared libraries and utilities
    ├── python/            # Common Python code
    └── typescript/        # Common TypeScript code
```

## Microservices

1. **gateway-service**: API Gateway for routing and authentication
2. **auth-service**: User authentication, OTP, JWT tokens
3. **lead-service**: Lead capture and pipeline management
4. **content-service**: Case studies and SEO content
5. **subscriber-service**: Subscriber profiles and addresses
6. **plan-service**: Subscription plan catalog
7. **subscription-service**: Subscription lifecycle management
8. **billing-service**: Invoice generation, proration, GST invoicing
9. **payment-service**: Cashfree integration, webhooks, payment processing
10. **ticket-service**: Ticket management and SLA tracking
11. **assignment-service**: Technician job assignments
12. **media-service**: File uploads (photos, PDFs, invoices)
13. **notification-service**: SMS (MSG91) and Email (SMTP)
14. **reporting-service**: Dashboards and analytics
15. **audit-service**: Centralized audit logging

## Quick Start

### Prerequisites

- Docker and Docker Compose
- Python 3.11+
- Node.js 18+
- PostgreSQL 14+
- Redis 7+

### Local Development

1. Clone the repository
2. Copy environment files:
   ```bash
   cp infra/docker-compose/.env.example infra/docker-compose/.env
   ```
3. Start infrastructure services:
   ```bash
   cd infra/docker-compose
   docker-compose up -d postgres redis minio
   ```
4. Run database migrations for each service
5. Start individual services (see each service's README.md)

### Running Services

Each service has its own README.md with detailed setup instructions. See:
- `services/{service-name}/README.md` for service-specific documentation

## Technology Stack

- **Backend**: Python FastAPI
- **Frontend**: Next.js (TypeScript)
- **Mobile**: React Native (TypeScript)
- **Database**: PostgreSQL (schema-per-service)
- **Cache/Queue**: Redis (Streams for messaging)
- **Object Storage**: MinIO (S3-compatible)
- **API Gateway**: Custom gateway service + Nginx
- **Observability**: Prometheus, Grafana, Loki

## Documentation

- [Architecture Overview](docs/architecture/overview.md)
- [API Documentation](docs/api/)
- [Development Guide](docs/development/setup.md)
- [Deployment Guide](docs/runbooks/deployment.md)

## Contributing

See [Contributing Guide](docs/development/contributing.md) for development standards and practices.

## License

[Add license information]
