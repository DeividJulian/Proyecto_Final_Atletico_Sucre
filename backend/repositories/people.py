"""Accounts, guardians, players and consents."""
from collections.abc import Sequence
from datetime import datetime

from sqlalchemy import func, or_, select
from sqlalchemy.orm import selectinload

from models import DataConsent, Guardian, OneTimeCode, Player, User
from repositories.base import SqlAlchemyRepository


class UserRepository(SqlAlchemyRepository[User]):
    model = User

    def get_by_email(self, email: str) -> User | None:
        return self.session.scalar(select(User).where(User.email == email.lower()))

    def count_admins(self) -> int:
        return self.session.scalar(select(func.count()).select_from(User).where(User.is_admin.is_(True))) or 0

    def admins(self) -> Sequence[User]:
        return self.session.scalars(select(User).where(User.is_admin.is_(True)).order_by(User.id)).all()


class CodeRepository(SqlAlchemyRepository[OneTimeCode]):
    model = OneTimeCode

    def latest_active(self, user_id: int, purpose: str, now: datetime) -> OneTimeCode | None:
        statement = (
            select(OneTimeCode)
            .where(
                OneTimeCode.user_id == user_id,
                OneTimeCode.purpose == purpose,
                OneTimeCode.used_at.is_(None),
                OneTimeCode.expires_at > now,
            )
            .order_by(OneTimeCode.created_at.desc())
        )
        return self.session.scalars(statement).first()

    def invalidate_all(self, user_id: int, purpose: str, now: datetime) -> None:
        for code in self.session.scalars(
            select(OneTimeCode).where(
                OneTimeCode.user_id == user_id, OneTimeCode.purpose == purpose, OneTimeCode.used_at.is_(None)
            )
        ):
            code.used_at = now
        self.session.flush()


class GuardianRepository(SqlAlchemyRepository[Guardian]):
    model = Guardian
    default_order = (Guardian.last_names, Guardian.first_names)

    def get_by_user(self, user_id: int) -> Guardian | None:
        return self.session.scalar(select(Guardian).where(Guardian.user_id == user_id))

    def get_by_document(self, document_number: str) -> Guardian | None:
        return self.session.scalar(select(Guardian).where(Guardian.document_number == document_number))

    def search(self, text: str | None = None) -> Sequence[Guardian]:
        statement = select(Guardian).options(selectinload(Guardian.players), selectinload(Guardian.user))
        if text:
            like = f"%{text.strip()}%"
            statement = statement.where(
                or_(
                    Guardian.first_names.ilike(like),
                    Guardian.last_names.ilike(like),
                    Guardian.document_number.ilike(like),
                    Guardian.phone.ilike(like),
                )
            )
        return self.session.scalars(statement.order_by(*self.default_order)).all()


class PlayerRepository(SqlAlchemyRepository[Player]):
    model = Player
    default_order = (Player.last_names, Player.first_names)

    def get_by_document(self, document_number: str) -> Player | None:
        return self.session.scalar(select(Player).where(Player.document_number == document_number))

    def list_by_guardian(self, guardian_id: int) -> Sequence[Player]:
        return self.session.scalars(
            select(Player).where(Player.guardian_id == guardian_id).order_by(Player.birth_date)
        ).all()

    def list_by_categories(self, category_ids: Sequence[int], status: str | None = None) -> Sequence[Player]:
        if not category_ids:
            return []
        statement = select(Player).where(Player.category_id.in_(category_ids))
        if status:
            statement = statement.where(Player.enrollment_status == status)
        return self.session.scalars(statement.order_by(*self.default_order)).all()

    def search(
        self, text: str | None = None, category_id: int | None = None, status: str | None = None
    ) -> Sequence[Player]:
        statement = select(Player).options(selectinload(Player.guardian), selectinload(Player.category))
        if text:
            like = f"%{text.strip()}%"
            statement = statement.where(
                or_(
                    Player.first_names.ilike(like),
                    Player.last_names.ilike(like),
                    Player.document_number.ilike(like),
                )
            )
        if category_id is not None:
            statement = statement.where(Player.category_id == category_id)
        if status:
            statement = statement.where(Player.enrollment_status == status)
        return self.session.scalars(statement.order_by(*self.default_order)).all()

    def count_by_status(self, status: str) -> int:
        return self.session.scalar(
            select(func.count()).select_from(Player).where(Player.enrollment_status == status)
        ) or 0

    def count_by_category(self, status: str) -> list[tuple[int | None, int]]:
        rows = self.session.execute(
            select(Player.category_id, func.count())
            .where(Player.enrollment_status == status)
            .group_by(Player.category_id)
        ).all()
        return [(category_id, count) for category_id, count in rows]


class ConsentRepository(SqlAlchemyRepository[DataConsent]):
    model = DataConsent
