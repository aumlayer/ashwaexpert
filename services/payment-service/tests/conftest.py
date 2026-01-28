import os

import pytest


@pytest.fixture(autouse=True, scope="session")
def _test_env_defaults():
    os.environ.setdefault("ENVIRONMENT", "test")
    os.environ.setdefault("LOG_LEVEL", "WARNING")
    os.environ.setdefault("INTERNAL_API_KEY", "dev-internal")
    # Must be set because SessionLocal is created at import-time (engine is not connected in unit tests).
    os.environ.setdefault("DATABASE_URL", "postgresql://user:pass@localhost:5432/payment_test_db")
    os.environ.setdefault("CASHFREE_API_BASE", "")
    os.environ.setdefault("RECONCILE_PENDING_SECONDS", "1")

