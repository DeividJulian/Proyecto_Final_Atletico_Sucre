"""Numbers for the admin dashboard."""
from datetime import date, datetime, timedelta, timezone

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from enums import AttendanceStatus, EnrollmentStatus, PaymentStatus
from models import Coach, Guardian
from repositories import AttendanceRepository, CategoryRepository, PaymentRepository, PlayerRepository
from schemas import CategoryCountOut, StatsOut
from services.payments import PaymentService
from services.storage import FileStorage


class StatsService:
    def __init__(self, session: Session, storage: FileStorage):
        self.session = session
        self.players = PlayerRepository(session)
        self.payments = PaymentRepository(session)
        self.attendance = AttendanceRepository(session)
        self.categories = CategoryRepository(session)
        self.payment_service = PaymentService(session, storage)

    def summary(self) -> StatsOut:
        today = date.today()
        month_start = datetime(today.year, today.month, 1, tzinfo=timezone.utc)
        next_month = datetime(today.year + (today.month == 12), today.month % 12 + 1, 1, tzinfo=timezone.utc)

        approved = self.players.search(status=EnrollmentStatus.APPROVED)
        up_to_date = sum(1 for p in approved if self.payment_service.account(p).is_up_to_date)

        counts = self.attendance.status_counts_since(today - timedelta(days=30))
        total = sum(counts.values())
        attended = counts.get(AttendanceStatus.PRESENT, 0) + counts.get(AttendanceStatus.LATE, 0)

        names = {c.id: c.name for c in self.categories.list()}
        by_category = [
            CategoryCountOut(category_id=cid, category_name=names.get(cid, "Sin categoría"), players=n)
            for cid, n in self.players.count_by_category(EnrollmentStatus.APPROVED)
        ]

        return StatsOut(
            players_approved=len(approved),
            players_pending=self.players.count_by_status(EnrollmentStatus.PENDING),
            guardians=self.session.scalar(select(func.count()).select_from(Guardian)) or 0,
            coaches_with_account=self.session.scalar(
                select(func.count()).select_from(Coach).where(Coach.user_id.is_not(None))
            ) or 0,
            payments_to_verify=self.payments.count_by_status(PaymentStatus.PENDING_VERIFICATION),
            players_up_to_date=up_to_date,
            players_overdue=len(approved) - up_to_date,
            revenue_this_month=self.payments.verified_total_between(month_start, next_month),
            attendance_rate_30_days=round(100 * attended / total, 1) if total else 0.0,
            by_category=sorted(by_category, key=lambda c: c.category_name),
        )
