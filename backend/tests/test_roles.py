from conftest import COACH_EMAIL, PARENT_PASSWORD, auth, login
from database import SessionLocal
from repositories import UserRepository


def test_only_two_admins_from_admin_emails(client):
    with SessionLocal() as session:
        admins = UserRepository(session).admins()
        assert [a.email for a in admins] == ["admin1@test.com", "admin2@test.com"]
        assert all(a.role == "coach" for a in admins)
        assert all(a.must_change_password for a in admins)


def test_admin_is_coach_check_constraint(client):
    import pytest
    from sqlalchemy.exc import IntegrityError

    from models import User

    with SessionLocal() as session:
        session.add(User(email="malo@test.com", password_hash="x", role="parent", is_admin=True))
        with pytest.raises(IntegrityError):
            session.commit()


def test_parent_can_not_use_coach_or_admin_routes(client, family_a):
    token = login(client, "padre.a@test.com", PARENT_PASSWORD)
    assert client.get("/coach/categories", headers=auth(token)).status_code == 403
    assert client.get("/admin/stats", headers=auth(token)).status_code == 403
    assert client.get("/admin/venues", headers=auth(token)).status_code == 403


def test_coach_can_not_use_admin_or_parent_routes(client, coach_token):
    assert client.get("/admin/stats", headers=auth(coach_token)).status_code == 403
    assert client.post("/admin/categories", headers=auth(coach_token), json={}).status_code == 403
    assert client.get("/me/players", headers=auth(coach_token)).status_code == 403


def test_admin_reaches_admin_and_coach_routes(client, admin_token):
    assert client.get("/admin/stats", headers=auth(admin_token)).status_code == 200
    # An admin works with every category
    assert len(client.get("/coach/categories", headers=auth(admin_token)).json()) == 3


def test_coach_only_sees_own_categories(client, coach_token):
    names = [c["name"] for c in client.get("/coach/categories", headers=auth(coach_token)).json()]
    assert names == ["Categoría 2014-2015"]


def test_admin_cannot_be_created_through_coach_accounts(client, admin_token):
    coach = client.post("/admin/coaches", headers=auth(admin_token), json={"full_name": "Nuevo Profesor"}).json()
    account = client.post(
        f"/admin/coaches/{coach['id']}/account", headers=auth(admin_token),
        json={"email": "nuevo@test.com", "password": "Profesor123"},
    )
    assert account.status_code == 201
    me = client.get("/auth/me", headers=auth(login(client, "nuevo@test.com", "Profesor123"))).json()
    assert me["role"] == "coach" and me["is_admin"] is False


def test_public_endpoints_need_no_session(client):
    assert client.get("/health").json() == {"status": "ok"}
    club = client.get("/public/club").json()
    assert club["monthly_fee"] == 65000 and club["enrollment_fee"] == 20000 and club["due_day"] == 5
    assert club["nequi_number"] is None
    assert club["payment_contact_message"] == "Consulta los datos de pago por WhatsApp"
    assert len(client.get("/public/categories").json()) == 3
    coaches = client.get("/public/coaches").json()
    assert all(c["email"] is None for c in coaches)
    assert COACH_EMAIL not in str(coaches)


def test_cors_only_allows_known_origins(client):
    def preflight(origin):
        return client.options("/health", headers={"Origin": origin, "Access-Control-Request-Method": "GET"})

    assert preflight("http://localhost:4200").headers.get("access-control-allow-origin") == "http://localhost:4200"
    assert preflight("https://atletico-sucre.vercel.app").headers.get("access-control-allow-origin")
    assert "access-control-allow-origin" not in preflight("https://otro-sitio.com").headers
