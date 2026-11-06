"""Strategy pattern: whether a player is up to date with the club.

The account is computed from the payments every time (never stored), so it can not get out of sync.
MonthlyDueDayPolicy is the club's rule today: the month is overdue after the due day if there is no
verified or in-review payment for it. Another rule (e.g. a grace period) is another class.
"""
from abc import ABC, abstractmethod
from collections.abc import Sequence
from dataclasses import dataclass, field
from datetime import date

from enums import EnrollmentStatus, MonthStatus, PaymentConcept, PaymentStatus
from models import Payment, Player

MONTH_NAMES = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
]


@dataclass
class MonthState:
    year: int
    month: int
    status: MonthStatus
    payment_id: int | None = None

    @property
    def month_name(self) -> str:
        return MONTH_NAMES[self.month - 1]


@dataclass
class AccountState:
    is_up_to_date: bool
    enrollment_paid: bool
    overdue_months: int
    amount_due: int
    months: list[MonthState] = field(default_factory=list)


class PaymentStatusStrategy(ABC):
    @abstractmethod
    def account(self, player: Player, payments: Sequence[Payment], year: int, today: date | None = None) -> AccountState:
        ...


class MonthlyDueDayPolicy(PaymentStatusStrategy):
    def __init__(self, due_day: int, enrollment_fee: int):
        self.due_day = due_day
        self.enrollment_fee = enrollment_fee

    def account(self, player: Player, payments: Sequence[Payment], year: int, today: date | None = None) -> AccountState:
        today = today or date.today()
        counted = [p for p in payments if p.status != PaymentStatus.REJECTED]
        enrollment = next((p for p in counted if p.concept == PaymentConcept.ENROLLMENT), None)
        enrollment_paid = enrollment is not None and enrollment.status == PaymentStatus.VERIFIED
        by_month = {
            (p.period_year, p.period_month): p for p in counted if p.concept == PaymentConcept.MONTHLY
        }

        approved = player.enrollment_status == EnrollmentStatus.APPROVED
        # Monthly fees run from the month the enrollment was approved; before that nothing is owed
        start = player.approved_at.date() if approved and player.approved_at else date(today.year + 1, 1, 1)
        months: list[MonthState] = []
        overdue = 0
        for month in range(1, 13):
            months.append(state := self._month_state(year, month, start, today, by_month.get((year, month))))
            if state.status == MonthStatus.OVERDUE:
                overdue += 1

        # Overdue months of previous years since the enrollment also count
        for past_year in range(start.year, year):
            for month in range(1, 13):
                if self._month_state(past_year, month, start, today, by_month.get((past_year, month))).status == MonthStatus.OVERDUE:
                    overdue += 1

        enrollment_due = 0 if enrollment is not None else self.enrollment_fee
        amount_due = overdue * player.monthly_fee + enrollment_due
        return AccountState(
            is_up_to_date=approved and overdue == 0 and enrollment is not None,
            enrollment_paid=enrollment_paid,
            overdue_months=overdue,
            amount_due=amount_due,
            months=months,
        )

    def _month_state(self, year: int, month: int, start: date, today: date, payment: Payment | None) -> MonthState:
        if payment is not None:
            status = MonthStatus.PAID if payment.status == PaymentStatus.VERIFIED else MonthStatus.IN_REVIEW
            return MonthState(year, month, status, payment.id)
        if (year, month) < (start.year, start.month):
            return MonthState(year, month, MonthStatus.NOT_ENROLLED)
        if (year, month) > (today.year, today.month):
            return MonthState(year, month, MonthStatus.UPCOMING)
        if (year, month) == (today.year, today.month) and today.day <= self.due_day:
            return MonthState(year, month, MonthStatus.DUE)
        return MonthState(year, month, MonthStatus.OVERDUE)
