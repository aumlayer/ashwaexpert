# Shared Libraries

This directory contains shared code used across multiple services and applications.

## Structure

- `python/`: Shared Python code for microservices
  - `shared-models/`: Common Pydantic models
  - `shared-utils/`: Utility functions
  - `event-schemas/`: Event definitions

- `typescript/`: Shared TypeScript code for frontend/mobile
  - `api-client/`: API clients for services
  - `types/`: TypeScript type definitions
  - `utils/`: Utility functions

## Usage

### Python Services

Install shared Python packages:

```bash
pip install -e shared/python/shared-models
pip install -e shared/python/shared-utils
pip install -e shared/python/event-schemas
```

### TypeScript Apps

Install shared TypeScript packages:

```bash
# In package.json
{
  "dependencies": {
    "@ashvaexperts/api-client": "file:../shared/typescript/api-client",
    "@ashvaexperts/types": "file:../shared/typescript/types",
    "@ashvaexperts/utils": "file:../shared/typescript/utils"
  }
}
```

## Development

When adding shared code:

1. Ensure it's truly shared (used by multiple services/apps)
2. Maintain backward compatibility
3. Version appropriately
4. Document usage
