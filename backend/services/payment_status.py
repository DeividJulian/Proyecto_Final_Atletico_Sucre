"""Strategy pattern: whether a player is up to date with the club.

The account is computed from the payments every time (never stored), so it can not get out of sync.
MonthlyDueDayPolicy is the club's rule today:
- the month the enrollment is approved is a grace month: it never becomes overdue;
- from the following month on, a month is overdue after the due day (club_settings.due_day) if there is
  no verified or in-review payment for it.
Another rule is another class implementing PaymentStatusStrategy.
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


def _next_month(year: int, month: int) -> tuple[int, int]:
    return (year + 1, 1) if month == 12 else (year, month + 1)


class MonthlyDueDayPolicy(PaymentStatusStrategy):
    def __init__(self, due_day: int, enrollment_fee: int):
        self.due_day = due_day
        self.enrollment_fee = enrollment_fee

    def account(self, player: Player, payments: Sequence[Payment], year: int, today: date | None = None) -> AccountState:
        today = today or date.today()
        counted = [p for p in payments if p.status != PaymentStatus.REJECTED]
        enrollment = next((p for p in counted if p.concept == PaymentConcept.ENROLLMENT), None)
        by_month = {(p.period_year, p.period_month): p for p in counted if p.concept == PaymentConcept.MONTHLY}

        approved = player.enrollment_status == EnrollmentStatus.APPROVED and player.approved_at is not None
        # (year, month) of the approval = grace month; the first month that can be charged is the next one
        grace = (player.approved_at.year, player.approved_at.month) if approved else None
        first_charged = _next_month(*grace) if grace else None

        def state(y: int, m: int) -> MonthState:
            return self._month_state(y, m, grace, today, by_month.get((y, m)))

        months = [state(year, month) for month in range(1, 13)]
        overdue = sum(1 for m in months if m.status == MonthStatus.OVERDUE)
        # Overdue months of previous years since the first charged month also count
        if first_charged:
            for past_year in range(first_charged[0], year):
                overdue += sum(1 for month in range(1, 13) if state(past_year, month).status == MonthStatus.OVERDUE)

        enrollment_due = 0 if enrollment is not None else self.enrollment_fee
        return AccountState(
            is_up_to_date=approved and overdue == 0 and enrollment is not None,
            enrollment_paid=enrollment is not None and enrollment.status == PaymentStatus.VERIFIED,
            overdue_months=overdue,
            amount_due=overdue * player.monthly_fee + enrollment_due,
            months=months,
        )

    def _month_state(
        self,
        year: int,
        month: int,
        grace: tuple[int, int] | None,
        today: date,
        payment: Payment | None,
    ) -> MonthState:
        if payment is not None:
            status = MonthStatus.PAID if payment.status == PaymentStatus.VERIFIED else MonthStatus.IN_REVIEW
            return MonthState(year, month, status, payment.id)
        if grace is None or (year, month) < grace:
            return MonthState(year, month, MonthStatus.NOT_ENROLLED)
        if (year, month) == grace:
            return MonthState(year, month, MonthStatus.GRACE)
        if (year, month) > (today.year, today.month):
            return MonthState(year, month, MonthStatus.UPCOMING)
        if (year, month) == (today.year, today.month) and today.day <= self.due_day:
            return MonthState(year, month, MonthStatus.DUE)
        return MonthState(year, month, MonthStatus.OVERDUE)
