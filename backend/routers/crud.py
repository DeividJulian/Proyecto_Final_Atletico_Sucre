"""Factory of CRUD routers for the simple catalogs the admin edits (venues, categories, sessions, gallery).

One function builds list / create / update / delete for any model + schema pair, so these catalogs share
exactly the same behaviour and error messages.
"""
from fastapi import APIRouter, Depends, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from database import get_db
from repositories.base import SqlAlchemyRepository
from security import require_admin
from services.errors import NotFound


def crud_router(
    *,
    prefix: str,
    tag: str,
    repository: type[SqlAlchemyRepository],
    schema_in: type[BaseModel],
    schema_out: type[BaseModel],
    label: str,
) -> APIRouter:
    router = APIRouter(prefix=prefix, tags=[tag], dependencies=[Depends(require_admin)])

    def _get(repo: SqlAlchemyRepository, entity_id: int):
        entity = repo.get(entity_id)
        if entity is None:
            raise NotFound(f"No encontramos {label}.")
        return entity

    @router.get("", response_model=list[schema_out], summary=f"Listar ({tag})")
    def list_items(db: Session = Depends(get_db)):
        return repository(db).list()

    @router.post("", response_model=schema_out, status_code=status.HTTP_201_CREATED, summary=f"Crear ({tag})")
    def create_item(data: schema_in, db: Session = Depends(get_db)):  # type: ignore[valid-type]
        entity = repository(db).add(repository.model(**data.model_dump()))
        db.commit()
        return entity

    @router.put("/{entity_id}", response_model=schema_out, summary=f"Editar ({tag})")
    def update_item(entity_id: int, data: schema_in, db: Session = Depends(get_db)):  # type: ignore[valid-type]
        repo = repository(db)
        entity = repo.update(_get(repo, entity_id), data.model_dump())
        db.commit()
        return entity

    @router.delete("/{entity_id}", status_code=status.HTTP_204_NO_CONTENT, summary=f"Eliminar ({tag})")
    def delete_item(entity_id: int, db: Session = Depends(get_db)):
        repo = repository(db)
        repo.delete(_get(repo, entity_id))
        db.commit()

    return router
