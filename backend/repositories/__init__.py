"""Data access (Repository pattern). One repository per aggregate."""
from repositories.base import AbstractRepository, SqlAlchemyRepository
from repositories.catalog import (
    AppReleaseRepository,
    CategoryRepository,
    CoachRepository,
    GalleryRepository,
    NewsRepository,
    SettingsRepository,
    TrainingSessionRepository,
    VenueRepository,
)
from repositories.people import CodeRepository, ConsentRepository, GuardianRepository, PlayerRepository, UserRepository
from repositories.tracking import (
    AnnouncementRepository,
    AttendanceRepository,
    NoteRepository,
    PaymentRepository,
)

__all__ = [
    "AbstractRepository",
    "SqlAlchemyRepository",
    "AnnouncementRepository",
    "AppReleaseRepository",
    "AttendanceRepository",
    "CategoryRepository",
    "CoachRepository",
    "CodeRepository",
    "ConsentRepository",
    "GalleryRepository",
    "GuardianRepository",
    "NewsRepository",
    "NoteRepository",
    "PaymentRepository",
    "PlayerRepository",
    "SettingsRepository",
    "TrainingSessionRepository",
    "UserRepository",
    "VenueRepository",
]
