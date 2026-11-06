"""Use cases of a coach (and of an admin, who is a coach with every category)."""
from datetime import date, datetime, timezone

from sqlalchemy.orm import Session

from enums import EnrollmentStatus
from models import Announcement, Attendance, PerformanceNote, TrainingSession, User
from policies import AccessPolicy
from repositories import (
    AnnouncementRepository,
    AttendanceRepository,
    NoteRepository,
    PlayerRepository,
    TrainingSessionRepository,
)
from schemas import AnnouncementIn, AttendanceRowOut, AttendanceSheetIn, AttendanceSheetOut, NoteIn, PlayerSportsUpdate
from services.errors import BadRequest, Forbidden, NotFound


class CoachingService:
    def __init__(self, session: Session):
        self.session = session
        self.policy = AccessPolicy(session)
        self.players = PlayerRepository(session)
        self.sessions = TrainingSessionRepository(session)
        self.attendance = AttendanceRepository(session)
        self.notes = NoteRepository(session)
        self.announcements = AnnouncementRepository(session)

    # ---------- categories and players

    def categories(self, user: User):
        ids = set(self.policy.coach_category_ids(user))
        return [c for c in self.policy.categories.list() if c.id in ids]

    def players_of_category(self, user: User, category_id: int):
        self.policy.category_for_coach(user, category_id)
        return self.players.list_by_categories([category_id], status=EnrollmentStatus.APPROVED)

    def player(self, user: User, player_id: int):
        return self.policy.player_for_coach(user, player_id)

    def update_sports(self, user: User, player_id: int, data: PlayerSportsUpdate):
        player = self.policy.player_for_coach(user, player_id)
        for field, value in data.model_dump(exclude_unset=True).items():
            setattr(player, field, value)
        self.session.commit()
        return player

    # ---------- attendance

    def sessions_on(self, user: User, day: date):
        return self.sessions.list_by_categories(self.policy.coach_category_ids(user), weekday=day.isoweekday())

    def _session(self, user: User, session_id: int) -> TrainingSession:
        training = self.sessions.get(session_id)
        if training is None or training.category_id not in self.policy.coach_category_ids(user):
            raise NotFound("No encontramos ese entrenamiento entre los tuyos.")
        return training

    def sheet(self, user: User, session_id: int, day: date) -> AttendanceSheetOut:
        training = self._session(user, session_id)
        recorded = {a.player_id: a.status for a in self.attendance.for_session(training.id, day)}
        players = self.players.list_by_categories([training.category_id], status=EnrollmentStatus.APPROVED)
        return AttendanceSheetOut(
            session_id=training.id,
            session_date=day,
            category_name=training.category.name,
            rows=[
                AttendanceRowOut(
                    player_id=p.id, player_name=p.full_name, jersey_number=p.jersey_number, status=recorded.get(p.id)
                )
                for p in players
            ],
        )

    def save_sheet(self, user: User, session_id: int, data: AttendanceSheetIn) -> AttendanceSheetOut:
        training = self._session(user, session_id)
        if data.session_date > date.today():
            raise BadRequest("No se puede tomar asistencia de una fecha futura.")
        if data.session_date.isoweekday() != training.weekday:
            raise BadRequest("La fecha no corresponde al día de la semana de este entrenamiento.")
        allowed = {
            p.id for p in self.players.list_by_categories([training.category_id], status=EnrollmentStatus.APPROVED)
        }
        unknown = [r.player_id for r in data.records if r.player_id not in allowed]
        if unknown:
            raise BadRequest("Hay deportistas que no pertenecen a esta categoría.")

        existing = {a.player_id: a for a in self.attendance.for_session(training.id, data.session_date)}
        for record in data.records:
            row = existing.get(record.player_id)
            if row is None:
                self.session.add(
                    Attendance(
                        player_id=record.player_id,
                        training_session_id=training.id,
                        session_date=data.session_date,
                        status=record.status,
                        recorded_by_id=user.id,
                    )
                )
            else:
                row.status = record.status
                row.recorded_by_id = user.id
                row.recorded_at = datetime.now(timezone.utc)
        self.session.commit()
        return self.sheet(user, session_id, data.session_date)

    # ---------- performance notes

    def notes_of(self, user: User, player_id: int):
        player = self.policy.player_for_coach(user, player_id)
        return self.notes.for_player(player.id, only_visible=False)

    def add_note(self, user: User, player_id: int, data: NoteIn) -> PerformanceNote:
        player = self.policy.player_for_coach(user, player_id)
        note = self.notes.add(PerformanceNote(player_id=player.id, author_id=user.id, **data.model_dump()))
        self.session.commit()
        return note

    # ---------- announcements

    def _check_target(self, user: User, category_id: int | None) -> None:
        if category_id is None:
            if not user.is_admin:
                raise Forbidden("Solo un administrador puede publicar avisos generales.")
            return
        self.policy.category_for_coach(user, category_id)

    def my_announcements(self, user: User):
        if user.is_admin:
            return self.announcements.list()
        return self.announcements.by_author_or_categories(user.id, self.policy.coach_category_ids(user))

    def create_announcement(self, user: User, data: AnnouncementIn) -> Announcement:
        self._check_target(user, data.category_id)
        item = self.announcements.add(Announcement(author_id=user.id, **data.model_dump()))
        self.session.commit()
        return item

    def _own_announcement(self, user: User, announcement_id: int) -> Announcement:
        item = self.announcements.get(announcement_id)
        if item is None or (not user.is_admin and item.author_id != user.id):
            raise NotFound("No encontramos ese aviso entre los tuyos.")
        return item

    def update_announcement(self, user: User, announcement_id: int, data: AnnouncementIn) -> Announcement:
        item = self._own_announcement(user, announcement_id)
        self._check_target(user, data.category_id)
        for field, value in data.model_dump().items():
            setattr(item, field, value)
        self.session.commit()
        return item

    def delete_announcement(self, user: User, announcement_id: int) -> None:
        self.announcements.delete(self._own_announcement(user, announcement_id))
        self.session.commit()
