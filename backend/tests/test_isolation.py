"""A parent must NEVER reach the data of another family (minors' data, Ley 1581)."""
import io

from conftest import PARENT_PASSWORD, auth, login

PNG = b"\x89PNG\r\n\x1a\n" + b"\x00" * 64


def test_parent_only_lists_own_children(client, family_a, family_b):
    token_a = login(client, "padre.a@test.com", PARENT_PASSWORD)
    token_b = login(client, "padre.b@test.com", PARENT_PASSWORD)
    ids_a = {p["id"] for p in client.get("/me/players", headers=auth(token_a)).json()}
    ids_b = {p["id"] for p in client.get("/me/players", headers=auth(token_b)).json()}
    assert len(ids_a) == 2 and len(ids_b) == 1
    assert ids_a.isdisjoint(ids_b)


def test_parent_can_not_read_or_change_another_child(client, family_a, family_b):
    token_a = login(client, "padre.a@test.com", PARENT_PASSWORD)
    child_of_b = family_b["players"][0]["id"]

    for method, path, kwargs in [
        ("get", f"/me/players/{child_of_b}", {}),
        ("put", f"/me/players/{child_of_b}", {"json": {"eps": "Otra EPS"}}),
        ("get", f"/me/players/{child_of_b}/attendance", {}),
        ("get", f"/me/players/{child_of_b}/payments", {}),
        ("get", f"/me/players/{child_of_b}/notes", {}),
        ("get", f"/me/players/{child_of_b}/photo", {}),
        ("post", f"/me/players/{child_of_b}/photo", {"files": {"photo": ("f.png", io.BytesIO(PNG), "image/png")}}),
    ]:
        response = getattr(client, method)(path, headers=auth(token_a), **kwargs)
        # 404, not 403: the parent can not even tell that the child exists
        assert response.status_code == 404, (method, path, response.text)
        assert response.json() == {"detail": "No encontramos ese deportista."}

    # And the data of B is untouched
    token_b = login(client, "padre.b@test.com", PARENT_PASSWORD)
    assert client.get(f"/me/players/{child_of_b}", headers=auth(token_b)).json()["health"]["eps"] == "Nueva EPS"


def test_parent_can_not_report_payment_for_another_child(client, family_a, family_b):
    token_a = login(client, "padre.a@test.com", PARENT_PASSWORD)
    child_of_b = family_b["players"][0]["id"]
    response = client.post(
        f"/me/players/{child_of_b}/payments",
        headers=auth(token_a),
        data={"concept": "enrollment", "amount": "20000", "method": "cash", "paid_on": "2026-01-10"},
    )
    assert response.status_code == 404


def test_parent_can_not_see_another_receipt(client, family_a, family_b):
    token_b = login(client, "padre.b@test.com", PARENT_PASSWORD)
    child_of_b = family_b["players"][0]["id"]
    payment = client.post(
        f"/me/players/{child_of_b}/payments",
        headers=auth(token_b),
        data={"concept": "enrollment", "amount": "20000", "method": "nequi", "paid_on": "2026-01-10"},
        files={"receipt": ("r.png", io.BytesIO(PNG), "image/png")},
    )
    assert payment.status_code == 201, payment.text
    payment_id = payment.json()["id"]

    assert client.get(f"/me/payments/{payment_id}/receipt", headers=auth(token_b)).status_code == 200
    token_a = login(client, "padre.a@test.com", PARENT_PASSWORD)
    assert client.get(f"/me/payments/{payment_id}/receipt", headers=auth(token_a)).status_code == 404


def test_parent_owns_photo_upload(client, family_a):
    token = login(client, "padre.a@test.com", PARENT_PASSWORD)
    child = family_a["players"][0]["id"]
    uploaded = client.post(
        f"/me/players/{child}/photo", headers=auth(token), files={"photo": ("f.png", io.BytesIO(PNG), "image/png")}
    )
    assert uploaded.status_code == 200 and uploaded.json()["has_photo"] is True
    assert client.get(f"/me/players/{child}/photo", headers=auth(token)).content == PNG

    fake = client.post(
        f"/me/players/{child}/photo", headers=auth(token), files={"photo": ("f.png", io.BytesIO(b"no image"), "image/png")}
    )
    assert fake.status_code == 400


def test_parent_can_not_edit_sports_fields(client, family_a):
    token = login(client, "padre.a@test.com", PARENT_PASSWORD)
    child = family_a["players"][0]["id"]
    response = client.put(f"/me/players/{child}", headers=auth(token), json={"jersey_number": 10, "eps": "Sanitas"})
    assert response.status_code == 200
    body = response.json()
    assert body["jersey_number"] is None  # ignored: only the coach sets it
    assert body["health"]["eps"] == "Sanitas"
