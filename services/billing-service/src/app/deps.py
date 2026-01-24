from __future__ import annotations

from collections.abc import Generator

from sqlalchemy.orm import Session

from .db import get_session_factory

SessionLocal = get_session_factory()


def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

