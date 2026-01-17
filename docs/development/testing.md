# Testing Guide

## Service Testing

### Unit Tests

Each service has unit tests in `tests/unit/`:

```bash
cd services/{service-name}
pytest tests/unit/
```

### Integration Tests

Integration tests in `tests/integration/`:

```bash
pytest tests/integration/
```

### Test Coverage

```bash
pytest --cov=src --cov-report=html
```

## Frontend Testing

### Next.js Apps

```bash
cd apps/{app-name}
npm test
```

### React Native Apps

```bash
cd apps/{app-name}
npm test
```

## End-to-End Testing

E2E tests should cover critical user flows:
- User registration and login
- Subscription creation
- Payment processing
- Ticket creation and completion

## Test Data

- Use fixtures for consistent test data
- Clean up test data after tests
- Use separate test database

## Mocking

- Mock external services (Cashfree, MSG91)
- Mock database for unit tests
- Use test doubles for integration tests
