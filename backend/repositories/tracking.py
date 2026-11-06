"""Attendance, payments, performance notes and announcements."""
from collections.abc import Sequence
from datetime import date, datetime

from sqlalchemy import func, or_, select
from sqlalchemy.orm import selectinload

from enums import PaymentStatus
from models import Announcement, Attendance, Payment, PerformanceNote, Player
from repositories.base import SqlAlchemyRepository


class AttendanceRepository(SqlAlchemyRepository[Attendance]):
    model = Attendance

    def for_session(self, session_id: int, session_date: date) -> Sequence[Attendance]:
        return self.session.scalars(
            select(Attendance).where(
                Attendance.training_session_id == session_id, Attendance.session_date == session_date
            )
        ).all()

    def for_player(self, player_id: int, date_from: date | None, date_to: date | None) -> Sequence[Attendance]:
        statement = select(Attendance).options(selectinload(Attendance.session)).where(Attendance.player_id == player_id)
        if date_from:
            statement = statement.where(Attendance.session_date >= date_from)
        if date_to:
            statement = statement.where(Attendance.session_date <= date_to)
        return self.session.scalars(statement.order_by(Attendance.session_date.desc())).all()

    def status_counts_since(self, since: date) -> dict[str, int]:
        rows = self.session.execute(
            select(Attendance.status, func.count()).where(Attendance.session_date >= since).group_by(Attendance.status)
        ).all()
        return {status: count for status, count in rows}


class PaymentRepository(SqlAlchemyRepository[Payment]):
    model = Payment
    default_order = (Payment.created_at.desc(),)

    def list_by_player(self, player_id: int) -> Sequence[Payment]:
        return self.session.scalars(
            select(Payment).where(Payment.player_id == player_id).order_by(Payment.created_at.desc())
        ).all()

    def find_active_for_period(
        self, player_id: int, concept: str, year: int | None, month: int | None
    ) -> Payment | None:
        """A payment for the same concept and period that is not rejected (avoids paying a month twice)."""
        statement = select(Payment).where(
            Payment.player_id == player_id,
            Payment.concept == concept,
            Payment.status != PaymentStatus.REJECTED,
        )
        statement = statement.where(
            Payment.period_year.is_(None) if year is None else Payment.period_year == year,
            Payment.period_month.is_(None) if month is None else Payment.period_month == month,
        )
        return self.session.scalars(statement).first()

    def search(
        self,
        status: str | None = None,
        player_id: int | None = None,
        year: int | None = None,
        month: int | None = None,
    ) -> Sequence[Payment]:
        statement = select(Payment).options(selectinload(Payment.player).selectinload(Player.guardian))
        if status:
            statement = statement.where(Payment.status == status)
        if player_id:
            statement = statement.where(Payment.player_id == player_id)
        if year:
            statement = statement.where(Payment.period_year == year)
        if month:
            statement = statement.where(Payment.period_month == month)
        return self.session.scalars(statement.order_by(Payment.created_at.desc())).all()

    def count_by_status(self, status: str) -> int:
        return self.session.scalar(select(func.count()).select_from(Payment).where(Payment.status == status)) or 0

    def verified_total_between(self, start: datetime, end: datetime) -> int:
        return self.session.scalar(
            select(func.coalesce(func.sum(Payment.amount), 0)).where(
                Payment.status == PaymentStatus.VERIFIED,
                Payment.verified_at >= start,
                Payment.verified_at < end,
            )
        ) or 0


class NoteRepository(SqlAlchemyRepository[PerformanceNote]):
    model = PerformanceNote

    def for_player(self, player_id: int, only_visible: bool) -> Sequence[PerformanceNote]:
        statement = select(PerformanceNote).where(PerformanceNote.player_id == player_id)
        if only_visible:
            statement = statement.where(PerformanceNote.visible_to_guardian.is_(True))
        return self.session.scalars(statement.order_by(PerformanceNote.note_date.desc())).all()


class AnnouncementRepository(SqlAlchemyRepository[Announcement]):
    model = Announcement
    default_order = (Announcement.created_at.desc(),)

    def visible_for(self, category_ids: Sequence[int], now: datetime) -> Sequence[Announcement]:
        """General notices plus the ones of the given categories, without the expired ones."""
        statement = select(Announcement).where(
            or_(Announcement.category_id.is_(None), Announcement.category_id.in_(list(category_ids) or [-1])),
            or_(Announcement.expires_at.is_(None), Announcement.expires_at > now),
        )
        return self.session.scalars(statement.order_by(Announcement.created_at.desc())).all()

    def by_author_or_categories(self, author_id: int, category_ids: Sequence[int]) -> Sequence[Announcement]:
        statement = select(Announcement).where(
            or_(Announcement.author_id == author_id, Announcement.category_id.in_(list(category_ids) or [-1]))
        )
        return self.session.scalars(statement.order_by(Announcement.created_at.desc())).all()
