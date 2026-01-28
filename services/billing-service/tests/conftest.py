import os

import pytest
from fastapi.testclient import TestClient

# Keep imports safe on fresh machines/CI (no DB required for unit tests here).
os.environ.setdefault("ENVIRONMENT", "test")
os.environ.setdefault("LOG_LEVEL", "WARNING")
os.environ.setdefault("INTERNAL_API_KEY", "dev-internal")
# Must be set because SessionLocal is created at import-time (engine is not connected in unit tests).
os.environ.setdefault("DATABASE_URL", "sqlite+pysqlite:///:memory:")
os.environ.setdefault("MEDIA_SERVICE_URL", "")
os.environ.setdefault("NOTIFICATION_SERVICE_URL", "")
os.environ.setdefault("AUTH_SERVICE_URL", "")

from main import app  # type: ignore
from app.deps import get_db  # type: ignore


class DummyDB:
    def execute(self, *_args, **_kwargs):
        raise AssertionError("DB access not expected in unit tests")


def override_get_db():
    yield DummyDB()


app.dependency_overrides[get_db] = override_get_db


@pytest.fixture(scope="session")
def client():
    return TestClient(app)
