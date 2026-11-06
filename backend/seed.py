"""Example data: club settings, venues, categories, schedule, coaching staff and test accounts.

    python seed.py

Idempotent: it can be run many times; what already exists is left as it is (the admin edits it from the panel).
- The 2 admins come from ADMIN_EMAILS (created on startup), never from this file.
- The test accounts (coach and two parents) are only created with ENVIRONMENT=development and SEED_PASSWORD
  set in .env. In production (Render) the seed only loads the club data.
"""
import logging
from datetime import date, datetime, time, timezone

from sqlalchemy import select
from sqlalchemy.orm import Session

import config
from database import SessionLocal
from enums import CategoryGender, PaymentConcept, PaymentMethod, PaymentStatus, Role, TrainingShift
from main import init_database
from models import Category, Coach, GalleryItem, Payment, TrainingSession, User, Venue
from repositories import SettingsRepository, UserRepository
from schemas import ApproveIn, RegisterIn
from security import hash_password
from services.auth import AuthService
from services.category_strategy import get_category_strategy
from services.enrollment import EnrollmentService
from services.mailer import MemoryMailer

logger = logging.getLogger("atletico.seed")

COACH_TEST_EMAIL = "profesor@atleticosucre.test"
PARENT_TEST_EMAIL = "padre@atleticosucre.test"
PARENT2_TEST_EMAIL = "padre2@atleticosucre.test"

VENUES = [
    {"name": "Cancha Grupo Cabal", "description": "Sede principal. Disponible en todos los horarios.",
     "surface": "Gramado natural", "is_main": True},
    {"name": "Colegio Champagnat", "description": "Sede alterna. Espacio amplio y zonas verdes.",
     "surface": "Gramado natural", "is_main": False},
    {"name": "Colegio Seminario", "description": "Sede alterna. Excelente infraestructura deportiva.",
     "surface": "Cancha para entrenamiento", "is_main": False},
]

CATEGORIES = [
    ("Categoría 2009-2010", 2009, 2010, CategoryGender.MIXED),
    ("Categoría 2011", 2011, 2011, CategoryGender.MIXED),
    ("Categoría 2012-2013", 2012, 2013, CategoryGender.MIXED),
    ("Categoría 2014-2015", 2014, 2015, CategoryGender.MIXED),
    ("Categoría 2016-2017", 2016, 2017, CategoryGender.MIXED),
    ("Categoría 2018-2020", 2018, 2020, CategoryGender.MIXED),
    ("Femenino", 2009, 2020, CategoryGender.FEMALE),
]

# Weekly schedule of the current website (same for every category; the admin adjusts it per category)
SCHEDULE = [
    (2, time(8, 0), time(10, 0), TrainingShift.MORNING),
    (4, time(8, 0), time(10, 0), TrainingShift.MORNING),
    (2, time(14, 30), time(17, 30), TrainingShift.AFTERNOON),
    (4, time(14, 30), time(17, 30), TrainingShift.AFTERNOON),
    (6, time(8, 30), time(12, 30), TrainingShift.ALL),
]

