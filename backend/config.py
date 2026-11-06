"""Settings read from environment variables (.env file locally, Render dashboard in production)."""
import hashlib
import logging
import os

from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger("atletico.config")


def _csv(value: str | None) -> list[str]:
    return [item.strip().lower() for item in (value or "").split(",") if item.strip()]


# development: local machine (test accounts allowed) | production: Render (strict checks, no test accounts).
# Anything that is not "development" is treated as production, so a missing variable fails safe.
ENVIRONMENT = (os.getenv("ENVIRONMENT") or "production").strip().lower()
IS_DEVELOPMENT = ENVIRONMENT == "development"


def _normalize_database_url(url: str) -> str:
    """Supabase shows postgresql://…; SQLAlchemy needs the psycopg (v3) driver name."""
    for prefix in ("postgresql://", "postgres://"):
        if url.startswith(prefix):
            return "postgresql+psycopg://" + url[len(prefix):]
    return url


DATABASE_URL = _normalize_database_url(os.getenv("DATABASE_URL") or "sqlite:///./atletico_sucre.db")

# Signs the session tokens. Without it, the key is derived from DATABASE_URL, which is private and stable
# across restarts (a random one would log everybody out on every Render restart).
SECRET_KEY = os.getenv("SECRET_KEY") or ""
if not SECRET_KEY:
    SECRET_KEY = hashlib.sha256(f"jwt::{DATABASE_URL}".encode()).hexdigest()
    logger.warning("SECRET_KEY no está configurada: se deriva de DATABASE_URL (configúrala en producción)")
TOKEN_HOURS = float(os.getenv("TOKEN_HORAS", "8"))

# The 2 administrators: coaches with is_admin = true, created on startup. Emails only live in the environment.
MAX_ADMINS = 2
ADMIN_EMAILS = _csv(os.getenv("ADMIN_EMAILS"))[:MAX_ADMINS]
# Initial password of the admin accounts. Required in production. In development, if empty, SEED_PASSWORD is used.
ADMIN_INITIAL_PASSWORD = os.getenv("ADMIN_PASSWORD_INICIAL", "")
# Password of the test accounts created by seed.py (coach and parents). Only used in development.
SEED_PASSWORD = os.getenv("SEED_PASSWORD", "")


class ConfigError(RuntimeError):
    """A required setting is missing; the server must not start."""


def admin_initial_password() -> str:
    """The password new admin accounts get. Never falls back to the test password in production."""
    if ADMIN_INITIAL_PASSWORD:
        return ADMIN_INITIAL_PASSWORD
    if IS_DEVELOPMENT:
        return SEED_PASSWORD
    return ""


def check_production_settings() -> None:
    """Called on startup. In production, missing critical settings stop the server with a clear message."""
    if IS_DEVELOPMENT:
        return
    problems = []
    if ADMIN_EMAILS and not ADMIN_INITIAL_PASSWORD:
        problems.append(
            "ADMIN_PASSWORD_INICIAL está vacía. En producción es obligatoria para crear las cuentas de "
            "ADMIN_EMAILS (no se usa SEED_PASSWORD). Configúrala en Render → Environment."
        )
    elif ADMIN_INITIAL_PASSWORD and len(ADMIN_INITIAL_PASSWORD) < 10:
        problems.append("ADMIN_PASSWORD_INICIAL debe tener al menos 10 caracteres en producción.")
    if problems:
        raise ConfigError("No se puede iniciar en producción: " + " ".join(problems))

# CORS: only the Vercel domain and the local Angular dev server
LOCAL_ORIGIN = "http://localhost:4200"
FRONTEND_ORIGINS = sorted({LOCAL_ORIGIN, *[o.rstrip("/") for o in _csv(os.getenv("FRONTEND_ORIGIN"))]})

# One-time codes (password recovery)
CODE_MINUTES = int(os.getenv("CODIGO_MINUTOS", "15"))
CODE_ATTEMPTS = int(os.getenv("CODIGO_INTENTOS", "5"))

# Email delivery: consola | memoria | brevo
EMAIL_BACKEND = os.getenv("EMAIL_BACKEND", "consola").strip().lower()
BREVO_API_KEY = os.getenv("BREVO_API_KEY", "")
EMAIL_FROM = os.getenv("EMAIL_FROM", "no-reply@atleticosucre.local")
EMAIL_FROM_NAME = os.getenv("EMAIL_FROM_NAME", "Club Atlético Sucre")

# File storage: local | supabase
STORAGE_BACKEND = os.getenv("STORAGE_BACKEND", "local").strip().lower()
LOCAL_UPLOAD_DIR = os.getenv("LOCAL_UPLOAD_DIR", "uploads")
SUPABASE_URL = os.getenv("SUPABASE_URL", "").rstrip("/")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY", "")
SUPABASE_BUCKET = os.getenv("SUPABASE_BUCKET", "atletico-sucre")
MAX_UPLOAD_MB = float(os.getenv("MAX_UPLOAD_MB", "5"))
