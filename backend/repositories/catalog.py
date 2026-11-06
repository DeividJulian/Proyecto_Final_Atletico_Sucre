"""Club structure and public content."""
from collections.abc import Sequence

from sqlalchemy import select, update

from models import (
    AppRelease,
    Category,
    ClubSettings,
    Coach,
    GalleryItem,
    News,
    TrainingSession,
    Venue,
)
from repositories.base import SqlAlchemyRepository


class VenueRepository(SqlAlchemyRepository[Venue]):
    model = Venue
    default_order = (Venue.is_main.desc(), Venue.name)

    def list_active(self) -> Sequence[Venue]:
        return self.session.scalars(select(Venue).where(Venue.is_active.is_(True)).order_by(*self.default_order)).all()


class CategoryRepository(SqlAlchemyRepository[Category]):
    model = Category
    default_order = (Category.display_order, Category.birth_year_from)

    def list_active(self) -> Sequence[Category]:
        return self.session.scalars(
            select(Category).where(Category.is_active.is_(True)).order_by(*self.default_order)
        ).all()

    def list_by_coach(self, coach_id: int) -> Sequence[Category]:
        return self.session.scalars(
            select(Category).where(Category.coach_id == coach_id).order_by(*self.default_order)
        ).all()


class TrainingSessionRepository(SqlAlchemyRepository[TrainingSession]):
    model = TrainingSession
    default_order = (TrainingSession.weekday, TrainingSession.start_time)

    def list_by_categories(self, category_ids: Sequence[int], weekday: int | None = None) -> Sequence[TrainingSession]:
        if not category_ids:
            return []
        statement = select(TrainingSession).where(TrainingSession.category_id.in_(category_ids))
        if weekday is not None:
            statement = statement.where(TrainingSession.weekday == weekday)
        return self.session.scalars(statement.order_by(*self.default_order)).all()


class CoachRepository(SqlAlchemyRepository[Coach]):
    model = Coach
    default_order = (Coach.display_order, Coach.full_name)

    def get_by_user(self, user_id: int) -> Coach | None:
        return self.session.scalar(select(Coach).where(Coach.user_id == user_id))

    def list_public(self) -> Sequence[Coach]:
        return self.session.scalars(select(Coach).where(Coach.is_public.is_(True)).order_by(*self.default_order)).all()


class NewsRepository(SqlAlchemyRepository[News]):
    model = News
    default_order = (News.created_at.desc(),)

    def get_by_slug(self, slug: str) -> News | None:
        return self.session.scalar(select(News).where(News.slug == slug))

    def list_published(self) -> Sequence[News]:
        return self.session.scalars(
            select(News).where(News.is_published.is_(True)).order_by(News.published_at.desc())
        ).all()


class GalleryRepository(SqlAlchemyRepository[GalleryItem]):
    model = GalleryItem
    default_order = (GalleryItem.display_order, GalleryItem.id)


class AppReleaseRepository(SqlAlchemyRepository[AppRelease]):
    model = AppRelease
    default_order = (AppRelease.released_at.desc(),)

    def current(self) -> AppRelease | None:
        return self.session.scalar(select(AppRelease).where(AppRelease.is_current.is_(True)))

    def clear_current(self) -> None:
        self.session.execute(update(AppRelease).where(AppRelease.is_current.is_(True)).values(is_current=False))
        self.session.flush()


class SettingsRepository(SqlAlchemyRepository[ClubSettings]):
    model = ClubSettings

    def get_or_create(self) -> ClubSettings:
        settings = self.session.get(ClubSettings, 1)
        if settings is None:
            settings = self.add(ClubSettings(id=1))
        return settings
