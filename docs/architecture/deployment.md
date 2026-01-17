# Deployment Architecture

## VPS Deployment

The platform is designed for VPS deployment using Docker Compose.

## Container Architecture

```
┌─────────────────┐
│   Nginx (80/443)│
└────────┬────────┘
         │
┌────────▼────────┐
│  API Gateway    │
└────────┬────────┘
         │
    ┌────┴────┐
    │        │
┌───▼───┐ ┌─▼────┐
│Services│ │ Apps │
└────────┘ └──────┘
```

## Infrastructure Services

- **PostgreSQL**: Shared database cluster with schema-per-service
- **Redis**: Cache, rate limiting, message broker
- **MinIO**: Object storage (S3-compatible)
- **Nginx**: Reverse proxy and TLS termination

## Service Deployment

Each microservice:
- Runs in its own Docker container
- Has its own health check endpoint
- Can be scaled independently
- Connects to shared PostgreSQL and Redis

## Environment Separation

- **Development**: Local Docker Compose
- **Staging**: Separate VPS or Docker Compose stack
- **Production**: Production VPS with separate databases
