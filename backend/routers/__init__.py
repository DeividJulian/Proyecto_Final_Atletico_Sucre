"""HTTP layer: routers only translate requests and answers; the rules live in services/."""
from routers import admin, auth, coach, parent, public
from routers.crud import crud_router
from repositories import CategoryRepository, GalleryRepository, TrainingSessionRepository, VenueRepository
from schemas import (
    CategoryIn,
    CategoryOut,
    GalleryItemIn,
    GalleryItemOut,
    TrainingSessionIn,
    TrainingSessionOut,
    VenueIn,
    VenueOut,
)

catalog_routers = [
    crud_router(prefix="/admin/venues", tag="admin: sedes", repository=VenueRepository,
                schema_in=VenueIn, schema_out=VenueOut, label="esa sede"),
    crud_router(prefix="/admin/categories", tag="admin: categorías", repository=CategoryRepository,
                schema_in=CategoryIn, schema_out=CategoryOut, label="esa categoría"),
    crud_router(prefix="/admin/training-sessions", tag="admin: horarios", repository=TrainingSessionRepository,
                schema_in=TrainingSessionIn, schema_out=TrainingSessionOut, label="ese horario"),
    crud_router(prefix="/admin/gallery", tag="admin: galería", repository=GalleryRepository,
                schema_in=GalleryItemIn, schema_out=GalleryItemOut, label="esa imagen"),
]

__all__ = ["admin", "auth", "coach", "parent", "public", "catalog_routers"]
