"""Small schema migrations (same approach as Horarios y Aulas).

Base.metadata.create_all() only creates tables that do not exist yet; it never adds columns to an existing
table. Columns added to a model after its table exists in Supabase are listed here and added on startup.
Every step checks first, so running it many times is safe.
"""
import logging

from sqlalchemy import inspect, text
from sqlalchemy.engine import Engine

logger = logging.getLogger("atletico.migrations")

# (table, column, SQL type and default). Defaults keep the old rows valid. Empty for now (first version).
NEW_COLUMNS: list[tuple[str, str, str]] = []


def apply_migrations(engine: Engine) -> None:
    inspector = inspect(engine)
    tables = set(inspector.get_table_names())
    for table, column, definition in NEW_COLUMNS:
        if table not in tables:
            continue
        existing = {c["name"] for c in inspector.get_columns(table)}
        if column in existing:
            continue
        with engine.begin() as conn:
            conn.execute(text(f"ALTER TABLE {table} ADD COLUMN {column} {definition}"))
        logger.info("Added column %s.%s", table, column)
