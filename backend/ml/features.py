"""Features of the dropout-risk model, computed from the database for each approved player.

The same names and meaning are used by the synthetic generator (synthetic.py), so a model trained on the demo
data can be fed with real players, and later retrained with real history without changing the API.
"""
from collections.abc import Sequence
from dataclasses import asdict, dataclass
from datetime import date, datetime, timedelta, timezone

from enums import AttendanceStatus, EnrollmentStatus, PaymentStatus, SchoolShift
from models import Attendance, Payment, Player

# Order matters: it is the column order of the model
FEATURES: list[str] = [
    "attendance_rate_30",      # 0..1, attended (present or late) / recorded sessions, last 30 days
    "attendance_rate_60",      # 0..1, same for the last 60 days
    "consecutive_absences",    # absences in a row in the most recent records
    "overdue_months",          # monthly fees overdue (club rule, see payment_status.py)
    "rejected_payments",       # payments the admin rejected
    "tenure_months",           # months since the enrollment was approved
    "age",                     # years
    "trains_morning",          # 1 if the player trains in the morning shift (studies in the afternoon)
    "full_day_school",         # 1 if the school is full day (can only train on shared sessions)
]

# When a player has no attendance recorded yet in the window, a neutral prior is used instead of 0 or 1
NO_DATA_ATTENDANCE = 0.75

FEATURE_LABELS: dict[str, str] = {
    "attendance_rate_30": "Asistencia últimos 30 días",
    "attendance_rate_60": "Asistencia últimos 60 días",
    "consecutive_absences": "Faltas seguidas recientes",
    "overdue_months": "Meses en mora",
    "rejected_payments": "Pagos rechazados",
    "tenure_months": "Antigüedad en el club",
    "age": "Edad",
    "trains_morning": "Jornada de entrenamiento",
    "full_day_school": "Colegio de jornada única",
}


@dataclass(frozen=True)
class PlayerFeatures:
    attendance_rate_30: float
    attendance_rate_60: float
    consecutive_absences: int
    overdue_months: int
    rejected_payments: int
    tenure_months: int
    age: int
    trains_morning: int
    full_day_school: int

    def vector(self) -> list[float]:
        values = asdict(self)
        return [float(values[name]) for name in FEATURES]


def _attended(status: str) -> bool:
    return status in (AttendanceStatus.PRESENT, AttendanceStatus.LATE)


def attendance_rate(records: Sequence[Attendance], since: date) -> float:
    window = [r for r in records if r.session_date >= since]
    if not window:
        return NO_DATA_ATTENDANCE
    return round(sum(1 for r in window if _attended(r.status)) / len(window), 3)


def consecutive_absences(records: Sequence[Attendance]) -> int:
    """Absences in a row counting back from the most recent record (excused absences break the streak)."""
    streak = 0
    for record in sorted(records, key=lambda r: r.session_date, reverse=True):
        if record.status != AttendanceStatus.ABSENT:
            break
        streak += 1
    return streak


def months_between(start: date, end: date) -> int:
    return max(0, (end.year - start.year) * 12 + (end.month - start.month) - (end.day < start.day))


def age_on(birth: date, today: date) -> int:
    return today.year - birth.year - ((today.month, today.day) < (birth.month, birth.day))


def build_features(
    player: Player,
    attendance: Sequence[Attendance],
    payments: Sequence[Payment],
    overdue_months: int,
    today: date | None = None,
) -> PlayerFeatures:
    today = today or date.today()
    approved_on = player.approved_at.date() if player.approved_at else player.enrolled_at
    return PlayerFeatures(
        attendance_rate_30=attendance_rate(attendance, today - timedelta(days=30)),
        attendance_rate_60=attendance_rate(attendance, today - timedelta(days=60)),
        consecutive_absences=consecutive_absences(attendance),
        overdue_months=overdue_months,
        rejected_payments=sum(1 for p in payments if p.status == PaymentStatus.REJECTED),
        tenure_months=months_between(approved_on, today),
        age=age_on(player.birth_date, today),
        # Studies in the afternoon → trains in the morning
        trains_morning=int(player.school_shift == SchoolShift.AFTERNOON),
        full_day_school=int(player.school_shift == SchoolShift.FULL_DAY),
    )


def is_scorable(player: Player) -> bool:
    return player.enrollment_status == EnrollmentStatus.APPROVED


def utc_today() -> date:
    return datetime.now(timezone.utc).date()
