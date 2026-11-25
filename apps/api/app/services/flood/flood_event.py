from datetime import datetime

from sqlalchemy.orm import Session

from app.repositories.flood import FloodEventRepository
from app.schemas.flood.facilities import FacilityTotals
from app.schemas.flood import (
    FloodEventDetailResponse,
    FloodEventEventTypeCount,
    FloodEventFilter,
    FloodEventImpactTotals,
    FloodEventListItemResponse,
    FloodEventListResponse,
    FloodEventRegencyCount,
    FloodEventStatisticsResponse,
    FloodEventStatisticsSummary,
    FloodEventYearCount,
)


class FloodEventService:

    @staticmethod
    def get_facility_totals(
        db: Session, *, regency_ids: list[int],
        start_date: datetime | None = None, end_date: datetime | None = None,
    ) -> FacilityTotals:
        totals = FloodEventRepository.get_facility_totals(
            db, regency_ids=sorted(set(regency_ids)), start_date=start_date, end_date=end_date,
        )
        return FacilityTotals(**{
            name: None if totals[f"{name}_unknown"] else totals[name]
            for name in ("health", "education", "worship")
        })

    @staticmethod
    def list_events(
        db: Session,
        filters: FloodEventFilter,
    ) -> FloodEventListResponse:
        items, total = FloodEventRepository.get_all(
            db,
            regency_id=filters.regency_id,
            event_type_id=filters.event_type_id,
            start_date=filters.start_date,
            end_date=filters.end_date,
            limit=filters.limit,
            offset=filters.offset,
        )

        items_out = []
        for item in items:
            summary = FloodEventListItemResponse.model_validate(item)
            impact = item.impacts[0] if item.impacts else None
            if impact is not None:
                summary = summary.model_copy(update={
                    "houses_flooded": impact.houses_flooded,
                    "fatalities": impact.fatalities,
                    "missing": impact.missing,
                })
            items_out.append(summary)

        return FloodEventListResponse(
            items=items_out,
            total=total,
            limit=filters.limit,
            offset=filters.offset,
        )

    @staticmethod
    def get_event(
        db: Session,
        event_id: int,
    ) -> FloodEventDetailResponse | None:
        event = FloodEventRepository.get_by_id(db, event_id)

        if event is None:
            return None

        return FloodEventDetailResponse.model_validate(event)

    @staticmethod
    def get_statistics(
        db: Session,
        *,
        regency_id: int | None = None,
        event_type_id: int | None = None,
        start_date: datetime | None = None,
        end_date: datetime | None = None,
    ) -> FloodEventStatisticsResponse:
        filters = {
            "regency_id": regency_id,
            "event_type_id": event_type_id,
            "start_date": start_date,
            "end_date": end_date,
        }

        summary = FloodEventRepository.get_statistics_summary(
            db,
            **filters,
        )
        by_year = FloodEventRepository.get_event_counts_by_year(
            db,
            **filters,
        )
        by_regency = FloodEventRepository.get_event_counts_by_regency(
            db,
            **filters,
        )
        by_event_type = (
            FloodEventRepository.get_event_counts_by_event_type(
                db,
                **filters,
            )
        )
        impacts = FloodEventRepository.get_impact_totals(
            db,
            **filters,
        )

        return FloodEventStatisticsResponse(
            summary=FloodEventStatisticsSummary(**summary),
            by_year=[
                FloodEventYearCount(**item) for item in by_year
            ],
            by_regency=[
                FloodEventRegencyCount(**item)
                for item in by_regency
            ],
            by_event_type=[
                FloodEventEventTypeCount(**item)
                for item in by_event_type
            ],
            impacts=FloodEventImpactTotals(**impacts),
        )
