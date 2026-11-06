"""Club Atlético Sucre API: application, middlewares and uniform error handling."""
import logging
import time
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy.exc import IntegrityError, SQLAlchemyError
from starlette.exceptions import HTTPException as StarletteHTTPException

import config
import models  # noqa: F401  (registers the tables on Base)
from database import Base, SessionLocal, engine
from migrations import apply_migrations
from routers import admin, auth, catalog_routers, coach, parent, public
from schemas import ErrorOut, HealthOut
from services.admins import ensure_admins
from services.errors import DomainError

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger("atletico.api")


def init_database() -> None:
    try:
        config.check_production_settings()
    except config.ConfigError as error:
        logger.critical("%s", error)
        raise
    logger.info("Starting in %s mode (%s)", config.ENVIRONMENT, engine.dialect.name)
    Base.metadata.create_all(bind=engine)
    apply_migrations(engine)
    with SessionLocal() as session:
        ensure_admins(session)  # the 2 admins from ADMIN_EMAILS


@asynccontextmanager
async def lifespan(_app: FastAPI):
    init_database()
    yield


ERROR_TEXT = {
    400: "Solicitud incorrecta (regla de negocio no cumplida)",
    401: "Sin sesión, o token inválido o vencido",
    403: "El rol del usuario no permite esta acción",
    404: "El recurso no existe o no pertenece al usuario",
    409: "Conflicto con los datos actuales (duplicado, ya aprobado, etc.)",
    422: "Datos de entrada inválidos",
    502: "Falló un servicio externo (correo o almacenamiento)",
}


def errors(*codes: int) -> dict:
    return {code: {"model": ErrorOut, "description": ERROR_TEXT[code]} for code in codes}


app = FastAPI(
    title="Club Atlético Sucre",
    version="0.2.0",
    lifespan=lifespan,
    description=(
        "API de la plataforma del Club Atlético Sucre (Ipiales, Nariño).\n\n"
        "**Cómo probar:** registra un padre en `POST /auth/register` o inicia sesión en `POST /auth/login`, "
        "copia el `access_token` y pégalo en el botón **Authorize**.\n\n"
        "Todos los errores tienen la forma `{\"detail\": \"texto\"}`."
    ),
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=config.FRONTEND_ORIGINS,
    allow_credentials=False,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type"],
)

app.include_router(public.router, responses=errors(404, 422))
app.include_router(auth.router, responses=errors(400, 401, 409, 422, 502))
app.include_router(parent.router, responses=errors(400, 401, 403, 404, 409, 422, 502))
app.include_router(coach.router, responses=errors(400, 401, 403, 404, 422))
app.include_router(admin.router, responses=errors(400, 401, 403, 404, 409, 422, 502))
for catalog in catalog_routers:
    app.include_router(catalog, responses=errors(401, 403, 404, 409, 422))


@app.get("/health", response_model=HealthOut, tags=["sistema"], summary="Estado del servidor (lo usa Render)")
def health() -> HealthOut:
    return HealthOut(status="ok")


# ---------- request log

@app.middleware("http")
async def log_requests(request: Request, call_next):
    started = time.perf_counter()
    response = await call_next(request)
    logger.info("%s %s -> %s (%.0f ms)", request.method, request.url.path, response.status_code,
                (time.perf_counter() - started) * 1000)
    return response


# ---------- uniform errors: always {"detail": "texto en español"}

FIELD_NAMES = {
    "email": "correo", "password": "contraseña", "new_password": "nueva contraseña", "first_names": "nombres",
    "last_names": "apellidos", "document_number": "número de documento", "document_type": "tipo de documento",
    "phone": "celular", "alt_phone": "otro celular", "address": "dirección", "birth_date": "fecha de nacimiento",
    "sex": "sexo", "school_name": "colegio", "school_shift": "jornada escolar", "eps": "EPS",
    "blood_type": "RH", "emergency_contact_name": "contacto de emergencia",
    "emergency_contact_phone": "celular de emergencia", "relationship_to_player": "parentesco",
    "players": "deportistas", "amount": "valor", "method": "método de pago", "paid_on": "fecha de pago",
    "concept": "concepto", "period_month": "mes", "period_year": "año", "code": "código",
}


