"""Closed sets of values stored in the database (in English) and their Spanish labels for the interface."""
from enum import StrEnum


class Role(StrEnum):
    PARENT = "parent"
    COACH = "coach"


class GuardianDocumentType(StrEnum):
    CC = "CC"    # Cédula de ciudadanía
    CE = "CE"    # Cédula de extranjería
    PPT = "PPT"  # Permiso por protección temporal
    PA = "PA"    # Pasaporte


class PlayerDocumentType(StrEnum):
    RC = "RC"      # Registro civil
    TI = "TI"      # Tarjeta de identidad
    NUIP = "NUIP"
    PPT = "PPT"
    PA = "PA"


class Relationship(StrEnum):
    MOTHER = "mother"
    FATHER = "father"
    GRANDPARENT = "grandparent"
    UNCLE_AUNT = "uncle_aunt"
    SIBLING = "sibling"
    LEGAL_GUARDIAN = "legal_guardian"
    OTHER = "other"


class Sex(StrEnum):
    FEMALE = "F"
    MALE = "M"


class SchoolShift(StrEnum):
    MORNING = "morning"
    AFTERNOON = "afternoon"
    FULL_DAY = "full_day"


class TrainingShift(StrEnum):
    MORNING = "morning"      # for players who study in the afternoon
    AFTERNOON = "afternoon"  # for players who study in the morning
    ALL = "all"              # open to everybody (e.g. Saturday)


class BloodType(StrEnum):
    O_POS = "O+"
    O_NEG = "O-"
    A_POS = "A+"
    A_NEG = "A-"
    B_POS = "B+"
    B_NEG = "B-"
    AB_POS = "AB+"
    AB_NEG = "AB-"


class Position(StrEnum):
    GOALKEEPER = "goalkeeper"
    DEFENDER = "defender"
    MIDFIELDER = "midfielder"
    FORWARD = "forward"


class EnrollmentStatus(StrEnum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"
    INACTIVE = "inactive"


class CategoryGender(StrEnum):
    MIXED = "mixed"
    FEMALE = "female"


class AttendanceStatus(StrEnum):
    PRESENT = "present"
    ABSENT = "absent"
    EXCUSED = "excused"
    LATE = "late"


class PaymentConcept(StrEnum):
    ENROLLMENT = "enrollment"
    MONTHLY = "monthly"


class PaymentMethod(StrEnum):
    CASH = "cash"
    NEQUI = "nequi"


class PaymentStatus(StrEnum):
    PENDING_VERIFICATION = "pending_verification"
    VERIFIED = "verified"
    REJECTED = "rejected"


class MonthStatus(StrEnum):
    """Computed (never stored): the state of one month in a player's account."""
    PAID = "paid"
    IN_REVIEW = "in_review"
    DUE = "due"          # current month, before the due day
    OVERDUE = "overdue"
    NOT_ENROLLED = "not_enrolled"
    UPCOMING = "upcoming"


class ConsentType(StrEnum):
    DATA_PROCESSING = "data_processing"  # Ley 1581 de 2012 — required
    IMAGE_USE = "image_use"              # photos and videos of the player — optional


class MediaType(StrEnum):
    IMAGE = "image"
    VIDEO = "video"


class CodePurpose(StrEnum):
    PASSWORD_RESET = "password_reset"


def values(enum: type[StrEnum]) -> list[str]:
    return [member.value for member in enum]
