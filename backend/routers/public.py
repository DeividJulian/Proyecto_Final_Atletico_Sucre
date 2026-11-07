"""Public endpoints (no session): the information the website and the app show to everybody."""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from database import get_db
from dependencies import get_settings_service
from repositories import (
    AppReleaseRepository,
    CategoryRepository,
    CoachRepository,
    GalleryRepository,
    NewsRepository,
    TrainingSessionRepository,
    VenueRepository,
)
from schemas import (
    AppReleaseOut,
    CategoryOut,
    CoachOut,
    GalleryItemOut,
    NewsOut,
    PublicClubOut,
    ScheduleItemOut,
    VenueOut,
)
from services.content import SettingsService, coach_out
from services.errors import NotFound
from services.presenters import schedule_item

router = APIRouter(tags=["público"])


@router.get("/public/club", response_model=PublicClubOut, summary="Tarifas, datos de pago, contacto y política de datos")
def club(service: SettingsService = Depends(get_settings_service)):
    return service.public()


@router.get("/public/venues", response_model=list[VenueOut], summary="Sedes activas")
def venues(db: Session = Depends(get_db)):
    return VenueRepository(db).list_active()


@router.get("/public/categories", response_model=list[CategoryOut], summary="Categorías activas")
def categories(db: Session = Depends(get_db)):
    return CategoryRepository(db).list_active()


@router.get("/public/schedule", response_model=list[ScheduleItemOut], summary="Horario semanal de todas las categorías")
def schedule(db: Session = Depends(get_db)):
    active = [c.id for c in CategoryRepository(db).list_active()]
    return [schedule_item(s) for s in TrainingSessionRepository(db).list_by_categories(active)]


@router.get("/public/coaches", response_model=list[CoachOut], summary="Cuerpo técnico")
def coaches(db: Session = Depends(get_db)):
    # The public site never shows which coach has an account
    return [coach_out(c).model_copy(update={"has_account": False, "email": None, "account_active": None}) for c in CoachRepository(db).list_public()]


@router.get("/public/news", response_model=list[NewsOut], summary="Noticias publicadas")
def news(db: Session = Depends(get_db)):
    return NewsRepository(db).list_published()


@router.get("/public/news/{slug}", response_model=NewsOut, summary="Una noticia")
def news_item(slug: str, db: Session = Depends(get_db)):
    item = NewsRepository(db).get_by_slug(slug)
    if item is None or not item.is_published:
        raise NotFound("No encontramos esa noticia.")
    return item


@router.get("/public/gallery", response_model=list[GalleryItemOut], summary="Galería")
def gallery(db: Session = Depends(get_db)):
    return GalleryRepository(db).list()


@router.get(
    "/app-release",
    response_model=AppReleaseOut | None,
    summary="Versión actual de la app móvil (APK); null mientras no haya ninguna publicada",
)
def app_release(db: Session = Depends(get_db)):
    return AppReleaseRepository(db).current()
