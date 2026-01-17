# Service Communication Patterns

## Synchronous Communication

All client requests go through the API Gateway, which routes to appropriate services.

### Request Flow
```
Client → API Gateway → Target Service → Database
                      ↓
                   Response
```

## Asynchronous Communication

Services publish events to Redis Streams, and other services consume these events.

### Event Flow
```
Service A → Event Published → Redis Streams → Service B (Consumer)
```

## Event Patterns

### Outbox Pattern
Services write events to an outbox table in the same transaction as business data, then a worker publishes events.

### Idempotency
All event handlers must be idempotent to handle duplicate events.

## Service Dependencies

See each service's README.md for:
- Events published
- Events consumed
- Direct service dependencies
