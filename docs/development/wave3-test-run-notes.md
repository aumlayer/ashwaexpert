## Wave 3 — Test Run Notes (billing-service, payment-service)

### Commands used

Billing:

```bash
cd services/billing-service
python3 -m pip install -r requirements.txt
python3 -m pytest -q
```

Payment:

```bash
cd services/payment-service
python3 -m pip install -r requirements.txt
python3 -m pytest -q
```

### Failures found
- **`python` not found**: environment uses `python3` (macOS).
- **Import-time crash**: `RuntimeError: DATABASE_URL is required` because `SessionLocal` is created at import time.
- **Python 3.9 typing errors**: `TypeError: unsupported operand type(s) for |` from PEP604 unions (`X | None`, `float | Decimal`) in service code.
- **Prometheus duplicate metrics** during earlier failing imports (`Duplicated timeseries in CollectorRegistry`) caused by repeated partial imports.

### Fixes applied
- Added `pytest.ini` in each service to make imports stable:
  - `pythonpath = src`
  - `testpaths = tests`
- Added `tests/conftest.py` in each service to set safe defaults:
  - `DATABASE_URL` dummy local Postgres URL (engine creation only; unit tests do not connect)
  - `INTERNAL_API_KEY=dev-internal`, `ENVIRONMENT=test`, `LOG_LEVEL=WARNING`
- Replaced PEP604 unions with Python 3.9-compatible typing:
  - SQLAlchemy models in `billing-service` and `payment-service` now use `Optional[...]` instead of `X | None`
  - `billing-service` `_money()` uses `Union[float, Decimal]` instead of `float | Decimal`
  - Replaced `str | None` annotations in both services’ `src/main.py` with `Optional[str]`, etc.
- Updated `billing-service` unit tests to import the FastAPI app **once per session** (prevents duplicate metric registration).

### Result
- `services/billing-service`: `python3 -m pytest -q` **PASS**
- `services/payment-service`: `python3 -m pytest -q` **PASS**

