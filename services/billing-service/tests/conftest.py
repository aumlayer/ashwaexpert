import os

import pytest


@pytest.fixture(autouse=True, scope="session")
def _test_env_defaults():
    # Keep imports safe on fresh machines/CI (no DB required for unit tests here).
    os.environ.setdefault("ENVIRONMENT", "test")
    os.environ.setdefault("LOG_LEVEL", "WARNING")
    os.environ.setdefault("INTERNAL_API_KEY", "dev-internal")
    # Must be set because SessionLocal is created at import-time (engine is not connected in unit tests).
    os.environ.setdefault("DATABASE_URL", "postgresql://user:pass@localhost:5432/billing_test_db")
    os.environ.setdefault("MEDIA_SERVICE_URL", "")
    os.environ.setdefault("NOTIFICATION_SERVICE_URL", "")
    os.environ.setdefault("AUTH_SERVICE_URL", "")


import pytest
from fastapi.testclient import TestClient
from main import app  # type: ignore

@pytest.fixture()
def client():
    return TestClient(app)
