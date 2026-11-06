"""Repository pattern: services talk to these interfaces, never to SQLAlchemy queries directly.

Repositories only add/flush; the service that owns the use case decides when to commit (one transaction
per use case, so a registration with 3 children is saved completely or not at all).
"""
from abc import ABC, abstractmethod
from collections.abc import Sequence
from typing import Generic, TypeVar

from sqlalchemy import select
from sqlalchemy.orm import Session

from database import Base

T = TypeVar("T", bound=Base)


class AbstractRepository(ABC, Generic[T]):
    @abstractmethod
    def get(self, entity_id: int) -> T | None: ...

    @abstractmethod
    def list(self) -> Sequence[T]: ...

    @abstractmethod
    def add(self, entity: T) -> T: ...

    @abstractmethod
    def delete(self, entity: T) -> None: ...


class SqlAlchemyRepository(AbstractRepository[T]):
    model: type[T]
    default_order: tuple = ()

    def __init__(self, session: Session):
        self.session = session

    def get(self, entity_id: int) -> T | None:
        return self.session.get(self.model, entity_id)

    def list(self) -> Sequence[T]:
        statement = select(self.model)
        order = self.default_order or (self.model.id,)
        return self.session.scalars(statement.order_by(*order)).all()

    def add(self, entity: T) -> T:
        self.session.add(entity)
        self.session.flush()
        return entity

    def delete(self, entity: T) -> None:
        self.session.delete(entity)
        self.session.flush()

    def update(self, entity: T, values: dict) -> T:
        for field, value in values.items():
            setattr(entity, field, value)
        self.session.flush()
        return entity
