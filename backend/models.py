"""ORM entities (SQLAlchemy 2). Table and column names in English; values from enums.py."""
from datetime import date, datetime, time, timezone

from sqlalchemy import (
    JSON,
    Boolean,
    CheckConstraint,
    Date,
    DateTime,
    ForeignKey,
    Index,
    Integer,
    SmallInteger,
    String,
    Text,
    Time,
    UniqueConstraint,
    text,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from database import Base
from enums import (
    AttendanceStatus,
    CategoryGender,
    EnrollmentStatus,
    PaymentStatus,
    Role,
    TrainingShift,
)


# Foreign-key targets and delete rules used by several tables
USERS_ID = "users.id"
CATEGORIES_ID = "categories.id"
PLAYERS_ID = "players.id"
SET_NULL = "SET NULL"
CASCADE = "CASCADE"


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


DEFAULT_DATA_POLICY = (
    "En cumplimiento de la Ley 1581 de 2012 y el Decreto 1377 de 2013, autorizo al Club Atlético Sucre "
    "(Ipiales, Nariño) para recolectar, almacenar y usar mis datos personales y los de mi(s) hijo(s) o "
    "representado(s) menor(es) de edad, incluidos los datos de salud, con la única finalidad de gestionar "
    "la inscripción, los entrenamientos, la asistencia, los pagos, la atención de emergencias y la "
    "comunicación con la familia. Los datos de los menores se tratan respetando su interés superior y sus "
    "derechos fundamentales, y no se comparten con terceros ajenos al club. Como titular puedo conocer, "
    "actualizar, rectificar y solicitar la supresión de mis datos escribiendo al WhatsApp del club."
)


class TimestampMixin:
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utcnow, onupdate=utcnow, nullable=False
    )


# ---------------------------------------------------------------- accounts

class User(Base):
    __tablename__ = "users"
    __table_args__ = (
        CheckConstraint("role IN ('parent', 'coach')", name="ck_users_role"),
        # The administrator is a coach with extra permissions, never a parent
        CheckConstraint("NOT is_admin OR role = 'coach'", name="ck_users_admin_is_coach"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[str] = mapped_column(String(20), nullable=False)
    is_admin: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    must_change_password: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, nullable=False)
    last_login_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    guardian: Mapped["Guardian | None"] = relationship(back_populates="user", uselist=False)
    coach: Mapped["Coach | None"] = relationship(back_populates="user", uselist=False)

    @property
    def is_parent(self) -> bool:
        return self.role == Role.PARENT

    @property
    def is_coach(self) -> bool:
        return self.role == Role.COACH


class OneTimeCode(Base):
    __tablename__ = "one_time_codes"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey(USERS_ID, ondelete=CASCADE), index=True, nullable=False)
    code_hash: Mapped[str] = mapped_column(String(128), nullable=False)
    purpose: Mapped[str] = mapped_column(String(30), nullable=False)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    attempts: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    used_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, nullable=False)


# ---------------------------------------------------------------- families

class Guardian(TimestampMixin, Base):
    """Parent or legal guardian (acudiente). One per parent account."""
    __tablename__ = "guardians"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey(USERS_ID, ondelete=CASCADE), unique=True, nullable=False)
    first_names: Mapped[str] = mapped_column(String(80), nullable=False)
    last_names: Mapped[str] = mapped_column(String(80), nullable=False)
    document_type: Mapped[str] = mapped_column(String(10), nullable=False)
    document_number: Mapped[str] = mapped_column(String(20), unique=True, nullable=False)
    phone: Mapped[str] = mapped_column(String(20), nullable=False)  # WhatsApp
    alt_phone: Mapped[str | None] = mapped_column(String(20))
    address: Mapped[str] = mapped_column(String(160), nullable=False)
    neighborhood: Mapped[str | None] = mapped_column(String(80))
    city: Mapped[str] = mapped_column(String(80), default="Ipiales", nullable=False)
    relationship_to_player: Mapped[str] = mapped_column(String(20), nullable=False)

    user: Mapped[User] = relationship(back_populates="guardian")
    players: Mapped[list["Player"]] = relationship(back_populates="guardian", order_by="Player.birth_date")
    consents: Mapped[list["DataConsent"]] = relationship(back_populates="guardian")

    @property
    def full_name(self) -> str:
        return f"{self.first_names} {self.last_names}"


