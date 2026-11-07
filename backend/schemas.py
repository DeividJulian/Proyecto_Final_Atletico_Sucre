"""Pydantic schemas: what the API accepts (…In / …Update) and what it answers (…Out).

Validation messages are in Spanish because the frontend shows them to the user.
"""
import re
from datetime import date, datetime, time
from typing import Annotated, Self

from pydantic import (
    AfterValidator,
    BaseModel,
    ConfigDict,
    EmailStr,
    Field,
    StringConstraints,
    field_validator,
    model_validator,
)

import email_validator

# The test accounts use the reserved ".test" domain (profesor@atleticosucre.test …), which email-validator rejects
# by default. Only that special-use name is allowed; mail to it is simply never delivered.
if "test" in email_validator.SPECIAL_USE_DOMAIN_NAMES:
    email_validator.SPECIAL_USE_DOMAIN_NAMES.remove("test")

from enums import (  # noqa: E402
    AttendanceStatus,
    BloodType,
    CategoryGender,
    ConsentType,
    EnrollmentStatus,
    GuardianDocumentType,
    MediaType,
    MonthStatus,
    PaymentConcept,
    PaymentMethod,
    PaymentStatus,
    PlayerDocumentType,
    Position,
    Relationship,
    SchoolShift,
    Sex,
    TrainingShift,
)

# ---------------------------------------------------------------- reusable field types

NAME_RE = re.compile(r"^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ' .-]+$")


def _name(value: str) -> str:
    value = " ".join(value.split())
    if not NAME_RE.match(value):
        raise ValueError("Solo se permiten letras, espacios, apóstrofo y guion.")
    return value


def _phone(value: str) -> str:
    """Colombian mobile number: 10 digits starting with 3; accepts +57, spaces and dashes. Stored as 3XXXXXXXXX."""
    digits = re.sub(r"[\s\-().]", "", value)
    if digits.startswith("+57"):
        digits = digits[3:]
    elif digits.startswith("57") and len(digits) == 12:
        digits = digits[2:]
    if not re.fullmatch(r"3\d{9}", digits):
        raise ValueError("Escribe un celular colombiano de 10 dígitos que empiece por 3 (por ejemplo 3218543957).")
    return digits


def _document(value: str) -> str:
    cleaned = re.sub(r"[\s.\-]", "", value).upper()
    if not re.fullmatch(r"[A-Z0-9]{5,15}", cleaned):
        raise ValueError("El documento debe tener entre 5 y 15 letras o números, sin puntos ni espacios.")
    return cleaned


def _password(value: str) -> str:
    if len(value) < 8:
        raise ValueError("La contraseña debe tener al menos 8 caracteres.")
    if not re.search(r"[A-Za-z]", value) or not re.search(r"\d", value):
        raise ValueError("La contraseña debe tener letras y números.")
    return value


def _birth_date(value: date) -> date:
    today = date.today()
    if value >= today:
        raise ValueError("La fecha de nacimiento debe ser anterior a hoy.")
    if today.year - value.year < 3:
        raise ValueError("El deportista debe tener al menos 3 años.")
    if today.year - value.year > 20:
        raise ValueError("Revisa la fecha de nacimiento: el club forma deportistas de 4 a 16 años.")
    return value


def _strip_or_none(value: str | None) -> str | None:
    if value is None:
        return None
    value = value.strip()
    return value or None


PersonName = Annotated[str, StringConstraints(min_length=2, max_length=80), AfterValidator(_name)]
BirthDate = Annotated[date, AfterValidator(_birth_date)]
Phone = Annotated[str, AfterValidator(_phone)]
Document = Annotated[str, AfterValidator(_document)]
Password = Annotated[str, StringConstraints(max_length=128), AfterValidator(_password)]
ShortText = Annotated[str, StringConstraints(strip_whitespace=True, min_length=2, max_length=160)]
OptionalText = Annotated[str | None, AfterValidator(_strip_or_none)]


class ORMModel(BaseModel):
    model_config = ConfigDict(from_attributes=True)


# ---------------------------------------------------------------- generic answers

class ErrorOut(BaseModel):
    detail: str


class MessageOut(BaseModel):
    detail: str


class HealthOut(BaseModel):
    status: str


# ---------------------------------------------------------------- guardian / player input