COACHES = [
    {
        "full_name": "Norvey Alvarado Morales", "role_title": "Presidente del Club", "photo_url": "/img/cuerpo-tecnico/norvey_alvarado.jpeg",
        "photo_position": "center 10%", "display_order": 0,
        "credentials": [
            "Licenciado en Educación Física",
            "Especialista en Pedagogía y Docencia Universitaria",
            "Licencias A y C — Federación Colombiana de Fútbol",
            "Licencia B — Escuela Nacional del Deporte de Cali, Valle",
            "Docente nombrado en propiedad por el Magisterio de Nariño",
            "Dirección técnica en el Torneo Nacional Interclubes de Difútbol por más de 6 años",
            "Coordinador Deportivo — Club Atlético Sucre Nariño",
            "Especialista en categorías juveniles y desarrollo integral del deportista",
        ],
    },
    {
        "full_name": "Juliana Estefanía Pastas", "role_title": "Entrenadora", "photo_url": "/img/cuerpo-tecnico/juliana_pastas.jpeg",
        "photo_position": "center 20%", "display_order": 1,
        "credentials": [
            "Tecnóloga en Entrenamiento Deportivo — SENA",
            "Bases del Entrenamiento Deportivo",
            "Cualidades Físicas en el Entrenamiento Deportivo",
            "Estructuración de Planes de Entrenamiento Deportivo",
            "Preparación física y entrenamiento deportivo",
            "Liderazgo en la actividad deportiva",
            "Legislación deportiva",
            "Fundamentos en administración deportiva",
            "Psicología Deportiva",
            "Seminario de fútbol de salón y arbitraje",
            "Licencia C — Federación Colombiana de Fútbol",
            "Tarjeta de Entrenador Deportivo — COCED (Colegio Colombiano de Entrenamiento Deportivo)",
        ],
    },
    {
        "full_name": "Luis Carlos Benavides", "role_title": "Entrenador", "photo_url": "/img/cuerpo-tecnico/luis_benavides.jpeg",
        "display_order": 2,
        "credentials": [
            "Tecnólogo en Entrenamiento Deportivo — SENA (2014)",
            "Tarjeta de Entrenador Deportivo COCED 2026",
            "Historiador — Universidad de Caldas (2024)",
        ],
    },
    {
        "full_name": "Juan Pablo Jiménez", "role_title": "Preparador de Porteros", "photo_url": "/img/cuerpo-tecnico/juan_pablo_jimenez.jpeg",
        "photo_position": "center", "display_order": 3,
        "credentials": [
            "Estudiante de Dirección Técnica — Instituto Superior de Fútbol de Quito",
            "Amplia experiencia en preparación de porteros",
            "Diplomado en Seminario de Alto Liderazgo",
            "Diplomado en Preparación Técnica, Táctica y Física",
        ],
    },
    {
        "full_name": "Cristhian David Villarreal Payán", "role_title": "Entrenador", "photo_url": "/img/cuerpo-tecnico/cristian.jpeg",
        "display_order": 4,
        "credentials": [
            "Licenciado en Educación Física y Deportes",
            "Tecnólogo en Entrenamiento Deportivo",
            "Diplomado en Preparación Física",
            "Seminarios en Periodización Táctica, Revolución Táctica y Espacios Reducidos",
            "Seminario en Psicología Deportiva",
            "Seminario para Entrenadores de Fútbol Base",
            "Manejo de Lesiones y Recuperación Física",
            "Licencia C — Federación Colombiana de Fútbol",
            "Tarjeta de Entrenador Deportivo — COCED",
        ],
    },
    {
        "full_name": "Jerson Javier Díaz Castro", "role_title": "Entrenador", "photo_url": "/img/cuerpo-tecnico/profe-jerson.jpeg",
        "display_order": 5,
        "credentials": [
            "Tecnólogo en Entrenamiento Deportivo",
            "Estructuración de Planes de Entrenamiento Deportivo",
            "Diplomado de Juego de Posición, Organización y Entrenamiento",
            "Diplomado en Espacios Reducidos aplicados al Fútbol Base",
            "Diplomado del Método Táctico Cognitivo en el Fútbol",
            "Diplomado en la Táctica y Técnica del Fútbol Formativo",
            "Seminarios en Psicología Deportiva, Nutrición Deportiva y Periodización Táctica",
            "Seminario en Prevención de Lesiones y Recuperación Física",
            "Curso Internacional de Fútbol Estratégico",
            "Licencia C — Federación Colombiana de Fútbol",
            "Tarjeta de Entrenador Deportivo — COCED 2025",
        ],
    },
]

GALLERY = [
    ("Familia Atlético Sucre", "Más que jugadores somos una familia", "familia_sucre1.jpeg", "club"),
    ("Equipo Sub 7", "Categoría 2018", "equipo.jpeg", "2018"),
    ("Categoría 2009-10", None, "categoria2009-10.jpeg", "2009-10"),
    ("Categoría 2011", None, "categoria2011.jpeg", "2011"),
    ("Categoría 2012-13", None, "categoria2012-13.jpeg", "2012-13"),
    ("Categoría 2014", None, "categoria2014.jpeg", "2014"),
    ("Categoría 2014-15", None, "categoria2014-15.jpeg", "2014-15"),
    ("Categoría 2015-16", None, "categoria2015-16.jpeg", "2015-16"),
    ("Categoría 2017", None, "categoria2017.jpeg", "2017"),
    ("Categoría 2018", None, "categoria2018.jpeg", "2018"),
    ("Equipo Femenino", "Talento y pasión sin límites", "equipo-ninas.jpeg", "femenino"),
]


def _get_or_create(session: Session, model, lookup: dict, values: dict | None = None):
    instance = session.scalar(select(model).filter_by(**lookup))
    if instance is None:
        instance = model(**lookup, **(values or {}))
        session.add(instance)
        session.flush()
    return instance


def seed_club(session: Session) -> None:
    settings = SettingsRepository(session).get_or_create()
    settings.enrollment_fee = settings.enrollment_fee or 20000
    settings.monthly_fee = settings.monthly_fee or 65000
    settings.due_day = settings.due_day or 5
    # Nequi stays empty until the club confirms it (the site shows "Consulta los datos de pago por WhatsApp")
    if not settings.uniform_store:
        settings.uniform_store = "Liga Mundial — Calle 24 # 6-91, Ipiales, Nariño"
    if not settings.payment_instructions:
        settings.payment_instructions = (
            "La inscripción es un pago único. La mensualidad se paga los primeros días de cada mes "
            "en efectivo o por Nequi. Es necesario estar al día para continuar entrenando."
        )

    venues = {v["name"]: _get_or_create(session, Venue, {"name": v["name"]}, {k: x for k, x in v.items() if k != "name"}) for v in VENUES}
    main_venue = venues["Cancha Grupo Cabal"]

    for order, (name, year_from, year_to, gender) in enumerate(CATEGORIES):
        category = session.scalar(select(Category).where(Category.name == name))
        if category is None:
            category = Category(name=name, birth_year_from=year_from, birth_year_to=year_to, gender=gender, display_order=order)
            session.add(category)
            session.flush()
            for weekday, start, end, shift in SCHEDULE:
                session.add(TrainingSession(category_id=category.id, venue_id=main_venue.id, weekday=weekday,
                                            start_time=start, end_time=end, shift=shift))

    for coach in COACHES:
        _get_or_create(session, Coach, {"full_name": coach["full_name"]}, {k: v for k, v in coach.items() if k != "full_name"})

    for order, (title, caption, file_name, tag) in enumerate(GALLERY):
        _get_or_create(session, GalleryItem, {"title": title},
                       {"caption": caption, "media_url": f"/img/galeria/{file_name}", "tag": tag, "display_order": order})
    session.commit()


