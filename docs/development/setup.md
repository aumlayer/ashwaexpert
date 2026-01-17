# Development Setup Guide

## Prerequisites

- Docker and Docker Compose
- Python 3.11+
- Node.js 18+
- PostgreSQL 14+ (optional, can use Docker)
- Redis 7+ (optional, can use Docker)

## Initial Setup

1. **Clone Repository**
   ```bash
   git clone <repository-url>
   cd ashwaexperts
   ```

2. **Start Infrastructure**
   ```bash
   cd infra/docker-compose
   cp .env.example .env
   # Edit .env with your configuration
   docker-compose up -d postgres redis minio
   ```

3. **Initialize Database Schemas**
   ```bash
   psql -U ashva -d ashva_db -f ../db-migrations/init-schemas.sql
   ```

4. **Setup Individual Services**
   ```bash
   # For each service
   cd services/{service-name}
   cp config/example.env .env
   # Edit .env
   pip install -r requirements.txt
   alembic upgrade head
   python src/main.py
   ```

## Running Services Locally

Each service can be run independently:

```bash
cd services/{service-name}
./scripts/dev-run.sh
```

## Running Frontend Apps

```bash
# Public website
cd apps/web-public
npm install
npm run dev

# Admin portal
cd apps/web-admin-portal
npm install
npm run dev

# CMS
cd apps/web-cms
npm install
npm run dev
```

## Running Mobile Apps

```bash
# Subscriber app
cd apps/mobile-subscriber
npm install
npm run android  # or ios

# Technician app
cd apps/mobile-technician
npm install
npm run android  # or ios
```

## Testing

```bash
# Service tests
cd services/{service-name}
pytest

# Frontend tests
cd apps/{app-name}
npm test
```

## Development Workflow

1. Make changes to service/app
2. Run tests
3. Check linting
4. Test locally
5. Commit and push
