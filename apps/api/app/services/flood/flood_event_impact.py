from sqlalchemy.orm import Session

from app.repositories.flood import FloodEventImpactRepository
from app.schemas.flood import FloodEventImpactResponse


class FloodEventImpactService:

    @staticmethod
    def list_impacts_by_event(
        db: Session,
        flood_event_id: int,
    ) -> list[FloodEventImpactResponse]:
        impacts = FloodEventImpactRepository.get_by_event_id(
            db,
            flood_event_id,
        )

        return [
            FloodEventImpactResponse.model_validate(impact)
            for impact in impacts
        ]

    @staticmethod
    def get_impact(
        db: Session,
        impact_id: int,
    ) -> FloodEventImpactResponse | None:
        impact = FloodEventImpactRepository.get_by_id(db, impact_id)

        if impact is None:
            return None

        return FloodEventImpactResponse.model_validate(impact)
