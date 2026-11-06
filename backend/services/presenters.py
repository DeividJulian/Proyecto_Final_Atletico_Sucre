"""Turn entities into the answers of the API (computed fields: age, training shift, schedule, …)."""
from collections.abc import Sequence
from datetime import date
from urllib.parse import quote

from enums import SchoolShift, TrainingShift
from models import Announcement, Attendance, Guardian, Payment, Player, TrainingSession, User
from schemas import (
    AnnouncementOut,
    AttendanceOut,
    CategoryBriefOut,
    GuardianBriefOut,
    GuardianOut,
    PaymentAdminOut,
    PaymentOut,
    PlayerDetailOut,
    PlayerHealthOut,
    PlayerOut,
    ScheduleItemOut,
    UserOut,
)

WEEKDAY_NAMES = {1: "Lunes", 2: "Martes", 3: "Miércoles", 4: "Jueves", 5: "Viernes", 6: "Sábado", 7: "Domingo"}


def age_on(birth_date: date, today: date | None = None) -> int:
    today = today or date.today()
    return today.year - birth_date.year - ((today.month, today.day) < (birth_date.month, birth_date.day))


def training_shift(school_shift: str) -> str:
    """Players train in the opposite shift to their school; full-day students only on shared sessions."""
    return {
        SchoolShift.MORNING: TrainingShift.AFTERNOON,
        SchoolShift.AFTERNOON: TrainingShift.MORNING,
    }.get(school_shift, TrainingShift.ALL).value


def display_name(user: User) -> str:
    if user.guardian is not None:
        return user.guardian.full_name
    if user.coach is not None:
        return user.coach.full_name
    return user.email.split("@")[0]


def user_out(user: User) -> UserOut:
    return UserOut(
        id=user.id,
        email=user.email,
        role=user.role,
        is_admin=user.is_admin,
        is_active=user.is_active,
        must_change_password=user.must_change_password,
        display_name=display_name(user),
    )


def guardian_out(guardian: Guardian) -> GuardianOut:
    return GuardianOut.model_validate({**_columns(guardian), "full_name": guardian.full_name, "email": guardian.user.email})


def schedule_item(session: TrainingSession) -> ScheduleItemOut:
    return ScheduleItemOut(
        session_id=session.id,
        category_id=session.category_id,
        category_name=session.category.name,
        venue_id=session.venue_id,
        venue_name=session.venue.name,
        weekday=session.weekday,
        weekday_name=WEEKDAY_NAMES[session.weekday],
        start_time=session.start_time,
        end_time=session.end_time,
        shift=session.shift,
    )


def player_schedule(player: Player) -> list[ScheduleItemOut]:
    if player.category is None:
        return []
    # Sessions open to everybody plus the ones of the player's own training shift
    allowed = {TrainingShift.ALL.value, training_shift(player.school_shift)}
    sessions = [s for s in player.category.sessions if s.shift in allowed]
    return [schedule_item(s) for s in sorted(sessions, key=lambda s: (s.weekday, s.start_time))]


def player_out(player: Player) -> PlayerOut:
    return PlayerOut(
        id=player.id,
        first_names=player.first_names,
        last_names=player.last_names,
        full_name=player.full_name,
        document_type=player.document_type,
        document_number=player.document_number,
        birth_date=player.birth_date,
        age=age_on(player.birth_date),
        sex=player.sex,
        category=CategoryBriefOut.model_validate(player.category) if player.category else None,
        has_photo=player.photo_key is not None,
        jersey_number=player.jersey_number,
        position=player.position,
        school_name=player.school_name,
        school_shift=player.school_shift,
        training_shift=training_shift(player.school_shift),
        enrollment_status=player.enrollment_status,
        rejection_reason=player.rejection_reason,
        monthly_fee=player.monthly_fee,
        enrolled_at=player.enrolled_at,
    )


def player_detail(player: Player) -> PlayerDetailOut:
    return PlayerDetailOut(
        **player_out(player).model_dump(),
        health=PlayerHealthOut(
            eps=player.eps,
            blood_type=player.blood_type,
            allergies=player.allergies,
            medical_notes=player.medical_notes,
            emergency_contact_name=player.emergency_contact_name,
            emergency_contact_phone=player.emergency_contact_phone,
        ),
        guardian=GuardianBriefOut(
            id=player.guardian.id,
            full_name=player.guardian.full_name,
            phone=player.guardian.phone,
            relationship_to_player=player.guardian.relationship_to_player,
        ),
        schedule=player_schedule(player),
    )


def payment_out(payment: Payment) -> PaymentOut:
    return PaymentOut.model_validate({**_columns(payment), "has_receipt": payment.receipt_key is not None})


def payment_admin_out(payment: Payment) -> PaymentAdminOut:
    return PaymentAdminOut(
        **payment_out(payment).model_dump(),
        player_name=payment.player.full_name,
        guardian_name=payment.player.guardian.full_name,
        guardian_phone=payment.player.guardian.phone,
    )


def attendance_out(record: Attendance) -> AttendanceOut:
    return AttendanceOut(
        id=record.id,
        session_date=record.session_date,
        status=record.status,
        training_session_id=record.training_session_id,
        weekday=record.session.weekday,
        start_time=record.session.start_time,
        venue_name=record.session.venue.name,
    )


def announcement_out(item: Announcement) -> AnnouncementOut:
    return AnnouncementOut(
        id=item.id,
        category_id=item.category_id,
        category_name=item.category.name if item.category else None,
        title=item.title,
        body=item.body,
        created_at=item.created_at,
        expires_at=item.expires_at,
    )


def announcements_out(items: Sequence[Announcement]) -> list[AnnouncementOut]:
    return [announcement_out(item) for item in items]


def whatsapp_url(phone: str, text: str) -> str:
    """wa.me link to a Colombian number stored as 3XXXXXXXXX (or already with 57)."""
    number = phone if phone.startswith("57") and len(phone) == 12 else f"57{phone}"
    return f"https://wa.me/{number}?text={quote(text)}"


def _columns(entity) -> dict:
    return {column.key: getattr(entity, column.key) for column in entity.__table__.columns}
