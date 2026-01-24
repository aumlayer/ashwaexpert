from typing import Generator

from sqlalchemy.orm import Session

from .db import get_session_factory


_SessionLocal = get_session_factory()


def get_db() -> Generator[Session, None, None]:
    db = _SessionLocal()
    try:
        yield db
    finally:
        db.close()

