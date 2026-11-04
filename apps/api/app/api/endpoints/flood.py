from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.flood import FloodEvent
from app.schemas.flood import FloodEventFilter
from app.services.flood import (
    FloodEventImpactService,
    FloodEventService,
    FloodEventTypeService,
)

router = APIRouter()


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
