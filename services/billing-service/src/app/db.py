from __future__ import annotations

import os
from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker
from sqlalchemy.pool import StaticPool


class Base(DeclarativeBase):
    pass


def _is_test_env() -> bool:
    if os.getenv("PYTEST_CURRENT_TEST"):
        return True
    return os.getenv("ENVIRONMENT", "").lower() == "test"


def get_engine():
    url = os.getenv("DATABASE_URL", "")
    if not url and _is_test_env():
        url = "sqlite+pysqlite:///:memory:"

    if not url:
        raise RuntimeError("DATABASE_URL is required")

    if url.startswith("sqlite"):
        return create_engine(
            url,
            connect_args={"check_same_thread": False},
            poolclass=StaticPool,
        )
    return create_engine(url, pool_pre_ping=True)


def get_session_factory():
    return sessionmaker(autocommit=False, autoflush=False, bind=get_engine())
