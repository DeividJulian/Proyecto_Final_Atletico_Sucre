"""Passwords (bcrypt), JWT session tokens and the dependencies that protect the endpoints by role."""
import logging
from datetime import datetime, timedelta, timezone

import bcrypt
import jwt
from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

import config
from database import get_db
from models import User

logger = logging.getLogger("atletico.auth")

ALGORITHM = "HS256"
# bcrypt only uses the first 72 bytes of a password
_BCRYPT_MAX_BYTES = 72

bearer = HTTPBearer(auto_error=False, description="Pega aquí el access_token que devuelve /auth/login")


# ---------------------------------------------------------------- passwords

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode()[:_BCRYPT_MAX_BYTES], bcrypt.gensalt()).decode()


def verify_password(password: str, password_hash: str) -> bool:
    try:
        return bcrypt.checkpw(password.encode()[:_BCRYPT_MAX_BYTES], password_hash.encode())
    except ValueError:
        # Unusable hash (account created without a password)
        return False


UNUSABLE_PASSWORD = "!"  # never matches a bcrypt hash: the user must use "forgot password"


# ---------------------------------------------------------------- tokens

def create_token(user: User, hours: float | None = None) -> str:
    expires = datetime.now(timezone.utc) + timedelta(hours=config.TOKEN_HOURS if hours is None else hours)
    payload = {"sub": str(user.id), "role": user.role, "adm": user.is_admin, "exp": expires}
    return jwt.encode(payload, config.SECRET_KEY, algorithm=ALGORITHM)


def user_from_token(db: Session, token: str) -> User | None:
    try:
        payload = jwt.decode(token, config.SECRET_KEY, algorithms=[ALGORITHM])
        user_id = int(payload["sub"])
    except (jwt.PyJWTError, KeyError, ValueError):
        return None
    user = db.get(User, user_id)
    if user is None or not user.is_active:
        return None
    return user


# ---------------------------------------------------------------- dependencies

def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer),
    db: Session = Depends(get_db),
) -> User:
    if credentials is None:
        raise HTTPException(status_code=401, detail="Debes iniciar sesión.", headers={"WWW-Authenticate": "Bearer"})
    user = user_from_token(db, credentials.credentials)
    if user is None:
        raise HTTPException(
            status_code=401,
            detail="Tu sesión no es válida o expiró. Inicia sesión de nuevo.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user


def require_parent(user: User = Depends(get_current_user)) -> User:
    if not user.is_parent:
        raise HTTPException(status_code=403, detail="Esta sección es solo para padres de familia.")
    return user


def require_coach(user: User = Depends(get_current_user)) -> User:
    """Coaches and admins (an admin is a coach with extra permissions)."""
    if not user.is_coach:
        raise HTTPException(status_code=403, detail="Esta sección es solo para profesores.")
    return user


def require_admin(user: User = Depends(get_current_user)) -> User:
    if not (user.is_coach and user.is_admin):
        logger.warning("User %s tried an admin action", user.email)
        raise HTTPException(status_code=403, detail="Solo un administrador puede hacer esta acción.")
    return user
