"""Enrollment → coach work → payments, end to end."""
from datetime import date, timedelta

from conftest import PARENT_PASSWORD, auth, login


def _last_tuesday() -> date:
    today = date.today()
    return today - timedelta(days=(today.isoweekday() - 2) % 7)


def test_enrollment_approval_and_coach_visibility(client, family_a, admin_token, coach_token):
    pending = client.get("/admin/enrollments", headers=auth(admin_token)).json()
    assert len(pending) == 2
    child = family_a["players"][0]  # Categoría 2014-2015, the test coach's category

    # Before approval the coach does not see the child
    category_id = child["category"]["id"]
    assert client.get(f"/coach/categories/{category_id}/players", headers=auth(coach_token)).json() == []

    approved = client.post(f"/admin/enrollments/{child['id']}/approve", headers=auth(admin_token))
    assert approved.status_code == 200 and approved.json()["enrollment_status"] == "approved"
    assert client.post(f"/admin/enrollments/{child['id']}/approve", headers=auth(admin_token)).status_code == 409

    players = client.get(f"/coach/categories/{category_id}/players", headers=auth(coach_token)).json()
    assert [p["id"] for p in players] == [child["id"]]
    # Health data visible to the category coach
    detail = client.get(f"/coach/players/{child['id']}", headers=auth(coach_token)).json()
    assert detail["health"]["eps"] == "Nueva EPS"

    # The other child is in a category without this coach → 404
    other = family_a["players"][1]
    assert client.get(f"/coach/players/{other['id']}", headers=auth(coach_token)).status_code == 404

    # Coach sets jersey and position
    sports = client.put(f"/coach/players/{child['id']}/sports", headers=auth(coach_token),
                        json={"jersey_number": 10, "position": "forward"})
    assert sports.json()["jersey_number"] == 10


def test_reject_enrollment(client, family_a, admin_token):
    child = family_a["players"][1]
    response = client.post(f"/admin/enrollments/{child['id']}/reject", headers=auth(admin_token),
                           json={"reason": "Faltan documentos del deportista"})
    assert response.json()["enrollment_status"] == "rejected"


def test_parent_schedule_follows_school_shift(client, family_a):
    token = login(client, "padre.a@test.com", PARENT_PASSWORD)
    child = family_a["players"][0]  # studies in the morning
    schedule = client.get(f"/me/players/{child['id']}", headers=auth(token)).json()["schedule"]
    assert {s["shift"] for s in schedule} == {"afternoon", "all"}
    assert schedule[0]["venue_name"] == "Cancha Grupo Cabal"


def test_attendance_flow(client, family_a, admin_token, coach_token):
    child = family_a["players"][0]
    client.post(f"/admin/enrollments/{child['id']}/approve", headers=auth(admin_token))
    tuesday = _last_tuesday()
    sessions = client.get("/coach/sessions", headers=auth(coach_token), params={"day": tuesday.isoformat()}).json()
    assert len(sessions) == 2
    by_shift = {s["shift"]: s["session_id"] for s in sessions}

    # The child studies in the morning: not on the morning sheet, yes on the afternoon one
    morning = client.get(f"/coach/sessions/{by_shift['morning']}/attendance", headers=auth(coach_token),
                         params={"day": tuesday.isoformat()}).json()
    assert morning["rows"] == []
    wrong_shift = client.put(f"/coach/sessions/{by_shift['morning']}/attendance", headers=auth(coach_token),
                             json={"session_date": tuesday.isoformat(), "records": [{"player_id": child["id"], "status": "present"}]})
    assert wrong_shift.status_code == 400
    session_id = by_shift["afternoon"]

    saved = client.put(f"/coach/sessions/{session_id}/attendance", headers=auth(coach_token),
                       json={"session_date": tuesday.isoformat(), "records": [{"player_id": child["id"], "status": "present"}]})
    assert saved.status_code == 200, saved.text
    assert saved.json()["rows"][0]["status"] == "present"

    wrong_day = tuesday + timedelta(days=1) if tuesday + timedelta(days=1) <= date.today() else tuesday - timedelta(days=1)
    bad = client.put(f"/coach/sessions/{session_id}/attendance", headers=auth(coach_token),
                     json={"session_date": wrong_day.isoformat(), "records": [{"player_id": child["id"], "status": "present"}]})
    assert bad.status_code == 400

    token = login(client, "padre.a@test.com", PARENT_PASSWORD)
    summary = client.get(f"/me/players/{child['id']}/attendance", headers=auth(token)).json()
    assert summary["total"] == 1 and summary["rate"] == 100.0


