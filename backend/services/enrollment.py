"""Admin approves or rejects new enrollments; also edits players by hand."""
import logging
from datetime import datetime, timezone

from sqlalchemy.orm import Session

from enums import EnrollmentStatus
from models import Player, User
from repositories import CategoryRepository, PlayerRepository
from schemas import ApproveIn, PlayerAdminUpdate, RejectIn
from services.errors import BadRequest, Conflict, NotFound
from services.mailer import Email, Mailer

logger = logging.getLogger("atletico.enrollment")


class EnrollmentService:
    def __init__(self, session: Session, mailer: Mailer):
        self.session = session
        self.players = PlayerRepository(session)
        self.categories = CategoryRepository(session)
        self.mailer = mailer

    def _player(self, player_id: int) -> Player:
        player = self.players.get(player_id)
        if player is None:
            raise NotFound("No encontramos ese deportista.")
        return player

    def _category(self, category_id: int):
        category = self.categories.get(category_id)
        if category is None:
            raise BadRequest("La categoría indicada no existe.")
        return category

    def pending(self, status: str = EnrollmentStatus.PENDING):
        return self.players.search(status=status)

    def approve(self, admin: User, player_id: int, data: ApproveIn) -> Player:
        player = self._player(player_id)
        if player.enrollment_status == EnrollmentStatus.APPROVED:
            raise Conflict("Esta inscripción ya estaba aprobada.")
        if data.category_id is not None:
            player.category = self._category(data.category_id)
        if player.category is None:
            raise BadRequest("Asigna una categoría antes de aprobar la inscripción.")
        if data.monthly_fee is not None:
            player.monthly_fee = data.monthly_fee
        player.enrollment_status = EnrollmentStatus.APPROVED
        player.rejection_reason = None
        player.approved_by_id = admin.id
        player.approved_at = datetime.now(timezone.utc)
        self.session.commit()
        self._notify(
            player,
            "Inscripción aprobada — Club Atlético Sucre",
            f"¡Bienvenido a la familia Atlético Sucre!\n\nLa inscripción de {player.full_name} fue aprobada "
            f"en la categoría {player.category.name}. Ingresa a la plataforma para ver su horario y sede.",
        )
        return player

    def reject(self, player_id: int, data: RejectIn) -> Player:
        player = self._player(player_id)
        if player.enrollment_status != EnrollmentStatus.PENDING:
            raise Conflict("Solo se pueden rechazar inscripciones pendientes.")
        player.enrollment_status = EnrollmentStatus.REJECTED
        player.rejection_reason = data.reason
        self.session.commit()
        self._notify(
            player,
            "Inscripción no aprobada — Club Atlético Sucre",
            f"La inscripción de {player.full_name} no fue aprobada: {data.reason}\n\n"
            "Escríbenos por WhatsApp si tienes preguntas.",
        )
        return player

    def update(self, player_id: int, data: PlayerAdminUpdate) -> Player:
        player = self._player(player_id)
        changes = data.model_dump(exclude_unset=True)
        if "category_id" in changes and changes["category_id"] is not None:
            self._category(changes["category_id"])
        if "document_number" in changes:
            changes.pop("document_number")
        for field, value in changes.items():
            setattr(player, field, value)
        if player.enrollment_status == EnrollmentStatus.APPROVED and player.approved_at is None:
            player.approved_at = datetime.now(timezone.utc)
        self.session.commit()
        return player

    def _notify(self, player: Player, subject: str, text: str) -> None:
        # The decision is already saved; a failing email must not undo it
        try:
            self.mailer.send(Email(to=player.guardian.user.email, subject=subject, text=text))
        except Exception as error:  # noqa: BLE001
            logger.warning("Could not email %s: %s", player.guardian.user.email, error)