def _field(loc: tuple) -> str:
    parts = [str(p) for p in loc if p not in ("body", "query", "path", "form")]
    if not parts:
        return ""
    name = FIELD_NAMES.get(parts[-1], parts[-1])
    if "players" in parts and parts[-1] != "players":
        index = next((p for p in parts if p.isdigit()), None)
        return f"{name} (deportista {int(index) + 1})" if index is not None else name
    return name


def _message(error: dict) -> str:
    kind, ctx, field = error.get("type", ""), error.get("ctx") or {}, _field(tuple(error.get("loc", ())))
    if kind == "value_error":
        text = str(error.get("msg", "")).removeprefix("Value error, ")
        # Model-level rules have no field; field rules get the field name in front
        return f"{field[:1].upper()}{field[1:]}: {text}" if field else text
    templates = {
        "missing": "Falta el campo {f}.",
        "string_too_short": "{f}: debe tener al menos {min_length} caracteres.",
        "string_too_long": "{f}: debe tener máximo {max_length} caracteres.",
        "too_short": "{f}: debe tener al menos {min_length} elemento(s).",
        "too_long": "{f}: debe tener máximo {max_length} elementos.",
        "enum": "{f}: valor no permitido (opciones: {expected}).",
        "literal_error": "{f}: valor no permitido (opciones: {expected}).",
        "greater_than": "{f}: debe ser mayor que {gt}.",
        "greater_than_equal": "{f}: debe ser mayor o igual a {ge}.",
        "less_than_equal": "{f}: debe ser menor o igual a {le}.",
        "date_from_datetime_parsing": "{f}: fecha inválida (usa AAAA-MM-DD).",
        "date_parsing": "{f}: fecha inválida (usa AAAA-MM-DD).",
        "int_parsing": "{f}: debe ser un número entero.",
        "string_pattern_mismatch": "{f}: formato inválido.",
        "bool_parsing": "{f}: debe ser verdadero o falso.",
        "json_invalid": "El cuerpo de la solicitud no es un JSON válido.",
    }
    if "email" in kind or (field == "correo" and kind != "missing"):
        return "El correo no es válido."
    template = templates.get(kind, "{f}: valor inválido.")
    return template.format(f=field or "dato", **{k: v for k, v in ctx.items() if isinstance(v, (str, int, float))})


@app.exception_handler(RequestValidationError)
async def validation_handler(_request: Request, exc: RequestValidationError):
    messages = list(dict.fromkeys(_message(e) for e in exc.errors()))
    return JSONResponse(status_code=422, content={"detail": " ".join(messages[:4])})


@app.exception_handler(DomainError)
async def domain_handler(_request: Request, exc: DomainError):
    return JSONResponse(status_code=exc.status_code, content={"detail": exc.detail})


@app.exception_handler(StarletteHTTPException)
async def http_handler(_request: Request, exc: StarletteHTTPException):
    detail = exc.detail if isinstance(exc.detail, str) else "Error en la solicitud."
    if exc.status_code == 404 and detail == "Not Found":
        detail = "La ruta solicitada no existe."
    elif exc.status_code == 405:
        detail = "Método no permitido en esta ruta."
    return JSONResponse(status_code=exc.status_code, content={"detail": detail}, headers=getattr(exc, "headers", None))


@app.exception_handler(IntegrityError)
async def integrity_handler(_request: Request, exc: IntegrityError):
    logger.warning("Integrity error: %s", exc.orig)
    return JSONResponse(
        status_code=409,
        content={"detail": "La operación choca con datos existentes (registro duplicado o en uso por otros datos)."},
    )


@app.exception_handler(SQLAlchemyError)
async def database_handler(_request: Request, exc: SQLAlchemyError):
    logger.exception("Database error: %s", exc)
    return JSONResponse(status_code=500, content={"detail": "Error interno de la base de datos. Intenta de nuevo."})
