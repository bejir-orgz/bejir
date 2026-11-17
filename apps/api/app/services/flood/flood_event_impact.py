from datetime import datetime

from sqlalchemy.orm import Session

from app.repositories.flood import FloodEventImpactRepository, FloodEventRepository
from app.schemas.flood import (
    FloodEventImpactResponse,
    FloodImpactTotals,
    FloodImpactsResponse,
    FloodRegencyImpacts,
)


class FloodEventImpactService:

    @staticmethod
    def get_impacts(
        db: Session,
        *,
        regency_ids: list[int],
        start_date: datetime | None = None,
        end_date: datetime | None = None,
    ) -> FloodImpactsResponse:
        regency_ids = sorted(set(regency_ids))
        overall = FloodEventRepository.get_impact_totals_all(
            db,
            regency_ids=regency_ids,
            start_date=start_date,
            end_date=end_date,
        )
        by_regency = FloodEventRepository.get_impact_totals_by_regency(
            db,
            regency_ids=regency_ids,
            start_date=start_date,
            end_date=end_date,
        )

        return FloodImpactsResponse(
            overall=FloodImpactTotals(**overall),
            by_regency=[
                FloodRegencyImpacts(**item) for item in by_regency
            ],
        )

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
