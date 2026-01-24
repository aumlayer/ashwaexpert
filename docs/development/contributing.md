# Contributing Guide

## Code Standards

### Python Services

- Follow PEP 8 style guide
- Use type hints
- Write docstrings for public functions
- Maximum line length: 100 characters
- Format with Black and lint with Ruff (`black .`, `ruff check .`)

### TypeScript/JavaScript

- Use TypeScript for all new code
- Follow ESLint configuration
- Use functional components with hooks
- Maximum line length: 100 characters

## Git Workflow

1. Create feature branch from `main`
2. Make changes and commit
3. Write/update tests
4. Ensure all tests pass
5. Create pull request

## Commit Messages

Follow conventional commits:
- `feat: Add new feature`
- `fix: Fix bug`
- `docs: Update documentation`
- `refactor: Refactor code`

## Pull Request Process

1. Ensure all tests pass
2. Update documentation if needed
3. Request review
4. Address review comments
5. Merge after approval

## Service Development

When developing a new service:

1. Follow the service folder structure
2. Create comprehensive README.md
3. Define OpenAPI specification
4. Write unit and integration tests
5. Document all APIs

## Testing Requirements

- Unit tests for business logic
- Integration tests for APIs
- Test coverage > 80%
