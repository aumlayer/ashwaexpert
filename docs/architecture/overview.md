# Architecture Overview

## System Architecture

The Ashva Experts platform follows a microservices architecture with clear service boundaries and event-driven communication.

## Key Principles

1. **Service Independence**: Each service is independently deployable
2. **Database per Service**: Each service has its own database schema
3. **Event-Driven**: Services communicate via events for side effects
4. **API Gateway**: Single entry point for all client requests
5. **Centralized Auth**: Authentication handled by dedicated auth-service

## Architecture Diagram

See the main architecture document: `ashva_microservices_architecture.md`

## Service Communication

- **Synchronous**: REST APIs through API Gateway
- **Asynchronous**: Events via Redis Streams message broker

## Data Flow

1. Client → API Gateway → Microservice
2. Microservice → Database (own schema)
3. Microservice → Message Broker → Other Services (events)

## Deployment

- VPS deployment with Docker Compose
- Each service runs in its own container
- Shared infrastructure: PostgreSQL, Redis, MinIO