class DataConsent(Base):
    """Proof of each authorization (Ley 1581 de 2012): what text version was accepted, when and from where."""
    __tablename__ = "data_consents"

    id: Mapped[int] = mapped_column(primary_key=True)
    guardian_id: Mapped[int] = mapped_column(ForeignKey("guardians.id", ondelete=CASCADE), index=True, nullable=False)
    consent_type: Mapped[str] = mapped_column(String(30), nullable=False)
    policy_version: Mapped[str] = mapped_column(String(20), nullable=False)
    accepted: Mapped[bool] = mapped_column(Boolean, nullable=False)
    accepted_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, nullable=False)
    ip_address: Mapped[str | None] = mapped_column(String(64))
    user_agent: Mapped[str | None] = mapped_column(String(300))

    guardian: Mapped[Guardian] = relationship(back_populates="consents")


class Player(TimestampMixin, Base):
    """Deportista (minor). Health fields are only visible to the guardian, the category coach and admins."""
    __tablename__ = "players"
    __table_args__ = (
        CheckConstraint("jersey_number IS NULL OR (jersey_number BETWEEN 1 AND 99)", name="ck_players_jersey"),
        CheckConstraint("monthly_fee >= 0", name="ck_players_fee"),
        Index("ix_players_category_status", "category_id", "enrollment_status"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    guardian_id: Mapped[int] = mapped_column(ForeignKey("guardians.id", ondelete=CASCADE), index=True, nullable=False)
    first_names: Mapped[str] = mapped_column(String(80), nullable=False)
    last_names: Mapped[str] = mapped_column(String(80), nullable=False)
    document_type: Mapped[str] = mapped_column(String(10), nullable=False)
    document_number: Mapped[str] = mapped_column(String(20), unique=True, nullable=False)
    birth_date: Mapped[date] = mapped_column(Date, nullable=False)
    sex: Mapped[str] = mapped_column(String(1), nullable=False)
    category_id: Mapped[int | None] = mapped_column(ForeignKey(CATEGORIES_ID, ondelete=SET_NULL))
    photo_key: Mapped[str | None] = mapped_column(String(300))
    # Sports data: filled in by the coach, not by the parent
    jersey_number: Mapped[int | None] = mapped_column(SmallInteger)
    position: Mapped[str | None] = mapped_column(String(20))
    # School
    school_name: Mapped[str] = mapped_column(String(120), nullable=False)
    school_shift: Mapped[str] = mapped_column(String(20), nullable=False)
    # Health and emergency
    eps: Mapped[str] = mapped_column(String(80), nullable=False)
    blood_type: Mapped[str | None] = mapped_column(String(3))
    allergies: Mapped[str | None] = mapped_column(Text)
    medical_notes: Mapped[str | None] = mapped_column(Text)
    emergency_contact_name: Mapped[str] = mapped_column(String(120), nullable=False)
    emergency_contact_phone: Mapped[str] = mapped_column(String(20), nullable=False)
    # Enrollment
    enrollment_status: Mapped[str] = mapped_column(String(20), default=EnrollmentStatus.PENDING, nullable=False)
    rejection_reason: Mapped[str | None] = mapped_column(String(300))
    approved_by_id: Mapped[int | None] = mapped_column(ForeignKey(USERS_ID, ondelete=SET_NULL))
    approved_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    monthly_fee: Mapped[int] = mapped_column(Integer, nullable=False)  # COP, copied from club_settings
    enrolled_at: Mapped[date] = mapped_column(Date, nullable=False)

    guardian: Mapped[Guardian] = relationship(back_populates="players")
    category: Mapped["Category | None"] = relationship(back_populates="players")
    payments: Mapped[list["Payment"]] = relationship(back_populates="player", cascade="all, delete-orphan")

    @property
    def full_name(self) -> str:
        return f"{self.first_names} {self.last_names}"


# ---------------------------------------------------------------- club structure

class Coach(Base):
    """Public profile of a coach. user_id is null for coaches shown on the site who have no account yet."""
    __tablename__ = "coaches"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int | None] = mapped_column(ForeignKey(USERS_ID, ondelete=SET_NULL), unique=True)
    full_name: Mapped[str] = mapped_column(String(120), nullable=False)
    role_title: Mapped[str] = mapped_column(String(80), default="Entrenador", nullable=False)
    credentials: Mapped[list[str]] = mapped_column(JSON, default=list, nullable=False)
    photo_url: Mapped[str | None] = mapped_column(String(300))
    photo_position: Mapped[str] = mapped_column(String(30), default="top", nullable=False)
    display_order: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    is_public: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    user: Mapped[User | None] = relationship(back_populates="coach")
    categories: Mapped[list["Category"]] = relationship(back_populates="coach")


class Venue(Base):
    __tablename__ = "venues"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    description: Mapped[str | None] = mapped_column(String(300))
    surface: Mapped[str | None] = mapped_column(String(60))
    is_main: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    address: Mapped[str | None] = mapped_column(String(160))
    maps_url: Mapped[str | None] = mapped_column(String(500))
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)


