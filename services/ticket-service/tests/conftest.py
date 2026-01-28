"""Pytest fixtures for ticket-service tests."""
import os
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

import sys
from pathlib import Path

# Add src to path
sys.path.insert(0, str(Path(__file__).parent.parent / "src"))

from app.db import Base
from main import app

# Use in-memory SQLite for tests (or test PostgreSQL if preferred)
TEST_DATABASE_URL = os.getenv("TEST_DATABASE_URL", "sqlite:///:memory:")


@pytest.fixture(scope="function")
def db_session():
    """Create a test database session."""
    engine = create_engine(TEST_DATABASE_URL, connect_args={"check_same_thread": False})
    Base.metadata.create_all(engine)
    SessionLocal = sessionmaker(bind=engine)
    session = SessionLocal()
    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(engine)


@pytest.fixture(scope="function")
def client(db_session):
    """Create a test client with dependency override."""
    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    from app.deps import get_db
    app.dependency_overrides[get_db] = override_get_db
    yield TestClient(app)
    app.dependency_overrides.clear()
