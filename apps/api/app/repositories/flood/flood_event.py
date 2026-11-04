
from datetime import datetime

from sqlalchemy import Select, func, select
from sqlalchemy.orm import Session, joinedload

from app.models.flood import (
    FloodEvent,
    FloodEventImpact,
    FloodEventType,
)
from app.models.geography.regency import Regency

_IMPACT_TOTAL_COLUMNS = (
    "fatalities",
    "missing",
    "injured",
    "affected_displaced",
    "houses_heavily_damaged",
    "houses_moderately_damaged",
    "houses_slightly_damaged",
    "houses_flooded",
)


class FloodEventRepository:

    @staticmethod
    def _apply_filters(
        statement: Select,
        *,
        regency_id: int | None = None,
        event_type_id: int | None = None,
        start_date: datetime | None = None,
        end_date: datetime | None = None,
    ) -> Select:
        if regency_id is not None:
            statement = statement.where(
                FloodEvent.regency_id == regency_id
            )

        if event_type_id is not None:
            statement = statement.where(
                FloodEvent.event_type_id == event_type_id
            )

        if start_date is not None:
            statement = statement.where(
                FloodEvent.event_datetime >= start_date
            )

        if end_date is not None:
            statement = statement.where(
                FloodEvent.event_datetime <= end_date
            )

        return statement

    @staticmethod
    def get_all(
        db: Session,
        *,
        regency_id: int | None = None,
        event_type_id: int | None = None,
        start_date: datetime | None = None,
        end_date: datetime | None = None,
        limit: int = 20,
        offset: int = 0,
    ) -> tuple[list[FloodEvent], int]:

        statement = select(FloodEvent)

        statement = FloodEventRepository._apply_filters(
            statement,
            regency_id=regency_id,
            event_type_id=event_type_id,
            start_date=start_date,
            end_date=end_date,
        )

        # Total records before pagination
        count_statement = select(func.count()).select_from(
            statement.order_by(None).subquery()
        )

        total = db.scalar(count_statement) or 0

        # Pagination and eager loading
        statement = (
            statement
            .options(joinedload(FloodEvent.event_type))
            .order_by(FloodEvent.event_datetime.desc().nullslast())
            .limit(limit)
            .offset(offset)
        )

        items = list(db.scalars(statement).all())

        return items, total

    @staticmethod
    def get_by_id(
        db: Session,
        event_id: int,
    ) -> FloodEvent | None:

        statement = (
            select(FloodEvent)
            .options(
                joinedload(FloodEvent.event_type),
                joinedload(FloodEvent.impacts),
            )
            .where(FloodEvent.id == event_id)
        )

        return db.scalars(statement).unique().one_or_none()

    @staticmethod
    def get_statistics_summary(
        db: Session,
        *,
        regency_id: int | None = None,
        event_type_id: int | None = None,
        start_date: datetime | None = None,
        end_date: datetime | None = None,
    ) -> dict:
        statement = select(
            func.count(FloodEvent.id).label("total_events"),
            func.count(func.distinct(FloodEvent.regency_id)).label(
                "total_regencies_affected"
            ),
            func.count(func.distinct(FloodEvent.event_type_id)).label(
                "total_event_types"
            ),
            func.min(FloodEvent.event_datetime).label("first_event"),
            func.max(FloodEvent.event_datetime).label("last_event"),
        )

        statement = FloodEventRepository._apply_filters(
            statement,
            regency_id=regency_id,
            event_type_id=event_type_id,
            start_date=start_date,
            end_date=end_date,
        )

        row = db.execute(statement).one()

        return {
            "total_events": row.total_events,
            "total_regencies_affected": row.total_regencies_affected,
            "total_event_types": row.total_event_types,
            "first_event": row.first_event,
            "last_event": row.last_event,
        }

    @staticmethod
    def get_event_counts_by_year(
        db: Session,
        *,
        regency_id: int | None = None,
        event_type_id: int | None = None,
        start_date: datetime | None = None,
        end_date: datetime | None = None,
    ) -> list[dict]:
        year = func.extract(
            "year",
            FloodEvent.event_datetime,
        ).label("year")

        statement = (
            select(
                year,
                func.count(FloodEvent.id).label("total_events"),
            )
            .where(FloodEvent.event_datetime.is_not(None))
        )

        statement = FloodEventRepository._apply_filters(
            statement,
            regency_id=regency_id,
            event_type_id=event_type_id,
            start_date=start_date,
            end_date=end_date,
        )

        statement = statement.group_by(year).order_by(year)

        rows = db.execute(statement).all()

        return [
            {
                "year": int(row.year),
                "total_events": row.total_events,
            }
            for row in rows
        ]

    @staticmethod
    def get_event_counts_by_regency(
        db: Session,
        *,
        regency_id: int | None = None,
        event_type_id: int | None = None,
        start_date: datetime | None = None,
        end_date: datetime | None = None,
    ) -> list[dict]:
        statement = (
            select(
                FloodEvent.regency_id.label("regency_id"),
                Regency.name.label("regency_name"),
                func.count(FloodEvent.id).label("total_events"),
            )
            .select_from(FloodEvent)
            .join(Regency, Regency.id == FloodEvent.regency_id)
            .where(FloodEvent.regency_id.is_not(None))
        )

        statement = FloodEventRepository._apply_filters(
            statement,
            regency_id=regency_id,
            event_type_id=event_type_id,
            start_date=start_date,
            end_date=end_date,
        )

        statement = (
            statement
            .group_by(FloodEvent.regency_id, Regency.name)
            .order_by(
                func.count(FloodEvent.id).desc(),
                Regency.name.asc(),
            )
        )

        rows = db.execute(statement).all()

        return [
            {
                "regency_id": row.regency_id,
                "regency_name": row.regency_name,
                "total_events": row.total_events,
            }
            for row in rows
        ]

    @staticmethod
    def get_event_counts_by_event_type(
        db: Session,
        *,
        regency_id: int | None = None,
        event_type_id: int | None = None,
        start_date: datetime | None = None,
        end_date: datetime | None = None,
    ) -> list[dict]:
        statement = (
            select(
                FloodEvent.event_type_id.label("event_type_id"),
                FloodEventType.name.label("event_type_name"),
                func.count(FloodEvent.id).label("total_events"),
            )
            .select_from(FloodEvent)
            .join(
                FloodEventType,
                FloodEventType.id == FloodEvent.event_type_id,
            )
        )

        statement = FloodEventRepository._apply_filters(
            statement,
            regency_id=regency_id,
            event_type_id=event_type_id,
            start_date=start_date,
            end_date=end_date,
        )

        statement = (
            statement
            .group_by(FloodEvent.event_type_id, FloodEventType.name)
            .order_by(
                func.count(FloodEvent.id).desc(),
                FloodEventType.name.asc(),
            )
        )

        rows = db.execute(statement).all()

        return [
            {
                "event_type_id": row.event_type_id,
                "event_type_name": row.event_type_name,
                "total_events": row.total_events,
            }
            for row in rows
        ]

    @staticmethod
    def get_impact_totals(
        db: Session,
        *,
        regency_id: int | None = None,
        event_type_id: int | None = None,
        start_date: datetime | None = None,
        end_date: datetime | None = None,
    ) -> dict:
        statement = select(
            *[
                func.coalesce(
                    func.sum(getattr(FloodEventImpact, column)),
                    0,
                ).label(column)
                for column in _IMPACT_TOTAL_COLUMNS
            ]
        )
        statement = (
            statement
            .select_from(FloodEventImpact)
            .join(
                FloodEvent,
                FloodEvent.id == FloodEventImpact.flood_event_id,
            )
        )

        statement = FloodEventRepository._apply_filters(
            statement,
            regency_id=regency_id,
            event_type_id=event_type_id,
            start_date=start_date,
            end_date=end_date,
        )

        row = db.execute(statement).one()

        return {
            column: getattr(row, column)
            for column in _IMPACT_TOTAL_COLUMNS
        }