class Category(Base):
    """Group of players by birth-year range (editable by the admin)."""
    __tablename__ = "categories"
    __table_args__ = (
        CheckConstraint("birth_year_from <= birth_year_to", name="ck_categories_years"),
        CheckConstraint("gender IN ('mixed', 'female')", name="ck_categories_gender"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(60), unique=True, nullable=False)
    birth_year_from: Mapped[int] = mapped_column(Integer, nullable=False)
    birth_year_to: Mapped[int] = mapped_column(Integer, nullable=False)
    gender: Mapped[str] = mapped_column(String(10), default=CategoryGender.MIXED, nullable=False)
    coach_id: Mapped[int | None] = mapped_column(ForeignKey("coaches.id", ondelete=SET_NULL))
    description: Mapped[str | None] = mapped_column(String(300))
    display_order: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    coach: Mapped[Coach | None] = relationship(back_populates="categories")
    players: Mapped[list[Player]] = relationship(back_populates="category")
    sessions: Mapped[list["TrainingSession"]] = relationship(back_populates="category")


class TrainingSession(Base):
    """A weekly slot: category, venue, weekday (1 = Monday) and time range."""
    __tablename__ = "training_sessions"
    __table_args__ = (
        CheckConstraint("weekday BETWEEN 1 AND 7", name="ck_sessions_weekday"),
        CheckConstraint("start_time < end_time", name="ck_sessions_times"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    category_id: Mapped[int] = mapped_column(ForeignKey(CATEGORIES_ID, ondelete=CASCADE), index=True, nullable=False)
    venue_id: Mapped[int] = mapped_column(ForeignKey("venues.id", ondelete="RESTRICT"), nullable=False)
    weekday: Mapped[int] = mapped_column(SmallInteger, nullable=False)
    start_time: Mapped[time] = mapped_column(Time, nullable=False)
    end_time: Mapped[time] = mapped_column(Time, nullable=False)
    shift: Mapped[str] = mapped_column(String(20), default=TrainingShift.ALL, nullable=False)

    category: Mapped[Category] = relationship(back_populates="sessions")
    venue: Mapped[Venue] = relationship()


class Attendance(Base):
    __tablename__ = "attendance"
    __table_args__ = (UniqueConstraint("player_id", "training_session_id", "session_date", name="uq_attendance"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    player_id: Mapped[int] = mapped_column(ForeignKey(PLAYERS_ID, ondelete=CASCADE), index=True, nullable=False)
    training_session_id: Mapped[int] = mapped_column(
        ForeignKey("training_sessions.id", ondelete=CASCADE), nullable=False
    )
    session_date: Mapped[date] = mapped_column(Date, nullable=False)
    status: Mapped[str] = mapped_column(String(20), default=AttendanceStatus.PRESENT, nullable=False)
    recorded_by_id: Mapped[int | None] = mapped_column(ForeignKey(USERS_ID, ondelete=SET_NULL))
    recorded_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, nullable=False)

    session: Mapped[TrainingSession] = relationship()


class Payment(Base):
    """A payment reported by a parent (with receipt) or registered by an admin (cash).

    Whether a player is up to date is computed from these rows (services/payment_status.py), never stored.
    """
    __tablename__ = "payments"
    __table_args__ = (
        CheckConstraint("amount > 0", name="ck_payments_amount"),
        CheckConstraint("period_month IS NULL OR (period_month BETWEEN 1 AND 12)", name="ck_payments_month"),
        Index("ix_payments_period", "player_id", "concept", "period_year", "period_month"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    player_id: Mapped[int] = mapped_column(ForeignKey(PLAYERS_ID, ondelete=CASCADE), nullable=False)
    concept: Mapped[str] = mapped_column(String(20), nullable=False)
    period_year: Mapped[int | None] = mapped_column(Integer)
    period_month: Mapped[int | None] = mapped_column(SmallInteger)
    amount: Mapped[int] = mapped_column(Integer, nullable=False)  # COP
    method: Mapped[str] = mapped_column(String(20), nullable=False)
    paid_on: Mapped[date] = mapped_column(Date, nullable=False)
    reference_number: Mapped[str | None] = mapped_column(String(60))
    receipt_key: Mapped[str | None] = mapped_column(String(300))
    status: Mapped[str] = mapped_column(String(30), default=PaymentStatus.PENDING_VERIFICATION, nullable=False)
    registered_by_id: Mapped[int | None] = mapped_column(ForeignKey(USERS_ID, ondelete=SET_NULL))
    verified_by_id: Mapped[int | None] = mapped_column(ForeignKey(USERS_ID, ondelete=SET_NULL))
    verified_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    rejection_reason: Mapped[str | None] = mapped_column(String(300))
    notes: Mapped[str | None] = mapped_column(String(500))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, nullable=False)

    player: Mapped[Player] = relationship(back_populates="payments")


class PerformanceNote(Base):
    __tablename__ = "performance_notes"

    id: Mapped[int] = mapped_column(primary_key=True)
    player_id: Mapped[int] = mapped_column(ForeignKey(PLAYERS_ID, ondelete=CASCADE), index=True, nullable=False)
    author_id: Mapped[int | None] = mapped_column(ForeignKey(USERS_ID, ondelete=SET_NULL))
    note_date: Mapped[date] = mapped_column(Date, nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    visible_to_guardian: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, nullable=False)


class Announcement(Base):
    """Aviso. category_id NULL means a general notice for the whole club (admins only)."""
    __tablename__ = "announcements"

    id: Mapped[int] = mapped_column(primary_key=True)
    author_id: Mapped[int | None] = mapped_column(ForeignKey(USERS_ID, ondelete=SET_NULL))
    category_id: Mapped[int | None] = mapped_column(ForeignKey(CATEGORIES_ID, ondelete=CASCADE), index=True)
    title: Mapped[str] = mapped_column(String(120), nullable=False)
    body: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, nullable=False)
    expires_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    category: Mapped[Category | None] = relationship()


# ---------------------------------------------------------------- public content

class News(TimestampMixin, Base):
    __tablename__ = "news"

    id: Mapped[int] = mapped_column(primary_key=True)
    title: Mapped[str] = mapped_column(String(160), nullable=False)
    slug: Mapped[str] = mapped_column(String(180), unique=True, index=True, nullable=False)
    summary: Mapped[str | None] = mapped_column(String(300))
    body: Mapped[str] = mapped_column(Text, nullable=False)
    cover_url: Mapped[str | None] = mapped_column(String(500))
    is_published: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    published_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    author_id: Mapped[int | None] = mapped_column(ForeignKey(USERS_ID, ondelete=SET_NULL))


class GalleryItem(Base):
    __tablename__ = "gallery_items"

    id: Mapped[int] = mapped_column(primary_key=True)
    title: Mapped[str] = mapped_column(String(120), nullable=False)
    caption: Mapped[str | None] = mapped_column(String(300))
    media_url: Mapped[str] = mapped_column(String(500), nullable=False)
    media_type: Mapped[str] = mapped_column(String(10), default="image", nullable=False)
    tag: Mapped[str | None] = mapped_column(String(40))
    display_order: Mapped[int] = mapped_column(Integer, default=0, nullable=False)


class AppRelease(Base):
    __tablename__ = "app_releases"
    __table_args__ = (
        # Only one release can be the current one
        Index(
            "uq_app_releases_current",
            "is_current",
            unique=True,
            postgresql_where=text("is_current"),
            sqlite_where=text("is_current"),
        ),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    version: Mapped[str] = mapped_column(String(20), unique=True, nullable=False)
    build_number: Mapped[int] = mapped_column(Integer, nullable=False)
    apk_url: Mapped[str] = mapped_column(String(500), nullable=False)
    release_notes: Mapped[str | None] = mapped_column(Text)
    min_android: Mapped[str | None] = mapped_column(String(10))
    is_current: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    released_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, nullable=False)
    created_by_id: Mapped[int | None] = mapped_column(ForeignKey(USERS_ID, ondelete=SET_NULL))


class ClubSettings(Base):
    """Single row (id = 1) with the values the admin edits: fees, payment data, contact, data policy."""
    __tablename__ = "club_settings"
    __table_args__ = (
        CheckConstraint("id = 1", name="ck_settings_single_row"),
        CheckConstraint("due_day BETWEEN 1 AND 28", name="ck_settings_due_day"),
        CheckConstraint("sibling_discount_percent BETWEEN 0 AND 100", name="ck_settings_discount"),
    )

    id: Mapped[int] = mapped_column(primary_key=True, default=1)
    enrollment_fee: Mapped[int] = mapped_column(Integer, default=20000, nullable=False)
    monthly_fee: Mapped[int] = mapped_column(Integer, default=65000, nullable=False)
    due_day: Mapped[int] = mapped_column(SmallInteger, default=5, nullable=False)
    sibling_discount_percent: Mapped[int] = mapped_column(SmallInteger, default=0, nullable=False)
    nequi_number: Mapped[str | None] = mapped_column(String(20))
    nequi_holder: Mapped[str | None] = mapped_column(String(120))
    whatsapp: Mapped[str] = mapped_column(String(20), default="573218543957", nullable=False)
    payment_instructions: Mapped[str | None] = mapped_column(Text)
    uniform_store: Mapped[str | None] = mapped_column(String(200))
    data_policy_version: Mapped[str] = mapped_column(String(20), default="1.0", nullable=False)
    data_policy_text: Mapped[str] = mapped_column(Text, default=DEFAULT_DATA_POLICY, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, onupdate=utcnow, nullable=False)
