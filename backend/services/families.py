"""Use cases of a parent over their own data (every player goes through AccessPolicy first)."""
from datetime import date, datetime, timezone

from fastapi import UploadFile
from fastapi.responses import Response
from sqlalchemy.orm import Session

from enums import EnrollmentStatus
from models import Guardian, Player, User
from policies import AccessPolicy
from repositories import AnnouncementRepository, AttendanceRepository, CategoryRepository, NoteRepository, PlayerRepository
from schemas import GuardianUpdate, PlayerIn, PlayerUpdate
from services.auth import PlayerFactory
from services.category_strategy import CategoryStrategy
from services.errors import BadRequest, Conflict, NotFound
from services.storage import FileStorage, new_key, read_image


class FamilyService:
    def __init__(self, session: Session, strategy: CategoryStrategy, storage: FileStorage):
        self.session = session
        self.policy = AccessPolicy(session)
        self.players = PlayerRepository(session)
        self.categories = CategoryRepository(session)
        self.attendance = AttendanceRepository(session)
        self.notes = NoteRepository(session)
        self.announcements = AnnouncementRepository(session)
        self.player_factory = PlayerFactory(session, strategy)
        self.strategy = strategy
        self.storage = storage

    # ---------- guardian profile

    def guardian(self, user: User) -> Guardian:
        return self.policy.guardian_of(user)

    def update_guardian(self, user: User, data: GuardianUpdate) -> Guardian:
        guardian = self.policy.guardian_of(user)
        for field, value in data.model_dump(exclude_unset=True).items():
            if value is None and field not in {"alt_phone", "neighborhood"}:
                continue
            setattr(guardian, field, value)
        self.session.commit()
        return guardian

    # ---------- players

    def players_of(self, user: User) -> list[Player]:
        return list(self.players.list_by_guardian(self.policy.guardian_of(user).id))

    def player(self, user: User, player_id: int) -> Player:
        return self.policy.player_for_guardian(user, player_id)

    def add_player(self, user: User, data: PlayerIn) -> Player:
        guardian = self.policy.guardian_of(user)
        siblings = len(self.players.list_by_guardian(guardian.id))
        player = self.player_factory.build(data, guardian, siblings_before=siblings)
        self.session.add(player)
        self.session.commit()
        return player

    def update_player(self, user: User, player_id: int, data: PlayerUpdate) -> Player:
        player = self.policy.player_for_guardian(user, player_id)
        if player.enrollment_status == EnrollmentStatus.INACTIVE:
            raise Conflict("Este deportista está inactivo; comunícate con el club para reactivarlo.")
        changes = {k: v for k, v in data.model_dump(exclude_unset=True).items() if v is not None or k in {"allergies", "medical_notes", "blood_type"}}
        for field, value in changes.items():
            setattr(player, field, value)
        # A new birth date or sex may change the category, but only while the enrollment is pending
        if ("birth_date" in changes or "sex" in changes) and player.enrollment_status == EnrollmentStatus.PENDING:
            category = self.strategy.assign(player.birth_date, player.sex, self.categories.list_active())
            if category is None:
                raise BadRequest(f"No hay una categoría para deportistas nacidos en {player.birth_date.year}.")
            player.category = category
        self.session.commit()
        return player

    # ---------- photo

    async def set_photo(self, user: User, player_id: int, upload: UploadFile) -> Player:
        player = self.policy.player_for_guardian(user, player_id)
        data, content_type = await read_image(upload)
        old_key = player.photo_key
        key = new_key(f"players/{player.id}", content_type)
        self.storage.save(key, data, content_type)
        player.photo_key = key
        self.session.commit()
        if old_key:
            self.storage.delete(old_key)
        return player

    def photo_response(self, user: User, player_id: int) -> Response:
        player = self.policy.player_for_any(user, player_id)
        if not player.photo_key:
            raise NotFound("Este deportista todavía no tiene foto.")
        return self.storage.response(player.photo_key)

    # ---------- attendance, notes, announcements

    def attendance_of(self, user: User, player_id: int, date_from: date | None, date_to: date | None):
        player = self.policy.player_for_any(user, player_id)
        return self.attendance.for_player(player.id, date_from, date_to)

    def notes_of(self, user: User, player_id: int):
        player = self.policy.player_for_guardian(user, player_id)
        return self.notes.for_player(player.id, only_visible=True)

    def announcements_for(self, user: User):
        category_ids = {
            p.category_id
            for p in self.players_of(user)
            if p.category_id is not None and p.enrollment_status == EnrollmentStatus.APPROVED
        }
        return self.announcements.visible_for(sorted(category_ids), datetime.now(timezone.utc))
