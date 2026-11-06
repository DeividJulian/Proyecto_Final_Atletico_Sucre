"""Production safety: no test accounts, no test password for admins, clear failure when misconfigured."""
import pytest
from sqlalchemy import func, select

import config
import seed
from database import SessionLocal
from models import Category, Guardian, User
from repositories import UserRepository
from services.admins import ensure_admins


@pytest.fixture
def production(monkeypatch):
    monkeypatch.setattr(config, "ENVIRONMENT", "production")
    monkeypatch.setattr(config, "IS_DEVELOPMENT", False)


def test_production_requires_admin_initial_password(production, monkeypatch):
    monkeypatch.setattr(config, "ADMIN_INITIAL_PASSWORD", "")
    monkeypatch.setattr(config, "ADMIN_EMAILS", ["nuevo.admin@test.com"])
    with SessionLocal() as session, pytest.raises(config.ConfigError, match="ADMIN_PASSWORD_INICIAL"):
        ensure_admins(session)
    with SessionLocal() as session:
        assert UserRepository(session).get_by_email("nuevo.admin@test.com") is None


def test_production_never_uses_seed_password_for_admins(production, monkeypatch):
    monkeypatch.setattr(config, "ADMIN_INITIAL_PASSWORD", "")
    assert config.admin_initial_password() == ""
    monkeypatch.setattr(config, "ADMIN_INITIAL_PASSWORD", "ClaveAdminSegura2026")
    assert config.admin_initial_password() == "ClaveAdminSegura2026"


def test_production_rejects_short_admin_password(production, monkeypatch):
    monkeypatch.setattr(config, "ADMIN_INITIAL_PASSWORD", "corta1")
    with pytest.raises(config.ConfigError, match="10 caracteres"):
        config.check_production_settings()


def test_development_falls_back_to_seed_password(monkeypatch):
    monkeypatch.setattr(config, "ADMIN_INITIAL_PASSWORD", "")
    assert config.IS_DEVELOPMENT is True
    assert config.admin_initial_password() == config.SEED_PASSWORD


def test_seed_in_production_creates_no_test_accounts(production, monkeypatch):
    monkeypatch.setattr(config, "ADMIN_INITIAL_PASSWORD", "ClaveAdminSegura2026")
    seed.run()
    with SessionLocal() as session:
        for email in (seed.COACH_TEST_EMAIL, seed.PARENT_TEST_EMAIL, seed.PARENT2_TEST_EMAIL):
            assert UserRepository(session).get_by_email(email) is None
        assert session.scalar(select(func.count()).select_from(Guardian)) == 0
        # The club data is loaded
        assert session.scalar(select(Category).where(Category.name == "Categoría 2018-2020")) is not None


def test_seed_in_development_creates_test_accounts():
    seed.run()
    with SessionLocal() as session:
        coach = UserRepository(session).get_by_email(seed.COACH_TEST_EMAIL)
        assert coach is not None and coach.is_admin is False
        assert UserRepository(session).get_by_email(seed.PARENT_TEST_EMAIL) is not None
        assert session.scalar(select(func.count()).select_from(User).where(User.is_admin.is_(True))) == 2


def test_supabase_url_is_normalized():
    assert config._normalize_database_url("postgresql://u:p@host:6543/postgres") == "postgresql+psycopg://u:p@host:6543/postgres"
    assert config._normalize_database_url("postgres://u:p@host/db") == "postgresql+psycopg://u:p@host/db"
    assert config._normalize_database_url("sqlite:///x.db") == "sqlite:///x.db"
