"""Unit tests of the two Strategy implementations (no database needed)."""
from datetime import date, datetime, timezone
from types import SimpleNamespace

from enums import MonthStatus, PaymentStatus
from models import Category
from services.category_strategy import AgeAtCutoffStrategy, BirthYearRangeStrategy
from services.payment_status import MonthlyDueDayPolicy

CATEGORIES = [
    Category(id=1, name="2014-2015", birth_year_from=2014, birth_year_to=2015, gender="mixed", is_active=True, display_order=0),
    Category(id=2, name="2016-2017", birth_year_from=2016, birth_year_to=2017, gender="mixed", is_active=True, display_order=1),
    Category(id=3, name="Femenino", birth_year_from=2009, birth_year_to=2020, gender="female", is_active=True, display_order=2),
    Category(id=4, name="Antigua", birth_year_from=2014, birth_year_to=2014, gender="mixed", is_active=False, display_order=3),
]


def test_birth_year_strategy():
    strategy = BirthYearRangeStrategy()
    assert strategy.assign(date(2015, 12, 31), "M", CATEGORIES).name == "2014-2015"
    assert strategy.assign(date(2016, 1, 1), "M", CATEGORIES).name == "2016-2017"
    assert strategy.assign(date(2016, 1, 1), "F", CATEGORIES).name == "Femenino"
    assert strategy.assign(date(2012, 1, 1), "M", CATEGORIES) is None
    # Inactive categories are ignored even when they are narrower
    assert strategy.assign(date(2014, 5, 5), "M", CATEGORIES).id == 1


def test_age_at_cutoff_strategy():
    strategy = AgeAtCutoffStrategy(cutoff=date(2026, 1, 1))
    # Born 2015-06-01 → 10 on the cut-off → equivalent birth year 2016
    assert strategy.assign(date(2015, 6, 1), "M", CATEGORIES).name == "2016-2017"


def _player(approved_at):
    return SimpleNamespace(
        enrollment_status="approved", approved_at=approved_at, monthly_fee=65000, enrolled_at=date(2026, 1, 1)
    )


def _payment(pid, concept, year, month, status=PaymentStatus.VERIFIED):
    return SimpleNamespace(id=pid, concept=concept, period_year=year, period_month=month, status=status)


def test_monthly_due_day_policy():
    policy = MonthlyDueDayPolicy(due_day=5, enrollment_fee=20000)
    player = _player(datetime(2026, 2, 10, tzinfo=timezone.utc))  # approved on February 10th
    payments = [
        _payment(1, "enrollment", None, None),
        _payment(2, "monthly", 2026, 3),
        _payment(3, "monthly", 2026, 4, PaymentStatus.PENDING_VERIFICATION),
        _payment(4, "monthly", 2026, 5, PaymentStatus.REJECTED),
    ]
    state = policy.account(player, payments, 2026, today=date(2026, 6, 3))
    statuses = [m.status for m in state.months]
    assert statuses[0] == MonthStatus.NOT_ENROLLED  # January, before approval
    assert statuses[1] == MonthStatus.GRACE         # approval month never becomes overdue
    assert statuses[2] == MonthStatus.PAID
    assert statuses[3] == MonthStatus.IN_REVIEW
    assert statuses[4] == MonthStatus.OVERDUE       # rejected payment does not count
    assert statuses[5] == MonthStatus.DUE           # June 3rd, due day is 5
    assert statuses[6] == MonthStatus.UPCOMING
    assert state.overdue_months == 1
    assert state.amount_due == 65000
    assert state.is_up_to_date is False

    after_due_day = policy.account(player, payments, 2026, today=date(2026, 6, 6))
    assert after_due_day.overdue_months == 2


def test_approval_month_is_grace_even_after_due_day():
    """Approved on the 20th: that month is not owed; the first charge is next month with the due day."""
    policy = MonthlyDueDayPolicy(due_day=5, enrollment_fee=20000)
    player = _player(datetime(2026, 11, 20, tzinfo=timezone.utc))
    enrollment = [_payment(1, "enrollment", None, None)]

    november = policy.account(player, enrollment, 2026, today=date(2026, 11, 28))
    assert november.months[10].status == MonthStatus.GRACE
    assert november.is_up_to_date is True and november.overdue_months == 0

    december_before = policy.account(player, enrollment, 2026, today=date(2026, 12, 5))
    assert december_before.months[11].status == MonthStatus.DUE and december_before.is_up_to_date is True

    december_after = policy.account(player, enrollment, 2026, today=date(2026, 12, 6))
    assert december_after.months[11].status == MonthStatus.OVERDUE and december_after.overdue_months == 1

    # Months of the previous year since the first charged month keep counting the next year
    january = policy.account(player, enrollment, 2027, today=date(2027, 1, 10))
    assert january.overdue_months == 2  # December 2026 + January 2027
    assert january.amount_due == 2 * 65000
