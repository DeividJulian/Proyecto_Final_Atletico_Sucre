"""Fase 8: features, synthetic data, model and the admin-only /admin/risk endpoint."""
from datetime import date, datetime, timedelta, timezone
from types import SimpleNamespace

import numpy as np

from conftest import PARENT_PASSWORD, auth, login
from ml import synthetic
from ml.features import (
    FEATURES,
    NO_DATA_ATTENDANCE,
    PlayerFeatures,
    attendance_rate,
    build_features,
    consecutive_absences,
    months_between,
)
from ml.predictor import RiskModel, level_for
from ml.train import choose

TODAY = date(2026, 11, 7)


def _record(days_ago: int, status: str):
    return SimpleNamespace(session_date=TODAY - timedelta(days=days_ago), status=status)


def test_attendance_rate_windows_and_neutral_prior():
    records = [_record(2, "present"), _record(5, "absent"), _record(9, "late"), _record(45, "absent")]
    assert attendance_rate(records, TODAY - timedelta(days=30)) == round(2 / 3, 3)
    assert attendance_rate(records, TODAY - timedelta(days=60)) == 0.5
    assert attendance_rate([], TODAY - timedelta(days=30)) == NO_DATA_ATTENDANCE


def test_consecutive_absences_counts_back_from_the_latest():
    assert consecutive_absences([_record(1, "absent"), _record(3, "absent"), _record(5, "present")]) == 2
    # An excused absence breaks the streak
    assert consecutive_absences([_record(1, "absent"), _record(3, "excused"), _record(5, "absent")]) == 1
    assert consecutive_absences([]) == 0


def test_build_features_from_a_player():
    player = SimpleNamespace(
        approved_at=datetime(2026, 2, 1, tzinfo=timezone.utc),
        enrolled_at=date(2026, 1, 20),
        birth_date=date(2012, 12, 1),
        school_shift="afternoon",
    )
    payments = [SimpleNamespace(status="rejected"), SimpleNamespace(status="verified")]
    features = build_features(player, [_record(2, "absent"), _record(4, "absent")], payments, 3, TODAY)
    assert features.consecutive_absences == 2
    assert features.overdue_months == 3
    assert features.rejected_payments == 1
    assert features.tenure_months == months_between(date(2026, 2, 1), TODAY) == 9
    assert features.age == 13
    assert features.trains_morning == 1 and features.full_day_school == 0
    assert len(features.vector()) == len(FEATURES)


def test_synthetic_dataset_is_reproducible():
    X1, y1 = synthetic.generate(500)
    X2, y2 = synthetic.generate(500)
    assert np.array_equal(X1, X2) and np.array_equal(y1, y2)
    assert X1.shape == (500, len(FEATURES))
    assert 0.1 < y1.mean() < 0.45


def test_model_selection_prefers_recall():
    results = {
        "logistic_regression": {"recall": 0.80, "roc_auc": 0.85},
        "random_forest": {"recall": 0.75, "roc_auc": 0.95},
    }
    assert choose(results) == "logistic_regression"


def test_saved_model_separates_risky_and_healthy_profiles():
    model = RiskModel.get()
    risky = PlayerFeatures(0.3, 0.4, 5, 4, 2, 2, 15, 1, 0)
    healthy = PlayerFeatures(0.95, 0.95, 0, 0, 0, 24, 9, 0, 0)
    high, low = model.predict([risky, healthy])
    assert high.level == "high" and low.level == "low"
    assert high.probability > low.probability
    assert 1 <= len(high.factors) <= 3
    assert {f.feature for f in high.factors} & {"attendance_rate_30", "overdue_months", "consecutive_absences"}
    assert model.info()["synthetic"] is True
    assert level_for(0.2) == "low" and level_for(0.5) == "medium" and level_for(0.8) == "high"


def test_risk_endpoint_is_admin_only_and_lists_approved_players(client, family_a, admin_token, coach_token):
    approved = family_a["players"][0]
    client.post(f"/admin/enrollments/{approved['id']}/approve", headers=auth(admin_token))

    parent = login(client, "padre.a@test.com", PARENT_PASSWORD)
    assert client.get("/admin/risk", headers=auth(parent)).status_code == 403
    assert client.get("/admin/risk", headers=auth(coach_token)).status_code == 403
    assert client.get("/admin/risk").status_code == 401

    report = client.get("/admin/risk", headers=auth(admin_token))
    assert report.status_code == 200
    body = report.json()
    assert body["model"]["synthetic"] is True and "datos sintéticos" in body["model"]["note"]
    assert [p["player_id"] for p in body["players"]] == [approved["id"]]  # pending ones are not scored
    item = body["players"][0]
    assert 0 <= item["probability"] <= 1 and item["level"] in {"low", "medium", "high"}
    assert item["whatsapp_url"].startswith("https://wa.me/57")
    assert set(item["features"]) == set(FEATURES)
    assert sum(body["counts"].values()) == 1

    other_category = client.get("/admin/risk", headers=auth(admin_token), params={"category_id": 999}).json()
    assert other_category["players"] == []