class GuardianIn(BaseModel):
    first_names: PersonName
    last_names: PersonName
    document_type: GuardianDocumentType
    document_number: Document
    phone: Phone
    alt_phone: Phone | None = None
    address: ShortText
    neighborhood: OptionalText = Field(default=None, max_length=80)
    city: ShortText = "Ipiales"
    relationship_to_player: Relationship


class GuardianUpdate(BaseModel):
    """What the parent can change of their own profile (the document identifies them and is not editable)."""
    first_names: PersonName | None = None
    last_names: PersonName | None = None
    phone: Phone | None = None
    alt_phone: Phone | None = None
    address: ShortText | None = None
    neighborhood: OptionalText = Field(default=None, max_length=80)
    city: ShortText | None = None
    relationship_to_player: Relationship | None = None


class PlayerIn(BaseModel):
    first_names: PersonName
    last_names: PersonName
    document_type: PlayerDocumentType
    document_number: Document
    birth_date: BirthDate
    sex: Sex
    school_name: ShortText
    school_shift: SchoolShift
    eps: Annotated[str, StringConstraints(strip_whitespace=True, min_length=2, max_length=80)]
    blood_type: BloodType | None = None
    allergies: OptionalText = Field(default=None, max_length=1000)
    medical_notes: OptionalText = Field(default=None, max_length=1000)
    emergency_contact_name: Annotated[str, StringConstraints(min_length=3, max_length=120), AfterValidator(_name)]
    emergency_contact_phone: Phone


class PlayerUpdate(BaseModel):
    """Fields the parent may correct. Jersey, position, category and status are managed by the club."""
    first_names: PersonName | None = None
    last_names: PersonName | None = None
    birth_date: BirthDate | None = None
    sex: Sex | None = None
    school_name: ShortText | None = None
    school_shift: SchoolShift | None = None
    eps: Annotated[str, StringConstraints(strip_whitespace=True, min_length=2, max_length=80)] | None = None
    blood_type: BloodType | None = None
    allergies: OptionalText = Field(default=None, max_length=1000)
    medical_notes: OptionalText = Field(default=None, max_length=1000)
    emergency_contact_name: Annotated[str, StringConstraints(min_length=3, max_length=120), AfterValidator(_name)] | None = None
    emergency_contact_phone: Phone | None = None


class PlayerSportsUpdate(BaseModel):
    """Filled in by the coach."""
    jersey_number: int | None = Field(default=None, ge=1, le=99)
    position: Position | None = None


class PlayerAdminUpdate(PlayerUpdate, PlayerSportsUpdate):
    category_id: int | None = None
    monthly_fee: int | None = Field(default=None, ge=0)
    enrollment_status: EnrollmentStatus | None = None


class RegisterIn(BaseModel):
    email: EmailStr
    password: Password
    guardian: GuardianIn
    players: list[PlayerIn] = Field(min_length=1, max_length=6)
    accept_data_policy: bool = Field(description="Autorización de tratamiento de datos (Ley 1581 de 2012). Obligatoria.")
    accept_image_use: bool = Field(default=False, description="Autorización de uso de imagen del deportista. Opcional.")

    @field_validator("email")
    @classmethod
    def lower_email(cls, value: str) -> str:
        return value.lower()

    @model_validator(mode="after")
    def check_consent_and_duplicates(self) -> Self:
        if not self.accept_data_policy:
            raise ValueError("Debes aceptar la política de tratamiento de datos personales para registrarte.")
        documents = [p.document_number for p in self.players]
        if len(documents) != len(set(documents)):
            raise ValueError("Hay dos deportistas con el mismo número de documento.")
        if self.guardian.document_number in documents:
            raise ValueError("El documento del acudiente no puede ser igual al de un deportista.")
        return self


# ---------------------------------------------------------------- auth

class LoginIn(BaseModel):
    email: EmailStr
    password: str = Field(min_length=1, max_length=128)

    @field_validator("email")
    @classmethod
    def lower_email(cls, value: str) -> str:
        return value.lower()


class ForgotPasswordIn(BaseModel):
    email: EmailStr


class ResetPasswordIn(BaseModel):
    email: EmailStr
    code: Annotated[str, StringConstraints(pattern=r"^\d{6}$")]
    new_password: Password


class ChangePasswordIn(BaseModel):
    current_password: str = Field(min_length=1, max_length=128)
    new_password: Password


class UserOut(ORMModel):
    id: int
    email: str
    role: str
    is_admin: bool
    is_active: bool
    must_change_password: bool
    display_name: str


