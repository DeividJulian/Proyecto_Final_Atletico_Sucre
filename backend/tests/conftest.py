import os
import tempfile

# IMPORTANT: set BEFORE importing the app so the tests never touch Supabase or send emails
_TMP = tempfile.mkdtemp(prefix="atletico-tests-")
os.environ["DATABASE_URL"] = f"sqlite:///{_TMP}/test.db"
os.environ["SECRET_KEY"] = "test-secret-for-pytest-only-0123456789abcdef"
os.environ["EMAIL_BACKEND"] = "memoria"
os.environ["STORAGE_BACKEND"] = "local"
os.environ["LOCAL_UPLOAD_DIR"] = f"{_TMP}/uploads"
os.environ["ADMIN_EMAILS"] = "admin1@test.com,admin2@test.com,admin3@test.com"
os.environ["ADMIN_PASSWORD_INICIAL"] = "AdminPass123"
os.environ["SEED_PASSWORD"] = "SeedPass123"
os.environ["FRONTEND_ORIGIN"] = "https://atletico-sucre.vercel.app"

from datetime import time  # noqa: E402

import pytest  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402

from database import Base, SessionLocal, engine  # noqa: E402
from enums import CategoryGender, Role, TrainingShift  # noqa: E402
from main import app, init_database  # noqa: E402
from models import Category, Coach, TrainingSession, User, Venue  # noqa: E402
from security import hash_password  # noqa: E402
from services.mailer import OUTBOX  # noqa: E402

assert str(engine.url).startswith("sqlite"), "Tests must only run against SQLite"

ADMIN_PASSWORD = "AdminPass123"
COACH_EMAIL = "coach@test.com"
COACH_PASSWORD = "CoachPass123"
PARENT_PASSWORD = "ClaveSegura1"


@pytest.fixture(autouse=True)
def fresh_database():
    Base.metadata.drop_all(bind=engine)
    init_database()
    _seed_structure()
    OUTBOX.clear()
    yield


def _seed_structure() -> None:
    """Minimal club: one venue, three categories (one of them with the test coach) and their sessions."""
    with SessionLocal() as session:
        venue = Venue(name="Cancha Grupo Cabal", is_main=True)
        coach_user = User(email=COACH_EMAIL, password_hash=hash_password(COACH_PASSWORD), role=Role.COACH)
        session.add_all([venue, coach_user])
        session.flush()
        coach = Coach(user_id=coach_user.id, full_name="Profesor De Prueba")
        session.add(coach)
        session.flush()
        categories = [
            Category(name="Categoría 2014-2015", birth_year_from=2014, birth_year_to=2015, coach_id=coach.id),
            Category(name="Categoría 2016-2017", birth_year_from=2016, birth_year_to=2017),
            Category(name="Femenino", birth_year_from=2009, birth_year_to=2020, gender=CategoryGender.FEMALE),
        ]
        session.add_all(categories)
        session.flush()
        for category in categories:
            session.add_all([
                TrainingSession(category_id=category.id, venue_id=venue.id, weekday=2, start_time=time(8),
                                end_time=time(10), shift=TrainingShift.MORNING),
                TrainingSession(category_id=category.id, venue_id=venue.id, weekday=2, start_time=time(14, 30),
                                end_time=time(17, 30), shift=TrainingShift.AFTERNOON),
                TrainingSession(category_id=category.id, venue_id=venue.id, weekday=6, start_time=time(8, 30),
                                end_time=time(12, 30), shift=TrainingShift.ALL),
            ])
        session.commit()


@pytest.fixture
def client():
    return TestClient(app)


def auth(token: str) -> dict:
    return {"Authorization": f"Bearer {token}"}


def login(client: TestClient, email: str, password: str) -> str:
    response = client.post("/auth/login", json={"email": email, "password": password})
    assert response.status_code == 200, response.text
    return response.json()["access_token"]


def player_payload(document: str, birth: str = "2015-04-10", sex: str = "M", **extra) -> dict:
    return {
        "first_names": "Mateo",
        "last_names": "Castro Rincón",
        "document_type": "TI",
        "document_number": document,
        "birth_date": birth,
        "sex": sex,
        "school_name": "Colegio Champagnat",
        "school_shift": "morning",
        "eps": "Nueva EPS",
        "blood_type": "O+",
        "allergies": "Ninguna",
        "emergency_contact_name": "Laura Rincón",
        "emergency_contact_phone": "312 456 7890",
        **extra,
    }


def register_payload(email: str, guardian_document: str, players: list[dict], **extra) -> dict:
    return {
        "email": email,
        "password": PARENT_PASSWORD,
        "guardian": {
            "first_names": "Andrés",
            "last_names": "Castro",
            "document_type": "CC",
            "document_number": guardian_document,
            "phone": "+57 321 854 3957",
            "address": "Calle 10 # 5-20",
            "neighborhood": "Centro",
            "relationship_to_player": "father",
        },
        "players": players,
        "accept_data_policy": True,
        "accept_image_use": True,
        **extra,
    }


def register_parent(client: TestClient, email: str, guardian_document: str, players: list[dict]) -> dict:
    response = client.post("/auth/register", json=register_payload(email, guardian_document, players))
    assert response.status_code == 201, response.text
    return response.json()


@pytest.fixture
def admin_token(client) -> str:
    return login(client, "admin1@test.com", ADMIN_PASSWORD)


@pytest.fixture
def coach_token(client) -> str:
    return login(client, COACH_EMAIL, COACH_PASSWORD)


@pytest.fixture
def family_a(client) -> dict:
    """Parent A with 2 children (2015 → Categoría 2014-2015, 2016 → Categoría 2016-2017)."""
    return register_parent(
        client, "padre.a@test.com", "1085000001",
        [player_payload("1000000001"), player_payload("1000000002", birth="2016-09-01", first_names="Lucas")],
    )


@pytest.fixture
def family_b(client) -> dict:
    """Parent B with 1 child."""
    return register_parent(client, "padre.b@test.com", "1085000002", [player_payload("1000000003", first_names="Samuel")])
