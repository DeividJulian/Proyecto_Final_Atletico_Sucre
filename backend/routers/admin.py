"""Admin panel (/admin): everything a coach can do plus the management of the club."""
from typing import Annotated

from fastapi import APIRouter, Depends, Query, status
from fastapi.responses import Response
from sqlalchemy.orm import Session

from database import get_db
from dependencies import (
    get_coach_service,
    get_enrollment_service,
    get_news_service,
    get_payment_service,
    get_release_service,
    get_settings_service,
    get_stats_service,
)
from enums import EnrollmentStatus, PaymentStatus
from models import User
from repositories import AppReleaseRepository, CoachRepository, GuardianRepository, NewsRepository, PlayerRepository
from schemas import (
    ApproveIn,
    AppReleaseIn,
    AppReleaseOut,
    ClubSettingsIn,
    ClubSettingsOut,
    CoachAccountIn,
    ConsentOut,
    CoachIn,
    CoachOut,
    GuardianAdminOut,
    NewsIn,
    NewsOut,
    OverdueOut,
    PaymentAdminIn,
    PaymentAdminOut,
    PlayerAdminUpdate,
    PlayerDetailOut,
    PlayerOut,
    RejectIn,
    StatsOut,
)
from security import require_admin
from services.content import CoachService, NewsService, ReleaseService, SettingsService, coach_out
from services.enrollment import EnrollmentService
from services.errors import NotFound
from services.payments import PaymentService
from services.presenters import guardian_out, payment_admin_out, player_detail, player_out
from services.stats import StatsService

router = APIRouter(prefix="/admin", tags=["administración"], dependencies=[Depends(require_admin)])

Admin = Annotated[User, Depends(require_admin)]
Db = Annotated[Session, Depends(get_db)]
Enrollments = Annotated[EnrollmentService, Depends(get_enrollment_service)]
Payments = Annotated[PaymentService, Depends(get_payment_service)]


# ---------- dashboard

@router.get("/stats", response_model=StatsOut, summary="Estadísticas del dashboard")
def stats(service: Annotated[StatsService, Depends(get_stats_service)]):
    return service.summary()


# ---------- enrollments and players

@router.get("/enrollments", response_model=list[PlayerOut], summary="Inscripciones por estado (por defecto, pendientes)")
def enrollments(service: Enrollments, status_filter: EnrollmentStatus = Query(default=EnrollmentStatus.PENDING, alias="status")):
    return [player_out(p) for p in service.pending(status_filter)]


@router.post("/enrollments/{player_id}/approve", response_model=PlayerOut, summary="Aprobar una inscripción")
def approve(player_id: int, admin: Admin, service: Enrollments, data: ApproveIn | None = None):
    return player_out(service.approve(admin, player_id, data or ApproveIn()))


@router.post("/enrollments/{player_id}/reject", response_model=PlayerOut, summary="Rechazar una inscripción")
def reject(player_id: int, data: RejectIn, service: Enrollments):
    return player_out(service.reject(player_id, data))


@router.get("/players", response_model=list[PlayerOut], summary="Buscar deportistas")
def players(
    db: Db,
    q: str | None = Query(default=None, description="Nombre o documento"),
    category_id: int | None = None,
    status_filter: EnrollmentStatus | None = Query(default=None, alias="status"),
):
    return [player_out(p) for p in PlayerRepository(db).search(q, category_id, status_filter)]


@router.get("/players/{player_id}", response_model=PlayerDetailOut, summary="Ficha completa de un deportista")
def player(player_id: int, db: Db):
    item = PlayerRepository(db).get(player_id)
    if item is None:
        raise NotFound("No encontramos ese deportista.")
    return player_detail(item)


@router.put("/players/{player_id}", response_model=PlayerDetailOut, summary="Editar un deportista (categoría, cuota, estado…)")
def update_player(player_id: int, data: PlayerAdminUpdate, service: Enrollments):
    return player_detail(service.update(player_id, data))


@router.get("/guardians", response_model=list[GuardianAdminOut], summary="Buscar acudientes")
def guardians(db: Db, q: str | None = None):
    return [
        GuardianAdminOut(
            **guardian_out(g).model_dump(), players=[player_out(p) for p in g.players],
            consents=[ConsentOut.model_validate(c) for c in g.consents],
        )
        for g in GuardianRepository(db).search(q)
    ]


# ---------- coaches

@router.get("/coaches", response_model=list[CoachOut], summary="Profesores")
def coaches(db: Db):
    return [coach_out(c) for c in CoachRepository(db).list()]


@router.post("/coaches", response_model=CoachOut, status_code=status.HTTP_201_CREATED, summary="Crear perfil de profesor")
def create_coach(data: CoachIn, service: Annotated[CoachService, Depends(get_coach_service)]):
    return coach_out(service.create(data))


@router.put("/coaches/{coach_id}", response_model=CoachOut, summary="Editar perfil de profesor")
def update_coach(coach_id: int, data: CoachIn, service: Annotated[CoachService, Depends(get_coach_service)]):
    return coach_out(service.update(coach_id, data))