class TokenOut(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut


# ---------------------------------------------------------------- catalog (venues, categories, sessions, coaches)

class VenueIn(BaseModel):
    name: ShortText
    description: OptionalText = Field(default=None, max_length=300)
    surface: OptionalText = Field(default=None, max_length=60)
    is_main: bool = False
    address: OptionalText = Field(default=None, max_length=160)
    maps_url: OptionalText = Field(default=None, max_length=500)
    is_active: bool = True


class VenueOut(ORMModel, VenueIn):
    id: int


class CategoryIn(BaseModel):
    name: Annotated[str, StringConstraints(strip_whitespace=True, min_length=2, max_length=60)]
    birth_year_from: int = Field(ge=1990, le=2100)
    birth_year_to: int = Field(ge=1990, le=2100)
    gender: CategoryGender = CategoryGender.MIXED
    coach_id: int | None = None
    description: OptionalText = Field(default=None, max_length=300)
    display_order: int = 0
    is_active: bool = True

    @model_validator(mode="after")
    def years_in_order(self) -> Self:
        if self.birth_year_from > self.birth_year_to:
            raise ValueError("El año inicial de la categoría no puede ser mayor que el año final.")
        return self


class CategoryOut(ORMModel, CategoryIn):
    id: int


class TrainingSessionIn(BaseModel):
    category_id: int
    venue_id: int
    weekday: int = Field(ge=1, le=7, description="1 = lunes … 7 = domingo")
    start_time: time
    end_time: time
    shift: TrainingShift = TrainingShift.ALL

    @model_validator(mode="after")
    def times_in_order(self) -> Self:
        if self.start_time >= self.end_time:
            raise ValueError("La hora de inicio debe ser anterior a la hora de fin.")
        return self


class TrainingSessionOut(ORMModel, TrainingSessionIn):
    id: int


class ScheduleItemOut(BaseModel):
    session_id: int
    category_id: int
    category_name: str
    venue_id: int
    venue_name: str
    weekday: int
    weekday_name: str
    start_time: time
    end_time: time
    shift: str


class CoachIn(BaseModel):
    full_name: Annotated[str, StringConstraints(min_length=3, max_length=120), AfterValidator(_name)]
    role_title: ShortText = "Entrenador"
    credentials: list[Annotated[str, StringConstraints(strip_whitespace=True, min_length=2, max_length=200)]] = []
    photo_url: OptionalText = Field(default=None, max_length=300)
    photo_position: str = Field(default="top", max_length=30)
    display_order: int = 0
    is_public: bool = True


class CoachOut(ORMModel):
    id: int
    full_name: str
    role_title: str
    credentials: list[str]
    photo_url: str | None
    photo_position: str
    display_order: int
    is_public: bool
    has_account: bool = False
    email: str | None = None
    account_active: bool | None = None


class CoachAccountIn(BaseModel):
    email: EmailStr
    password: Password


# ---------------------------------------------------------------- player / guardian output

class CategoryBriefOut(ORMModel):
    id: int
    name: str
    birth_year_from: int
    birth_year_to: int
    gender: str


class PlayerOut(ORMModel):
    id: int
    first_names: str
    last_names: str
    full_name: str
    document_type: str
    document_number: str
    birth_date: date
    age: int
    sex: str
    category: CategoryBriefOut | None
    has_photo: bool
    jersey_number: int | None
    position: str | None
    school_name: str
    school_shift: str
    training_shift: str
    enrollment_status: str
    rejection_reason: str | None
    monthly_fee: int
    enrolled_at: date


class PlayerHealthOut(BaseModel):
    eps: str
    blood_type: str | None
    allergies: str | None
    medical_notes: str | None
    emergency_contact_name: str
    emergency_contact_phone: str


class GuardianBriefOut(ORMModel):
    id: int
    full_name: str
    phone: str
    relationship_to_player: str


class PlayerDetailOut(PlayerOut):
    health: PlayerHealthOut
    guardian: GuardianBriefOut
    schedule: list[ScheduleItemOut]


class GuardianOut(ORMModel):
    id: int
    first_names: str
    last_names: str
    full_name: str
    document_type: str
    document_number: str
    phone: str
    alt_phone: str | None
    address: str
    neighborhood: str | None
    city: str
    relationship_to_player: str
    email: str


class ConsentOut(ORMModel):
    consent_type: ConsentType
    policy_version: str
    accepted: bool
    accepted_at: datetime


class GuardianAdminOut(GuardianOut):
    players: list[PlayerOut]
    consents: list[ConsentOut]


class RegisterOut(TokenOut):
    guardian: GuardianOut
    players: list[PlayerOut]


# ---------------------------------------------------------------- enrollment

class ApproveIn(BaseModel):
    category_id: int | None = Field(default=None, description="Si se omite se mantiene la categoría calculada")
    monthly_fee: int | None = Field(default=None, ge=0)


class RejectIn(BaseModel):
    reason: Annotated[str, StringConstraints(strip_whitespace=True, min_length=5, max_length=300)]


# ---------------------------------------------------------------- attendance

class AttendanceRecordIn(BaseModel):
    player_id: int
    status: AttendanceStatus


class AttendanceSheetIn(BaseModel):
    session_date: date
    records: list[AttendanceRecordIn] = Field(min_length=1, max_length=200)


class AttendanceRowOut(BaseModel):
    player_id: int
    player_name: str
    jersey_number: int | None
    status: str | None


class AttendanceSheetOut(BaseModel):
    session_id: int
    session_date: date
    category_name: str
    rows: list[AttendanceRowOut]


class AttendanceOut(ORMModel):
    id: int
    session_date: date
    status: str
    training_session_id: int
    weekday: int
    start_time: time
    venue_name: str


class AttendanceSummaryOut(BaseModel):
    total: int
    present: int
    absent: int
    excused: int
    late: int
    rate: float = Field(description="Porcentaje de asistencia (presente + tarde)")
    records: list[AttendanceOut]


# ---------------------------------------------------------------- payments

class PaymentReportIn(BaseModel):
    """Payment reported by a parent; the receipt file is sent in the same multipart request."""
    concept: PaymentConcept
    period_year: int | None = Field(default=None, ge=2020, le=2100)
    period_month: int | None = Field(default=None, ge=1, le=12)
    amount: int = Field(gt=0, le=5_000_000)
    method: PaymentMethod
    paid_on: date
    reference_number: OptionalText = Field(default=None, max_length=60)
    notes: OptionalText = Field(default=None, max_length=500)

    @model_validator(mode="after")
    def period_matches_concept(self) -> Self:
        if self.concept == PaymentConcept.MONTHLY and (self.period_year is None or self.period_month is None):
            raise ValueError("Para una mensualidad indica el año y el mes que pagas.")
        if self.concept == PaymentConcept.ENROLLMENT:
            self.period_year = None
            self.period_month = None
        if self.paid_on > date.today():
            raise ValueError("La fecha de pago no puede ser futura.")
        return self


class PaymentAdminIn(PaymentReportIn):
    player_id: int


class PaymentOut(ORMModel):
    id: int
    player_id: int
    concept: str
    period_year: int | None
    period_month: int | None
    amount: int
    method: str
    paid_on: date
    reference_number: str | None
    has_receipt: bool
    status: str
    rejection_reason: str | None
    notes: str | None
    created_at: datetime
    verified_at: datetime | None


class PaymentAdminOut(PaymentOut):
    player_name: str
    guardian_name: str
    guardian_phone: str


class MonthStatusOut(BaseModel):
    year: int
    month: int
    month_name: str
    status: MonthStatus
    payment_id: int | None


class AccountStatusOut(BaseModel):
    player_id: int
    is_up_to_date: bool
    enrollment_paid: bool
    overdue_months: int
    amount_due: int
    months: list[MonthStatusOut]
    payments: list[PaymentOut]


class OverdueOut(BaseModel):
    player_id: int
    player_name: str
    category_name: str | None
    guardian_name: str
    guardian_phone: str
    overdue_months: int
    amount_due: int
    whatsapp_url: str


class PaymentRejectIn(RejectIn):
    pass


# ---------------------------------------------------------------- notes and announcements

class NoteIn(BaseModel):
    note_date: date = Field(default_factory=date.today)
    content: Annotated[str, StringConstraints(strip_whitespace=True, min_length=3, max_length=2000)]
    visible_to_guardian: bool = True


class NoteOut(ORMModel):
    id: int
    player_id: int
    note_date: date
    content: str
    visible_to_guardian: bool
    created_at: datetime


class AnnouncementIn(BaseModel):
    category_id: int | None = Field(default=None, description="Vacío = aviso general (solo administradores)")
    title: Annotated[str, StringConstraints(strip_whitespace=True, min_length=3, max_length=120)]
    body: Annotated[str, StringConstraints(strip_whitespace=True, min_length=3, max_length=4000)]
    expires_at: datetime | None = None


class AnnouncementOut(ORMModel):
    id: int
    category_id: int | None
    category_name: str | None
    title: str
    body: str
    created_at: datetime
    expires_at: datetime | None


# ---------------------------------------------------------------- content

class NewsIn(BaseModel):
    title: Annotated[str, StringConstraints(strip_whitespace=True, min_length=3, max_length=160)]
    summary: OptionalText = Field(default=None, max_length=300)
    body: Annotated[str, StringConstraints(strip_whitespace=True, min_length=3)]
    cover_url: OptionalText = Field(default=None, max_length=500)
    is_published: bool = False


class NewsOut(ORMModel, NewsIn):
    id: int
    slug: str
    published_at: datetime | None
    created_at: datetime


class GalleryItemIn(BaseModel):
    title: ShortText
    caption: OptionalText = Field(default=None, max_length=300)
    media_url: Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=500)]
    media_type: MediaType = MediaType.IMAGE
    tag: OptionalText = Field(default=None, max_length=40)
    display_order: int = 0


