"""Dependency Injection: how each service gets its collaborators.

Routers ask FastAPI for a service (Depends(get_family_service)); the service receives the DB session,
the category strategy, the mailer and the file storage from here. Tests can replace any of these with
app.dependency_overrides without touching the services.
"""
from fastapi import Depends
from sqlalchemy.orm import Session

from database import get_db
from services.auth import AuthService
from services.category_strategy import CategoryStrategy, get_category_strategy
from services.coaching import CoachingService
from services.content import CoachService, NewsService, ReleaseService, SettingsService
from services.enrollment import EnrollmentService
from services.families import FamilyService
from services.mailer import Mailer, get_mailer
from services.payments import PaymentService
from services.stats import StatsService
from services.storage import FileStorage, get_storage


def strategy_dep() -> CategoryStrategy:
    return get_category_strategy()


def mailer_dep() -> Mailer:
    return get_mailer()


def storage_dep() -> FileStorage:
    return get_storage()


def get_auth_service(
    db: Session = Depends(get_db), strategy: CategoryStrategy = Depends(strategy_dep), mailer: Mailer = Depends(mailer_dep)
) -> AuthService:
    return AuthService(db, strategy, mailer)


def get_family_service(
    db: Session = Depends(get_db),
    strategy: CategoryStrategy = Depends(strategy_dep),
    storage: FileStorage = Depends(storage_dep),
) -> FamilyService:
    return FamilyService(db, strategy, storage)


def get_payment_service(db: Session = Depends(get_db), storage: FileStorage = Depends(storage_dep)) -> PaymentService:
    return PaymentService(db, storage)


def get_coaching_service(db: Session = Depends(get_db)) -> CoachingService:
    return CoachingService(db)


def get_enrollment_service(db: Session = Depends(get_db), mailer: Mailer = Depends(mailer_dep)) -> EnrollmentService:
    return EnrollmentService(db, mailer)


def get_stats_service(db: Session = Depends(get_db), storage: FileStorage = Depends(storage_dep)) -> StatsService:
    return StatsService(db, storage)


def get_coach_service(db: Session = Depends(get_db)) -> CoachService:
    return CoachService(db)


def get_news_service(db: Session = Depends(get_db)) -> NewsService:
    return NewsService(db)


def get_release_service(db: Session = Depends(get_db)) -> ReleaseService:
    return ReleaseService(db)


def get_settings_service(db: Session = Depends(get_db)) -> SettingsService:
    return SettingsService(db)
