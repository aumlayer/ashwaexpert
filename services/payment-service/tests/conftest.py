import os
import pytest
from fastapi.testclient import TestClient

os.environ.setdefault("ENVIRONMENT", "test")
os.environ.setdefault("LOG_LEVEL", "WARNING")
os.environ.setdefault("INTERNAL_API_KEY", "dev-internal")
os.environ.setdefault("DATABASE_URL", "sqlite+pysqlite:///:memory:")
os.environ.setdefault("CASHFREE_API_BASE", "")
os.environ.setdefault("RECONCILE_PENDING_SECONDS", "1")

from main import app  # type: ignore

@pytest.fixture(scope="session")
def client():
    return TestClient(app)
