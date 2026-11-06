"""Engine, session factory and the declarative base shared by every model."""
from collections.abc import Iterator

from sqlalchemy import create_engine, event
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

import config


def _engine_options(url: str) -> dict:
    if url.startswith("sqlite"):
        # FastAPI serves requests from a thread pool; SQLite needs this to share the connection
        return {"connect_args": {"check_same_thread": False}}
    if url.startswith("postgresql"):
        # Supabase Session pooler (port 5432). pool_pre_ping discards connections the pooler closed while Render
        # slept; prepare_threshold=None turns off psycopg's server-side prepared statements, so the app also
        # works if the URL is ever switched to a pooler that does not support them (transaction mode).
        return {"pool_pre_ping": True, "pool_recycle": 300, "connect_args": {"prepare_threshold": None}}
    return {"pool_pre_ping": True}


engine = create_engine(config.DATABASE_URL, **_engine_options(config.DATABASE_URL))

if engine.dialect.name == "sqlite":
    # SQLite ignores foreign keys unless asked; turn them on so local runs and tests behave like PostgreSQL
    @event.listens_for(engine, "connect")
    def _sqlite_foreign_keys(dbapi_connection, _record):
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.close()

SessionLocal = sessionmaker(bind=engine, autoflush=False, expire_on_commit=False)


class Base(DeclarativeBase):
    pass


def get_db() -> Iterator[Session]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
