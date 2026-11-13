from datetime import datetime
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.flood import FloodEvent
from app.schemas.flood import FloodEventFilter
from app.schemas.flood.facilities import FacilityTotals
from app.services.flood import (
    FloodEventImpactService,
    FloodEventService,
    FloodEventTypeService,
)

router = APIRouter()


@router.get("/facilities", response_model=FacilityTotals)
def get_facilities(
    regency_id: list[Annotated[int, Query(gt=0)]] = Query(default=[], max_length=100),
    start_date: datetime | None = Query(default=None),
    end_date: datetime | None = Query(default=None),
    db: Session = Depends(get_db),
):
    if start_date is not None and end_date is not None:
        if (start_date.tzinfo is None) != (end_date.tzinfo is None):
            raise HTTPException(status_code=422, detail="Date timezones must be consistent")
        if start_date > end_date:
            raise HTTPException(status_code=422, detail="start_date must not exceed end_date")
    return FloodEventService.get_facility_totals(
        db, regency_ids=regency_id, start_date=start_date, end_date=end_date,
    )


def _event_or_404(db: Session, event_id: int) -> FloodEvent:
    event = db.get(FloodEvent, event_id)

    if event is None:
        raise HTTPException(
            status_code=404,
            detail=f"Flood event with id {event_id} not found",
        )

    return event


@router.get("/event-types")
def get_event_types(db: Session = Depends(get_db)):
    return FloodEventTypeService.list_event_types(db)


@router.get("/event-types/{event_type_id}")
def get_event_type(event_type_id: int, db: Session = Depends(get_db)):
    event_type = FloodEventTypeService.get_event_type(
        db,
        event_type_id,
    )

    if event_type is None:
        raise HTTPException(
            status_code=404,
            detail=f"Event type with id {event_type_id} not found",
        )

    return event_type


@router.get("/events")
def get_events(
    regency_id: int | None = Query(default=None),
    event_type_id: int | None = Query(default=None),
    start_date: datetime | None = Query(default=None),
    end_date: datetime | None = Query(default=None),
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_db),
):
    filters = FloodEventFilter(
        regency_id=regency_id,
        event_type_id=event_type_id,
        start_date=start_date,
        end_date=end_date,
        limit=limit,
        offset=offset,
    )

    return FloodEventService.list_events(db, filters)


@router.get("/events/{event_id}")
def get_event(event_id: int, db: Session = Depends(get_db)):
    event = FloodEventService.get_event(db, event_id)

    if event is None:
        raise HTTPException(
            status_code=404,
            detail=f"Flood event with id {event_id} not found",
        )

    return event


@router.get("/events/{event_id}/impacts")
def get_event_impacts(event_id: int, db: Session = Depends(get_db)):
    _event_or_404(db, event_id)

    return FloodEventImpactService.list_impacts_by_event(db, event_id)


@router.get("/statistics")
def get_statistics(
    regency_id: int | None = Query(default=None),
    event_type_id: int | None = Query(default=None),
    start_date: datetime | None = Query(default=None),
    end_date: datetime | None = Query(default=None),
    db: Session = Depends(get_db),
):
    return FloodEventService.get_statistics(
        db,
        regency_id=regency_id,
        event_type_id=event_type_id,
        start_date=start_date,
        end_date=end_date,
    )
