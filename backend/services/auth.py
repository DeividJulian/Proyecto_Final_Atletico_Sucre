"""Use cases of the account: parent sign-up, login and password management."""
import hashlib
import hmac
import logging
import secrets
from datetime import date, datetime, timedelta, timezone

from sqlalchemy.orm import Session

import config
from enums import CodePurpose, ConsentType, EnrollmentStatus, Role
from models import DataConsent, Guardian, OneTimeCode, Player, User
from repositories import (
    CategoryRepository,
    CodeRepository,
    ConsentRepository,
    GuardianRepository,
    PlayerRepository,
    SettingsRepository,
    UserRepository,
)
from schemas import ChangePasswordIn, PlayerIn, RegisterIn
from security import hash_password, verify_password
from services.category_strategy import CategoryStrategy
from services.errors import BadRequest, Conflict, Unauthorized
from services.mailer import Email, Mailer

logger = logging.getLogger("atletico.auth")

INVALID_LOGIN = "Correo o contraseña incorrectos."
GENERIC_RESET_ANSWER = "Si el correo está registrado, te enviamos un código para restablecer la contraseña."


def _now() -> datetime:
    return datetime.now(timezone.utc)


def _aware(moment: datetime) -> datetime:
    """SQLite returns naive datetimes; PostgreSQL returns aware ones. Compare both as UTC."""
    return moment if moment.tzinfo else moment.replace(tzinfo=timezone.utc)


class PlayerFactory:
    """Builds a Player from the registration data: category by Strategy, fee from the club settings."""

    def __init__(self, session: Session, strategy: CategoryStrategy):
        self.players = PlayerRepository(session)
        self.categories = CategoryRepository(session)
        self.settings = SettingsRepository(session)
        self.strategy = strategy

    def build(self, data: PlayerIn, guardian: Guardian, siblings_before: int) -> Player:
        if self.players.get_by_document(data.document_number):
            raise Conflict(f"Ya hay un deportista registrado con el documento {data.document_number}.")
        category = self.strategy.assign(data.birth_date, data.sex, self.categories.list_active())
        if category is None:
            raise BadRequest(
                f"No hay una categoría para deportistas nacidos en {data.birth_date.year}. "
                "Escríbenos por WhatsApp para revisar el caso."
            )
        settings = self.settings.get_or_create()
        fee = settings.monthly_fee
        if siblings_before > 0 and settings.sibling_discount_percent:
            fee = round(fee * (100 - settings.sibling_discount_percent) / 100)
        return Player(
            guardian=guardian,
            category=category,
            monthly_fee=fee,
            enrollment_status=EnrollmentStatus.PENDING,
            enrolled_at=date.today(),
            **data.model_dump(),
        )


class AuthService:
    def __init__(self, session: Session, strategy: CategoryStrategy, mailer: Mailer):
        self.session = session
        self.users = UserRepository(session)
        self.guardians = GuardianRepository(session)
        self.consents = ConsentRepository(session)
        self.codes = CodeRepository(session)
        self.settings = SettingsRepository(session)
        self.player_factory = PlayerFactory(session, strategy)
        self.mailer = mailer

    # ---------- sign-up (one transaction: account + guardian + children + consents)

    def register_parent(self, data: RegisterIn, ip_address: str | None, user_agent: str | None) -> tuple[User, Guardian, list[Player]]:
        if self.users.get_by_email(data.email):
            raise Conflict("Ya existe una cuenta con ese correo. Inicia sesión o recupera tu contraseña.")
        if self.guardians.get_by_document(data.guardian.document_number):
            raise Conflict("Ya hay un acudiente registrado con ese número de documento.")

        try:
            user = self.users.add(User(email=data.email, password_hash=hash_password(data.password), role=Role.PARENT))
            guardian = self.guardians.add(Guardian(user=user, **data.guardian.model_dump()))
            players = []
            for index, player_data in enumerate(data.players):
                player = self.player_factory.build(player_data, guardian, siblings_before=index)
                self.session.add(player)
                players.append(player)

            version = self.settings.get_or_create().data_policy_version
            for consent_type, accepted in (
                (ConsentType.DATA_PROCESSING, data.accept_data_policy),
                (ConsentType.IMAGE_USE, data.accept_image_use),
            ):
                self.consents.add(
                    DataConsent(
                        guardian=guardian,
                        consent_type=consent_type,
                        policy_version=version,
                        accepted=accepted,
                        ip_address=(ip_address or "")[:64] or None,
                        user_agent=(user_agent or "")[:300] or None,
                    )
                )
            self.session.commit()
        except Exception:
            self.session.rollback()
            raise
        logger.info("New parent %s registered %d player(s)", user.email, len(players))
        return user, guardian, players

    # ---------- login

    def login(self, email: str, password: str) -> User:
        user = self.users.get_by_email(email)
        if user is None or not verify_password(password, user.password_hash):
            raise Unauthorized(INVALID_LOGIN)
        if not user.is_active:
            raise Unauthorized("Tu cuenta está desactivada. Comunícate con el club.")
        user.last_login_at = _now()
        self.session.commit()
        return user

    def change_password(self, user: User, data: ChangePasswordIn) -> None:
        if not verify_password(data.current_password, user.password_hash):
            raise BadRequest("La contraseña actual no es correcta.")
        user.password_hash = hash_password(data.new_password)
        user.must_change_password = False
        self.session.commit()

    # ---------- password recovery with a 6-digit code sent by email

    def request_password_reset(self, email: str) -> None:
        user = self.users.get_by_email(email)
        # Same answer whether the email exists or not (does not reveal who is registered)
        if user is None or not user.is_active:
            return
        now = _now()
        self.codes.invalidate_all(user.id, CodePurpose.PASSWORD_RESET, now)
        code = f"{secrets.randbelow(1_000_000):06d}"
        self.codes.add(
            OneTimeCode(
                user_id=user.id,
                code_hash=self._hash_code(code),
                purpose=CodePurpose.PASSWORD_RESET,
                expires_at=now + timedelta(minutes=config.CODE_MINUTES),
            )
        )
        self.session.commit()
        self.mailer.send(
            Email(
                to=user.email,
                subject="Código para restablecer tu contraseña — Club Atlético Sucre",
                text=(
                    f"Tu código es {code}. Vence en {config.CODE_MINUTES} minutos.\n\n"
                    "Si no pediste cambiar la contraseña, ignora este correo."
                ),
            )
        )

    def reset_password(self, email: str, code: str, new_password: str) -> None:
        invalid = BadRequest("El código no es válido o ya venció. Pide uno nuevo.")
        user = self.users.get_by_email(email)
        if user is None:
            raise invalid
        now = _now()
        stored = self.codes.latest_active(user.id, CodePurpose.PASSWORD_RESET, now)
        if stored is None or _aware(stored.expires_at) <= now or stored.attempts >= config.CODE_ATTEMPTS:
            raise invalid
        if not hmac.compare_digest(stored.code_hash, self._hash_code(code)):
            stored.attempts += 1
            self.session.commit()
            raise invalid
        stored.used_at = now
        user.password_hash = hash_password(new_password)
        user.must_change_password = False
        self.session.commit()

    @staticmethod
    def _hash_code(code: str) -> str:
        return hmac.new(config.SECRET_KEY.encode(), code.encode(), hashlib.sha256).hexdigest()
