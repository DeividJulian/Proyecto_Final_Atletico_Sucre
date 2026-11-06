"""Admin-managed content: coaches and their accounts, news, app releases and the club settings."""
import re
import unicodedata
from datetime import datetime, timezone

from sqlalchemy.orm import Session

from enums import Role
from models import AppRelease, ClubSettings, Coach, News, User
from repositories import AppReleaseRepository, CoachRepository, NewsRepository, SettingsRepository, UserRepository
from schemas import AppReleaseIn, ClubSettingsIn, CoachAccountIn, CoachIn, CoachOut, NewsIn, PublicClubOut
from security import hash_password
from services.errors import Conflict, NotFound
from services.presenters import whatsapp_url

NO_NEQUI_MESSAGE = "Consulta los datos de pago por WhatsApp"


def slugify(text: str) -> str:
    ascii_text = unicodedata.normalize("NFKD", text).encode("ascii", "ignore").decode()
    return re.sub(r"[^a-z0-9]+", "-", ascii_text.lower()).strip("-")[:150] or "noticia"


def coach_out(coach: Coach) -> CoachOut:
    return CoachOut(
        id=coach.id,
        full_name=coach.full_name,
        role_title=coach.role_title,
        credentials=coach.credentials or [],
        photo_url=coach.photo_url,
        photo_position=coach.photo_position,
        display_order=coach.display_order,
        is_public=coach.is_public,
        has_account=coach.user_id is not None,
        email=coach.user.email if coach.user else None,
        account_active=coach.user.is_active if coach.user else None,
    )


class CoachService:
    def __init__(self, session: Session):
        self.session = session
        self.coaches = CoachRepository(session)
        self.users = UserRepository(session)

    def _coach(self, coach_id: int) -> Coach:
        coach = self.coaches.get(coach_id)
        if coach is None:
            raise NotFound("No encontramos ese profesor.")
        return coach

    def create(self, data: CoachIn) -> Coach:
        coach = self.coaches.add(Coach(**data.model_dump()))
        self.session.commit()
        return coach

    def update(self, coach_id: int, data: CoachIn) -> Coach:
        coach = self.coaches.update(self._coach(coach_id), data.model_dump())
        self.session.commit()
        return coach

    def create_account(self, coach_id: int, data: CoachAccountIn) -> Coach:
        """Gives a public coach profile a login (role coach, never admin: admins only come from ADMIN_EMAILS)."""
        coach = self._coach(coach_id)
        if coach.user_id is not None:
            raise Conflict("Este profesor ya tiene una cuenta.")
        if self.users.get_by_email(data.email):
            raise Conflict("Ya existe una cuenta con ese correo.")
        user = self.users.add(
            User(email=data.email.lower(), password_hash=hash_password(data.password), role=Role.COACH, must_change_password=True)
        )
        coach.user_id = user.id
        self.session.commit()
        return coach

    def set_account_active(self, coach_id: int, active: bool) -> Coach:
        coach = self._coach(coach_id)
        if coach.user is None:
            raise NotFound("Este profesor no tiene cuenta.")
        if coach.user.is_admin and not active:
            raise Conflict("No se puede desactivar a un administrador desde aquí (se configura en ADMIN_EMAILS).")
        coach.user.is_active = active
        self.session.commit()
        return coach


class NewsService:
    def __init__(self, session: Session):
        self.session = session
        self.news = NewsRepository(session)

    def _unique_slug(self, title: str, current_id: int | None = None) -> str:
        base = slugify(title)
        slug, n = base, 2
        while (existing := self.news.get_by_slug(slug)) is not None and existing.id != current_id:
            slug, n = f"{base}-{n}", n + 1
        return slug

    def create(self, author: User, data: NewsIn) -> News:
        item = News(author_id=author.id, slug=self._unique_slug(data.title), **data.model_dump())
        if item.is_published:
            item.published_at = datetime.now(timezone.utc)
        self.news.add(item)
        self.session.commit()
        return item

    def update(self, news_id: int, data: NewsIn) -> News:
        item = self.news.get(news_id)
        if item is None:
            raise NotFound("No encontramos esa noticia.")
        was_published = item.is_published
        self.news.update(item, data.model_dump())
        item.slug = self._unique_slug(data.title, current_id=item.id)
        if item.is_published and not was_published:
            item.published_at = datetime.now(timezone.utc)
        self.session.commit()
        return item


class ReleaseService:
    def __init__(self, session: Session):
        self.session = session
        self.releases = AppReleaseRepository(session)

    def publish(self, admin: User, data: AppReleaseIn) -> AppRelease:
        if any(r.version == data.version for r in self.releases.list()):
            raise Conflict(f"La versión {data.version} ya está registrada.")
        if data.is_current:
            self.releases.clear_current()
        release = self.releases.add(AppRelease(created_by_id=admin.id, **data.model_dump()))
        self.session.commit()
        return release

    def make_current(self, release_id: int) -> AppRelease:
        release = self.releases.get(release_id)
        if release is None:
            raise NotFound("No encontramos esa versión.")
        self.releases.clear_current()
        release.is_current = True
        self.session.commit()
        return release


class SettingsService:
    def __init__(self, session: Session):
        self.session = session
        self.settings = SettingsRepository(session)

    def get(self) -> ClubSettings:
        return self.settings.get_or_create()

    def update(self, data: ClubSettingsIn) -> ClubSettings:
        settings = self.settings.update(self.settings.get_or_create(), data.model_dump())
        self.session.commit()
        return settings

    def public(self) -> PublicClubOut:
        s = self.settings.get_or_create()
        has_nequi = bool(s.nequi_number and s.nequi_holder)
        return PublicClubOut(
            enrollment_fee=s.enrollment_fee,
            monthly_fee=s.monthly_fee,
            due_day=s.due_day,
            sibling_discount_percent=s.sibling_discount_percent,
            payment_methods=["Efectivo", "Nequi"],
            nequi_number=s.nequi_number if has_nequi else None,
            nequi_holder=s.nequi_holder if has_nequi else None,
            payment_contact_message=None if has_nequi else NO_NEQUI_MESSAGE,
            whatsapp=s.whatsapp,
            whatsapp_url=whatsapp_url(s.whatsapp, "Hola, quiero información sobre el Club Atlético Sucre."),
            payment_instructions=s.payment_instructions,
            uniform_store=s.uniform_store,
            data_policy_version=s.data_policy_version,
            data_policy_text=s.data_policy_text,
        )