@router.post("/coaches/{coach_id}/account", response_model=CoachOut, status_code=status.HTTP_201_CREATED, summary="Crear la cuenta de acceso del profesor")
def create_coach_account(coach_id: int, data: CoachAccountIn, service: Annotated[CoachService, Depends(get_coach_service)]):
    return coach_out(service.create_account(coach_id, data))


@router.post("/coaches/{coach_id}/account/active", response_model=CoachOut, summary="Activar o desactivar la cuenta del profesor")
def set_coach_active(coach_id: int, service: Annotated[CoachService, Depends(get_coach_service)], active: bool = Query(...)):
    return coach_out(service.set_account_active(coach_id, active))


# ---------- payments

@router.get("/payments", response_model=list[PaymentAdminOut], summary="Pagos (filtros por estado, deportista y periodo)")
def payments(
    service: Payments,
    status_filter: PaymentStatus | None = Query(default=None, alias="status"),
    player_id: int | None = None,
    year: int | None = None,
    month: int | None = Query(default=None, ge=1, le=12),
):
    return [payment_admin_out(p) for p in service.search(status=status_filter, player_id=player_id, year=year, month=month)]


@router.post("/payments", response_model=PaymentAdminOut, status_code=status.HTTP_201_CREATED, summary="Registrar un pago en efectivo (queda verificado)")
def register_payment(data: PaymentAdminIn, admin: Admin, service: Payments):
    return payment_admin_out(service.register_by_admin(admin, data))


@router.post("/payments/{payment_id}/verify", response_model=PaymentAdminOut, summary="Verificar un pago")
def verify_payment(payment_id: int, admin: Admin, service: Payments):
    return payment_admin_out(service.verify(admin, payment_id))


@router.post("/payments/{payment_id}/reject", response_model=PaymentAdminOut, summary="Rechazar un pago")
def reject_payment(payment_id: int, data: RejectIn, admin: Admin, service: Payments):
    return payment_admin_out(service.reject(admin, payment_id, data))


@router.get("/payments/{payment_id}/receipt", summary="Ver el comprobante")
def payment_receipt(payment_id: int, admin: Admin, service: Payments):
    return service.receipt_response(admin, payment_id)


@router.get("/payments/overdue", response_model=list[OverdueOut], summary="Deportistas en mora, con enlace de recordatorio por WhatsApp")
def overdue(service: Payments):
    return service.overdue()


@router.get("/payments/export.csv", summary="Exportar pagos a CSV (Excel)", response_class=Response)
def export_payments(service: Payments):
    return Response(
        content=service.export_csv(),
        media_type="text/csv; charset=utf-8",
        headers={"Content-Disposition": 'attachment; filename="pagos-atletico-sucre.csv"'},
    )


# ---------- content

@router.get("/news", response_model=list[NewsOut], summary="Todas las noticias (incluye borradores)")
def news(db: Db):
    return NewsRepository(db).list()


@router.post("/news", response_model=NewsOut, status_code=status.HTTP_201_CREATED, summary="Crear noticia")
def create_news(data: NewsIn, admin: Admin, service: Annotated[NewsService, Depends(get_news_service)]):
    return service.create(admin, data)


@router.put("/news/{news_id}", response_model=NewsOut, summary="Editar noticia")
def update_news(news_id: int, data: NewsIn, service: Annotated[NewsService, Depends(get_news_service)]):
    return service.update(news_id, data)


@router.delete("/news/{news_id}", status_code=status.HTTP_204_NO_CONTENT, summary="Eliminar noticia")
def delete_news(news_id: int, db: Db):
    repo = NewsRepository(db)
    item = repo.get(news_id)
    if item is None:
        raise NotFound("No encontramos esa noticia.")
    repo.delete(item)
    db.commit()


@router.get("/app-releases", response_model=list[AppReleaseOut], summary="Versiones de la app")
def releases(db: Db):
    return AppReleaseRepository(db).list()


@router.post("/app-releases", response_model=AppReleaseOut, status_code=status.HTTP_201_CREATED, summary="Publicar una versión del APK")
def publish_release(data: AppReleaseIn, admin: Admin, service: Annotated[ReleaseService, Depends(get_release_service)]):
    return service.publish(admin, data)


@router.post("/app-releases/{release_id}/current", response_model=AppReleaseOut, summary="Marcar como versión actual")
def make_current(release_id: int, service: Annotated[ReleaseService, Depends(get_release_service)]):
    return service.make_current(release_id)


# ---------- settings

@router.get("/settings", response_model=ClubSettingsOut, summary="Configuración del club")
def get_settings(service: Annotated[SettingsService, Depends(get_settings_service)]):
    return service.get()


@router.put("/settings", response_model=ClubSettingsOut, summary="Editar tarifas, Nequi, WhatsApp y política de datos")
def update_settings(data: ClubSettingsIn, service: Annotated[SettingsService, Depends(get_settings_service)]):
    return service.update(data)
