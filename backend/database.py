"""Engine, session factory and the declarative base shared by every model."""
from collections.abc import Iterator

from sqlalchemy import create_engine, event
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

import config


def _engine_options(url: str) -> dict:
    if url.startswith("sqlite"):
        # FastAPI serves requests from a thread pool; SQLite needs this to share the connection
        return {"connect_args": {"check_same_thread": False}}
    # Supabase pooler (PgBouncer, transaction mode): check connections before use and skip prepared statements
    return {"pool_pre_ping": True, "pool_recycle": 300, "connect_args": {"prepare_threshold": None}}


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
