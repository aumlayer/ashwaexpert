import os

from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker


class Base(DeclarativeBase):
    pass


def get_engine():
    database_url = os.getenv("DATABASE_URL", "")
    if not database_url:
        raise RuntimeError("DATABASE_URL is required")
    return create_engine(database_url, pool_pre_ping=True)


def get_session_factory():
    engine = get_engine()
    return sessionmaker(bind=engine, autoflush=False, autocommit=False)

