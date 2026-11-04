from datetime import datetime

from pydantic import BaseModel


class FloodEventStatisticsSummary(BaseModel):
    total_events: int
    total_regencies_affected: int
    total_event_types: int
    first_event: datetime | None = None
    last_event: datetime | None = None


class FloodEventYearCount(BaseModel):
    year: int
    total_events: int


class FloodEventRegencyCount(BaseModel):
    regency_id: int
    regency_name: str | None = None
    total_events: int


class FloodEventEventTypeCount(BaseModel):
    event_type_id: int
    event_type_name: str | None = None
    total_events: int


class FloodEventImpactTotals(BaseModel):
    fatalities: int = 0
    missing: int = 0
    injured: int = 0
    affected_displaced: int = 0
    houses_heavily_damaged: int = 0
    houses_moderately_damaged: int = 0
    houses_slightly_damaged: int = 0
    houses_flooded: int = 0


class FloodEventStatisticsResponse(BaseModel):
    summary: FloodEventStatisticsSummary
    by_year: list[FloodEventYearCount]
    by_regency: list[FloodEventRegencyCount]
    by_event_type: list[FloodEventEventTypeCount]
    impacts: FloodEventImpactTotals
