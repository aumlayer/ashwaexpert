from __future__ import annotations

import os

from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker


class Base(DeclarativeBase):
    pass


def get_engine():
    url = os.getenv("DATABASE_URL", "")
    if not url:
        raise RuntimeError("DATABASE_URL is required")
    return create_engine(url, pool_pre_ping=True)


def get_session_factory():
    return sessionmaker(autocommit=False, autoflush=False, bind=get_engine())

