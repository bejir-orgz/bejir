
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.flood import FloodEventType


class FloodEventTypeRepository:

    @staticmethod
    def get_all(db: Session) -> list[FloodEventType]:
        statement = (
            select(FloodEventType)
            .order_by(FloodEventType.code.asc())
        )

        return list(db.scalars(statement).all())

    @staticmethod
    def get_by_id(
        db: Session,
        event_type_id: int,
    ) -> FloodEventType | None:
        statement = select(FloodEventType).where(
            FloodEventType.id == event_type_id
        )

        return db.scalar(statement)

    @staticmethod
    def get_by_code(
        db: Session,
        code: int,
    ) -> FloodEventType | None:
        statement = select(FloodEventType).where(
            FloodEventType.code == code
        )

        return db.scalar(statement)
