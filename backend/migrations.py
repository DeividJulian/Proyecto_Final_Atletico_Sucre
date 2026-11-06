"""Small schema migrations (same approach as Horarios y Aulas) and Supabase hardening.

Base.metadata.create_all() only creates tables that do not exist yet; it never adds columns to an existing
table. Columns added to a model after its table exists in Supabase are listed here and added on startup.
Every step checks first, so running it many times is safe.
"""
import logging

from sqlalchemy import inspect, text
from sqlalchemy.engine import Engine

from database import Base

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

    if engine.dialect.name == "postgresql":
        enable_row_level_security(engine)


def enable_row_level_security(engine: Engine) -> None:
    """Supabase publishes every table of the "public" schema through its Data API (PostgREST) with the anon key.

    This API never uses that, so RLS is turned on with NO policies: the anon/authenticated roles of the Data API
    get nothing, while the backend's connection (the table owner, "postgres") is not affected by RLS.
    """
    with engine.begin() as conn:
        for table in Base.metadata.sorted_tables:
            enabled = conn.execute(
                text("SELECT relrowsecurity FROM pg_class WHERE oid = to_regclass(:name)"),
                {"name": f"public.{table.name}"},
            ).scalar()
            if enabled is False:
                conn.execute(text(f'ALTER TABLE public."{table.name}" ENABLE ROW LEVEL SECURITY'))
                logger.info("RLS enabled on %s", table.name)
