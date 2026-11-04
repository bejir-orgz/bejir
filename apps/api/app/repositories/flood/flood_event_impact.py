
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.flood import FloodEventImpact


class FloodEventImpactRepository:

    @staticmethod
    def get_by_id(
        db: Session,
        impact_id: int,
    ) -> FloodEventImpact | None:
        statement = select(FloodEventImpact).where(
            FloodEventImpact.id == impact_id
        )

        return db.scalar(statement)

    @staticmethod
    def get_by_event_id(
        db: Session,
        flood_event_id: int,
    ) -> list[FloodEventImpact]:
        statement = (
            select(FloodEventImpact)
            .where(
                FloodEventImpact.flood_event_id == flood_event_id
            )
            .order_by(FloodEventImpact.id.asc())
        )

        return list(db.scalars(statement).all())
