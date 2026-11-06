from conftest import PARENT_PASSWORD, auth, login, player_payload, register_payload
from services.mailer import OUTBOX


def test_register_parent_with_two_children(client, family_a):
    assert family_a["access_token"]
    assert family_a["user"]["role"] == "parent"
    assert family_a["user"]["is_admin"] is False
    assert family_a["guardian"]["phone"] == "3218543957"  # normalized
    players = family_a["players"]
    assert len(players) == 2
    assert {p["enrollment_status"] for p in players} == {"pending"}
    assert [p["category"]["name"] for p in players] == ["Categoría 2014-2015", "Categoría 2016-2017"]
    assert players[0]["monthly_fee"] == 65000
    # Studies in the morning → trains in the afternoon
    assert players[0]["training_shift"] == "afternoon"


def test_girl_goes_to_female_category(client):
    data = client.post(
        "/auth/register",
        json=register_payload("madre@test.com", "1085000009", [player_payload("1000000009", sex="F")]),
    ).json()
    assert data["players"][0]["category"]["name"] == "Femenino"


def test_register_requires_data_policy(client):
    payload = register_payload("x@test.com", "1085000003", [player_payload("1000000004")], accept_data_policy=False)
    response = client.post("/auth/register", json=payload)
    assert response.status_code == 422
    assert "política de tratamiento de datos" in response.json()["detail"]


def test_register_rejects_duplicate_email_and_documents(client, family_a):
    same_email = register_payload("padre.a@test.com", "1085000004", [player_payload("1000000005")])
    assert client.post("/auth/register", json=same_email).status_code == 409

    same_child = register_payload("otro@test.com", "1085000005", [player_payload("1000000001")])
    response = client.post("/auth/register", json=same_child)
    assert response.status_code == 409
    assert "1000000001" in response.json()["detail"]


def test_register_rejects_birth_year_without_category(client):
    payload = register_payload("y@test.com", "1085000006", [player_payload("1000000006", birth="2012-01-01")])
    response = client.post("/auth/register", json=payload)
    assert response.status_code == 400
    assert "2012" in response.json()["detail"]
    # Nothing half-saved: the email is still free
    payload["players"] = [player_payload("1000000006")]
    assert client.post("/auth/register", json=payload).status_code == 201


def test_validation_messages_are_in_spanish(client):
    payload = register_payload("z@test.com", "1085000007", [player_payload("1000000007", emergency_contact_phone="12")])
    payload["password"] = "corta"
    response = client.post("/auth/register", json=payload)
    assert response.status_code == 422
    detail = response.json()["detail"]
    assert "8 caracteres" in detail
    assert "celular colombiano" in detail


def test_login_and_me(client, family_a):
    token = login(client, "padre.a@test.com", PARENT_PASSWORD)
    me = client.get("/auth/me", headers=auth(token)).json()
    assert me["email"] == "padre.a@test.com"
    assert me["display_name"] == "Andrés Castro"


def test_login_wrong_password(client, family_a):
    response = client.post("/auth/login", json={"email": "padre.a@test.com", "password": "Incorrecta1"})
    assert response.status_code == 401
    assert response.json() == {"detail": "Correo o contraseña incorrectos."}


def test_password_is_stored_hashed(client, family_a):
    from database import SessionLocal
    from repositories import UserRepository

    with SessionLocal() as session:
        user = UserRepository(session).get_by_email("padre.a@test.com")
        assert user.password_hash != PARENT_PASSWORD
        assert user.password_hash.startswith("$2")


def test_password_reset_with_code(client, family_a):
    assert client.post("/auth/password/forgot", json={"email": "padre.a@test.com"}).status_code == 200
    code = OUTBOX[-1].text.split("Tu código es ")[1][:6]
    wrong = client.post("/auth/password/reset", json={"email": "padre.a@test.com", "code": "000000", "new_password": "NuevaClave9"})
    assert wrong.status_code == 400 or code == "000000"
    ok = client.post("/auth/password/reset", json={"email": "padre.a@test.com", "code": code, "new_password": "NuevaClave9"})
    assert ok.status_code == 200
    assert login(client, "padre.a@test.com", "NuevaClave9")


def test_forgot_password_does_not_reveal_accounts(client):
    response = client.post("/auth/password/forgot", json={"email": "nadie@test.com"})
    assert response.status_code == 200
    assert OUTBOX == []


def test_no_token_and_bad_token(client):
    assert client.get("/auth/me").status_code == 401
    response = client.get("/auth/me", headers=auth("token-falso"))
    assert response.status_code == 401
    assert "sesión" in response.json()["detail"]
