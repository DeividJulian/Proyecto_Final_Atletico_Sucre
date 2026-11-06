"""Settings read from environment variables (.env file locally, Render dashboard in production)."""
import hashlib
import logging
import os

from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger("atletico.config")


def _csv(value: str | None) -> list[str]:
    return [item.strip().lower() for item in (value or "").split(",") if item.strip()]


DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./atletico_sucre.db")

# Signs the session tokens. Without it, the key is derived from DATABASE_URL, which is private and stable
# across restarts (a random one would log everybody out on every Render restart).
SECRET_KEY = os.getenv("SECRET_KEY") or ""
if not SECRET_KEY:
    SECRET_KEY = hashlib.sha256(f"jwt::{DATABASE_URL}".encode()).hexdigest()
    logger.warning("SECRET_KEY no está configurada: se deriva de DATABASE_URL (configúrala en producción)")
TOKEN_HOURS = float(os.getenv("TOKEN_HORAS", "8"))

# The 2 administrators: coaches with is_admin = true, created on startup
MAX_ADMINS = 2
ADMIN_EMAILS = _csv(os.getenv("ADMIN_EMAILS"))[:MAX_ADMINS]
ADMIN_INITIAL_PASSWORD = os.getenv("ADMIN_PASSWORD_INICIAL", "")

# CORS: only the Vercel domain and the local Angular dev server
LOCAL_ORIGIN = "http://localhost:4200"
FRONTEND_ORIGINS = sorted({LOCAL_ORIGIN, *[o.rstrip("/") for o in _csv(os.getenv("FRONTEND_ORIGIN"))]})

# Email delivery: consola | memoria | brevo
EMAIL_BACKEND = os.getenv("EMAIL_BACKEND", "consola").strip().lower()
BREVO_API_KEY = os.getenv("BREVO_API_KEY", "")
EMAIL_FROM = os.getenv("EMAIL_FROM", "no-reply@atleticosucre.local")
EMAIL_FROM_NAME = os.getenv("EMAIL_FROM_NAME", "Club Atlético Sucre")

# File storage: local | supabase
STORAGE_BACKEND = os.getenv("STORAGE_BACKEND", "local").strip().lower()
SUPABASE_URL = os.getenv("SUPABASE_URL", "").rstrip("/")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY", "")
SUPABASE_BUCKET = os.getenv("SUPABASE_BUCKET", "atletico-sucre")