def _example_player(first, last, doc, birth, sex, school_shift):
    return {
        "first_names": first, "last_names": last, "document_type": "TI" if birth.year <= 2019 else "RC",
        "document_number": doc, "birth_date": birth.isoformat(), "sex": sex,
        "school_name": "Institución Educativa de ejemplo", "school_shift": school_shift,
        "eps": "EPS de ejemplo", "blood_type": "O+", "allergies": None, "medical_notes": None,
        "emergency_contact_name": "Contacto De Ejemplo", "emergency_contact_phone": "3000000000",
    }


def _register(session: Session, email: str, guardian: dict, players: list[dict]) -> list:
    service = AuthService(session, get_category_strategy(), MemoryMailer())
    data = RegisterIn(email=email, password=config.SEED_PASSWORD, guardian=guardian, players=players,
                      accept_data_policy=True, accept_image_use=False)
    _user, _guardian, created = service.register_parent(data, ip_address="seed", user_agent="seed.py")
    return created


def seed_test_accounts(session: Session) -> bool:
    """Creates the test coach and parents. Only in development; returns whether it ran."""
    if not config.IS_DEVELOPMENT:
        logger.info("ENVIRONMENT=%s: no se crean cuentas de prueba", config.ENVIRONMENT)
        return False
    if not config.SEED_PASSWORD:
        logger.warning("SEED_PASSWORD vacío: no se crean las cuentas de prueba")
        return False
    users = UserRepository(session)
    admin = users.admins()[0] if users.admins() else None

    # Coach with an account, in charge of two categories
    if users.get_by_email(COACH_TEST_EMAIL) is None:
        user = users.add(User(email=COACH_TEST_EMAIL, password_hash=hash_password(config.SEED_PASSWORD), role=Role.COACH))
        coach = Coach(user_id=user.id, full_name="Profesor De Prueba", role_title="Entrenador", is_public=False, display_order=99)
        session.add(coach)
        session.flush()
        for name in ("Categoría 2014-2015", "Categoría 2016-2017"):
            session.scalar(select(Category).where(Category.name == name)).coach_id = coach.id
        session.commit()

    # Parent 1: two children, one approved (with enrollment paid) and one pending
    if users.get_by_email(PARENT_TEST_EMAIL) is None:
        players = _register(
            session, PARENT_TEST_EMAIL,
            {"first_names": "Andrea", "last_names": "Padre De Prueba", "document_type": "CC", "document_number": "90000001",
             "phone": "3000000001", "address": "Dirección de ejemplo", "city": "Ipiales", "relationship_to_player": "mother"},
            [_example_player("Mateo", "Prueba Uno", "1000000001", date(2015, 3, 14), "M", "morning"),
             _example_player("Sofía", "Prueba Uno", "1000000002", date(2017, 8, 2), "F", "afternoon")],
        )
        if admin is not None:
            EnrollmentService(session, MemoryMailer()).approve(admin, players[0].id, ApproveIn())
            session.add(Payment(player_id=players[0].id, concept=PaymentConcept.ENROLLMENT, amount=20000,
                                method=PaymentMethod.CASH, paid_on=date.today(), status=PaymentStatus.VERIFIED,
                                registered_by_id=admin.id, verified_by_id=admin.id, verified_at=datetime.now(timezone.utc)))
            session.commit()

    # Parent 2: one child (to check that families can not see each other's data)
    if users.get_by_email(PARENT2_TEST_EMAIL) is None:
        players = _register(
            session, PARENT2_TEST_EMAIL,
            {"first_names": "Carlos", "last_names": "Padre Dos", "document_type": "CC", "document_number": "90000002",
             "phone": "3000000002", "address": "Dirección de ejemplo 2", "city": "Ipiales", "relationship_to_player": "father"},
            [_example_player("Samuel", "Prueba Dos", "1000000003", date(2014, 6, 20), "M", "afternoon")],
        )
        if admin is not None:
            EnrollmentService(session, MemoryMailer()).approve(admin, players[0].id, ApproveIn())
    return True


def run() -> None:
    init_database()
    with SessionLocal() as session:
        seed_club(session)
        seed_test_accounts(session)
    logger.info("Seed listo")


if __name__ == "__main__":
    run()
