"""Coach panel (/coach). A coach only reaches the categories assigned to them; an admin reaches all."""
from datetime import date
from typing import Annotated

from fastapi import APIRouter, Depends, Query, status

from dependencies import get_coaching_service, get_family_service, get_payment_service
from models import User
from schemas import (
    AccountStatusOut,
    AnnouncementIn,
    AnnouncementOut,
    AttendanceSheetIn,
    AttendanceSheetOut,
    CategoryOut,
    NoteIn,
    NoteOut,
    PlayerDetailOut,
    PlayerOut,
    PlayerSportsUpdate,
    ScheduleItemOut,
)
from security import require_coach
from services.coaching import CoachingService
from services.families import FamilyService
from services.payments import PaymentService
from services.presenters import announcement_out, announcements_out, player_detail, player_out, schedule_item

router = APIRouter(prefix="/coach", tags=["profesor"])

Coach = Annotated[User, Depends(require_coach)]
Coaching = Annotated[CoachingService, Depends(get_coaching_service)]


@router.get("/categories", response_model=list[CategoryOut], summary="Mis categorías")
def my_categories(user: Coach, service: Coaching):
    return service.categories(user)


@router.get("/categories/{category_id}/players", response_model=list[PlayerOut], summary="Deportistas aprobados de una categoría")
def category_players(category_id: int, user: Coach, service: Coaching):
    return [player_out(p) for p in service.players_of_category(user, category_id)]


@router.get("/players/{player_id}", response_model=PlayerDetailOut, summary="Ficha del deportista (incluye salud y emergencia)")
def player(player_id: int, user: Coach, service: Coaching):
    return player_detail(service.player(user, player_id))


@router.put("/players/{player_id}/sports", response_model=PlayerOut, summary="Asignar dorsal y posición")
def update_sports(player_id: int, data: PlayerSportsUpdate, user: Coach, service: Coaching):
    return player_out(service.update_sports(user, player_id, data))


@router.get("/players/{player_id}/photo", summary="Foto del deportista")
def player_photo(player_id: int, user: Coach, families: Annotated[FamilyService, Depends(get_family_service)]):
    return families.photo_response(user, player_id)


@router.get("/players/{player_id}/payments", response_model=AccountStatusOut, summary="¿Está al día? (para saber si puede entrenar)")
def player_account(player_id: int, user: Coach, payments: Annotated[PaymentService, Depends(get_payment_service)]):
    return payments.account_for_user(user, player_id)


@router.get("/sessions", response_model=list[ScheduleItemOut], summary="Mis entrenamientos de un día")
def sessions(user: Coach, service: Coaching, day: date = Query(default_factory=date.today)):
    return [schedule_item(s) for s in service.sessions_on(user, day)]


@router.get("/sessions/{session_id}/attendance", response_model=AttendanceSheetOut, summary="Planilla de asistencia")
def attendance_sheet(session_id: int, user: Coach, service: Coaching, day: date = Query(default_factory=date.today)):
    return service.sheet(user, session_id, day)


@router.put("/sessions/{session_id}/attendance", response_model=AttendanceSheetOut, summary="Guardar la asistencia")
def save_attendance(session_id: int, data: AttendanceSheetIn, user: Coach, service: Coaching):
    return service.save_sheet(user, session_id, data)


@router.get("/players/{player_id}/notes", response_model=list[NoteOut], summary="Observaciones de rendimiento")
def notes(player_id: int, user: Coach, service: Coaching):
    return service.notes_of(user, player_id)


@router.post("/players/{player_id}/notes", response_model=NoteOut, status_code=status.HTTP_201_CREATED, summary="Registrar una observación")
def add_note(player_id: int, data: NoteIn, user: Coach, service: Coaching):
    return service.add_note(user, player_id, data)


@router.get("/announcements", response_model=list[AnnouncementOut], summary="Mis avisos")
def my_announcements(user: Coach, service: Coaching):
    return announcements_out(service.my_announcements(user))


@router.post("/announcements", response_model=AnnouncementOut, status_code=status.HTTP_201_CREATED, summary="Publicar un aviso")
def create_announcement(data: AnnouncementIn, user: Coach, service: Coaching):
    return announcement_out(service.create_announcement(user, data))


@router.put("/announcements/{announcement_id}", response_model=AnnouncementOut, summary="Editar un aviso")
def update_announcement(announcement_id: int, data: AnnouncementIn, user: Coach, service: Coaching):
    return announcement_out(service.update_announcement(user, announcement_id, data))


@router.delete("/announcements/{announcement_id}", status_code=status.HTTP_204_NO_CONTENT, summary="Eliminar un aviso")
def delete_announcement(announcement_id: int, user: Coach, service: Coaching):
    service.delete_announcement(user, announcement_id)