def test_payment_report_and_verification(client, family_a, admin_token):
    token = login(client, "padre.a@test.com", PARENT_PASSWORD)
    child = family_a["players"][0]
    client.post(f"/admin/enrollments/{child['id']}/approve", headers=auth(admin_token))

    nequi_without_receipt = client.post(
        f"/me/players/{child['id']}/payments", headers=auth(token),
        data={"concept": "enrollment", "amount": "20000", "method": "nequi", "paid_on": date.today().isoformat()},
    )
    assert nequi_without_receipt.status_code == 400

    today = date.today()
    reported = client.post(
        f"/me/players/{child['id']}/payments", headers=auth(token),
        data={"concept": "monthly", "period_year": str(today.year), "period_month": str(today.month),
              "amount": "65000", "method": "cash", "paid_on": today.isoformat()},
    )
    assert reported.status_code == 201, reported.text
    assert reported.json()["status"] == "pending_verification"

    duplicate = client.post(
        f"/me/players/{child['id']}/payments", headers=auth(token),
        data={"concept": "monthly", "period_year": str(today.year), "period_month": str(today.month),
              "amount": "65000", "method": "cash", "paid_on": today.isoformat()},
    )
    assert duplicate.status_code == 409

    payment_id = reported.json()["id"]
    verified = client.post(f"/admin/payments/{payment_id}/verify", headers=auth(admin_token))
    assert verified.json()["status"] == "verified"

    cash = client.post("/admin/payments", headers=auth(admin_token), json={
        "player_id": child["id"], "concept": "enrollment", "amount": 20000, "method": "cash", "paid_on": today.isoformat()})
    assert cash.status_code == 201

    account = client.get(f"/me/players/{child['id']}/payments", headers=auth(token)).json()
    assert account["is_up_to_date"] is True
    assert account["months"][today.month - 1]["status"] == "paid"

    csv = client.get("/admin/payments/export.csv", headers=auth(admin_token))
    assert csv.status_code == 200 and "deportista" in csv.text


def test_announcements_reach_only_their_category(client, family_a, family_b, admin_token, coach_token):
    for player in family_a["players"] + family_b["players"]:
        client.post(f"/admin/enrollments/{player['id']}/approve", headers=auth(admin_token))
    category_id = family_a["players"][0]["category"]["id"]

    assert client.post("/coach/announcements", headers=auth(coach_token),
                       json={"title": "General", "body": "Para todos"}).status_code == 403
    created = client.post("/coach/announcements", headers=auth(coach_token),
                          json={"category_id": category_id, "title": "Partido", "body": "Sábado 8 a. m."})
    assert created.status_code == 201
    client.post("/coach/announcements", headers=auth(admin_token), json={"title": "Club", "body": "Aviso general"})

    token_a = login(client, "padre.a@test.com", PARENT_PASSWORD)
    titles = {a["title"] for a in client.get("/me/announcements", headers=auth(token_a)).json()}
    assert titles == {"Partido", "Club"}


def test_admin_crud_catalog_and_settings(client, admin_token):
    venue = client.post("/admin/venues", headers=auth(admin_token), json={"name": "Nueva Sede"})
    assert venue.status_code == 201
    bad = client.post("/admin/categories", headers=auth(admin_token),
                      json={"name": "Mala", "birth_year_from": 2020, "birth_year_to": 2010})
    assert bad.status_code == 422

    settings = client.get("/admin/settings", headers=auth(admin_token)).json()
    settings.update(nequi_number="3001234567", nequi_holder="Tesorería Club", sibling_discount_percent=10)
    assert client.put("/admin/settings", headers=auth(admin_token), json=settings).status_code == 200
    club = client.get("/public/club").json()
    assert club["nequi_number"] == "3001234567" and club["payment_contact_message"] is None

    stats = client.get("/admin/stats", headers=auth(admin_token)).json()
    assert "players_pending" in stats