class GalleryItemOut(ORMModel, GalleryItemIn):
    id: int


class AppReleaseIn(BaseModel):
    version: Annotated[str, StringConstraints(pattern=r"^\d+\.\d+\.\d+$")]
    build_number: int = Field(ge=1)
    apk_url: Annotated[str, StringConstraints(pattern=r"^https://")]
    release_notes: OptionalText = None
    min_android: OptionalText = Field(default=None, max_length=10)
    is_current: bool = True


class AppReleaseOut(ORMModel, AppReleaseIn):
    id: int
    released_at: datetime


# ---------------------------------------------------------------- settings

class ClubSettingsIn(BaseModel):
    enrollment_fee: int = Field(ge=0)
    monthly_fee: int = Field(ge=0)
    due_day: int = Field(ge=1, le=28)
    sibling_discount_percent: int = Field(ge=0, le=100)
    nequi_number: Phone | None = None
    nequi_holder: OptionalText = Field(default=None, max_length=120)
    whatsapp: Annotated[str, StringConstraints(pattern=r"^57\d{10}$")]
    payment_instructions: OptionalText = None
    uniform_store: OptionalText = Field(default=None, max_length=200)
    data_policy_version: Annotated[str, StringConstraints(min_length=1, max_length=20)]
    data_policy_text: Annotated[str, StringConstraints(min_length=20)]


