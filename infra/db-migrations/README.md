# Database Migrations

This directory contains database initialization scripts and migration utilities.

## Structure

- `init-schemas.sql`: Creates all service schemas in PostgreSQL
- Service-specific migrations: Each service has its own migrations in `services/{service-name}/migrations/`

## Usage

### Initial Setup

Run the schema initialization script:

```bash
psql -U ashva -d ashva_db -f init-schemas.sql
```

### Service Migrations

Each service uses Alembic for migrations. Run migrations for a specific service:

```bash
cd services/{service-name}
alembic upgrade head
```

### All Services

To run migrations for all services:

```bash
for service in services/*/; do
  cd $service
  if [ -f "alembic.ini" ]; then
    alembic upgrade head
  fi
  cd ../..
done
```

## Migration Best Practices

1. Each service manages its own migrations
2. Migrations should be backward compatible when possible
3. Test migrations on staging before production
4. Always backup database before running migrations
5. Use transactions for migration safety
