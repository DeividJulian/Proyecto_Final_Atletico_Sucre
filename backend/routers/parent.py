"""Parent panel (/me). Every player id is checked against the session's guardian (AccessPolicy)."""
from datetime import date
from typing import Annotated

from fastapi import APIRouter, Depends, File, Form, Query, UploadFile, status

from dependencies import get_family_service, get_payment_service
from models import User
from schemas import (
    AccountStatusOut,
    AnnouncementOut,
    AttendanceSummaryOut,
    GuardianOut,
    GuardianUpdate,
    NoteOut,
    PaymentOut,
    PaymentReportIn,
    PlayerDetailOut,
    PlayerIn,
    PlayerOut,
    PlayerUpdate,
)
from security import require_parent
from services.families import FamilyService
from services.payments import PaymentService
from services.presenters import announcements_out, attendance_out, guardian_out, payment_out, player_detail, player_out

router = APIRouter(prefix="/me", tags=["padre"])

Parent = Annotated[User, Depends(require_parent)]
Families = Annotated[FamilyService, Depends(get_family_service)]
Payments = Annotated[PaymentService, Depends(get_payment_service)]


@router.get("/guardian", response_model=GuardianOut, summary="Mis datos de acudiente")
def my_guardian(user: Parent, service: Families):
    return guardian_out(service.guardian(user))


@router.put("/guardian", response_model=GuardianOut, summary="Actualizar mis datos")
def update_my_guardian(data: GuardianUpdate, user: Parent, service: Families):
    return guardian_out(service.update_guardian(user, data))


@router.get("/players", response_model=list[PlayerOut], summary="Mis hijos")
def my_players(user: Parent, service: Families):
    return [player_out(p) for p in service.players_of(user)]


@router.post("/players", response_model=PlayerOut, status_code=status.HTTP_201_CREATED, summary="Inscribir otro hijo")
def add_player(data: PlayerIn, user: Parent, service: Families):
    return player_out(service.add_player(user, data))


@router.get("/players/{player_id}", response_model=PlayerDetailOut, summary="Ficha de mi hijo con su horario y sede")
def my_player(player_id: int, user: Parent, service: Families):
    return player_detail(service.player(user, player_id))


@router.put("/players/{player_id}", response_model=PlayerDetailOut, summary="Corregir los datos de mi hijo")
def update_player(player_id: int, data: PlayerUpdate, user: Parent, service: Families):
    return player_detail(service.update_player(user, player_id, data))


@router.post("/players/{player_id}/photo", response_model=PlayerOut, summary="Subir la foto de mi hijo (JPG, PNG o WEBP)")
async def upload_photo(player_id: int, user: Parent, service: Families, photo: UploadFile = File(...)):
    return player_out(await service.set_photo(user, player_id, photo))


@router.get("/players/{player_id}/photo", summary="Foto de mi hijo", response_description="La imagen")
def photo(player_id: int, user: Parent, service: Families):
    return service.photo_response(user, player_id)


@router.get("/players/{player_id}/attendance", response_model=AttendanceSummaryOut, summary="Asistencia de mi hijo")
def attendance(
    player_id: int,
    user: Parent,
    service: Families,
    date_from: date | None = Query(default=None),
    date_to: date | None = Query(default=None),
):
    records = service.attendance_of(user, player_id, date_from, date_to)
    counts = {s: sum(1 for r in records if r.status == s) for s in ("present", "absent", "excused", "late")}
    total = len(records)
    return AttendanceSummaryOut(
        total=total,
        **counts,
        rate=round(100 * (counts["present"] + counts["late"]) / total, 1) if total else 0.0,
        records=[attendance_out(r) for r in records],
    )


@router.get("/players/{player_id}/payments", response_model=AccountStatusOut, summary="Estado de pagos de mi hijo")
def account(player_id: int, user: Parent, payments: Payments, year: int | None = Query(default=None)):
    return payments.account_for_user(user, player_id, year)


@router.post(
    "/players/{player_id}/payments",
    response_model=PaymentOut,
    status_code=status.HTTP_201_CREATED,
    summary="Reportar un pago con su comprobante",
    description="Formulario multipart. El comprobante es obligatorio si el pago fue por Nequi. Queda pendiente de verificación.",
)
async def report_payment(
    player_id: int,
    user: Parent,
    payments: Payments,
    data: Annotated[PaymentReportIn, Form()],
    receipt: UploadFile | None = File(default=None),
):
    return payment_out(await payments.report(user, player_id, data, receipt))


@router.get("/payments/{payment_id}/receipt", summary="Ver el comprobante de un pago")
def receipt(payment_id: int, user: Parent, payments: Payments):
    return payments.receipt_response(user, payment_id)


@router.get("/players/{player_id}/notes", response_model=list[NoteOut], summary="Observaciones del profesor")
def notes(player_id: int, user: Parent, service: Families):
    return service.notes_of(user, player_id)


@router.get("/announcements", response_model=list[AnnouncementOut], summary="Avisos del club y de las categorías de mis hijos")
def announcements(user: Parent, service: Families):
    return announcements_out(service.announcements_for(user))
