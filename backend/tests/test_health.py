from fastapi.testclient import TestClient

from main import app

client = TestClient(app)


def test_health_answers_ok():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_cors_allows_local_angular():
    response = client.options(
        "/health",
        headers={"Origin": "http://localhost:4200", "Access-Control-Request-Method": "GET"},
    )
    assert response.headers.get("access-control-allow-origin") == "http://localhost:4200"


def test_cors_rejects_unknown_origin():
    response = client.options(
        "/health",
        headers={"Origin": "https://sitio-desconocido.com", "Access-Control-Request-Method": "GET"},
    )
    assert "access-control-allow-origin" not in response.headers