class ClubSettingsOut(ORMModel, ClubSettingsIn):
    pass


class PublicClubOut(BaseModel):
    enrollment_fee: int
    monthly_fee: int
    due_day: int
    sibling_discount_percent: int
    payment_methods: list[str]
    nequi_number: str | None
    nequi_holder: str | None
    payment_contact_message: str | None = Field(description="Se muestra cuando no hay Nequi configurado")
    whatsapp: str
    whatsapp_url: str
    payment_instructions: str | None
    uniform_store: str | None
    data_policy_version: str
    data_policy_text: str


# ---------------------------------------------------------------- admin stats

class CategoryCountOut(BaseModel):
    category_id: int | None
    category_name: str
    players: int


class StatsOut(BaseModel):
    players_approved: int
    players_pending: int
    guardians: int
    coaches_with_account: int
    payments_to_verify: int
    players_up_to_date: int
    players_overdue: int
    revenue_this_month: int
    attendance_rate_30_days: float
    by_category: list[CategoryCountOut]


# ---------------------------------------------------------------- dropout risk (Fase 8)

class RiskFactorOut(BaseModel):
    feature: str
    label: str
    detail: str
    impact: float = Field(description="Cuánto baja el riesgo (log-odds) si este factor tuviera un valor típico")


class RiskPlayerOut(BaseModel):
    player_id: int
    player_name: str
    category_id: int | None
    category_name: str | None
    guardian_name: str
    guardian_phone: str
    whatsapp_url: str
    probability: float = Field(ge=0, le=1)
    level: str = Field(description="low | medium | high")
    factors: list[RiskFactorOut]
    features: dict[str, float]


class RiskCountsOut(BaseModel):
    high: int
    medium: int
    low: int


class RiskModelOut(BaseModel):
    name: str
    version: str
    synthetic: bool
    trained_at: str
    training_size: int
    metrics: dict[str, float]
    compared: dict[str, dict[str, float]]
    note: str


class RiskReportOut(BaseModel):
    model: RiskModelOut
    counts: RiskCountsOut
    players: list[RiskPlayerOut]
