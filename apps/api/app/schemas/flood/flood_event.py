from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from app.schemas.flood.flood_event_type import FloodEventTypeResponse
from app.schemas.flood.flood_event_impact import FloodEventImpactResponse


class FloodEventResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    event_id: str | None = None
    event_datetime: datetime | None = None

    regency_code: str | None = None
    regency_id: int | None = None

    event_type_code: int | None = None
    event_type_id: int

    event_count: bool | None = None


class FloodEventDetailResponse(FloodEventResponse):
    event_type: FloodEventTypeResponse
    impacts: list[FloodEventImpactResponse] = []


class FloodEventListResponse(BaseModel):
    items: list[FloodEventResponse]
    total: int
    limit: int
    offset: int


class FloodEventFilter(BaseModel):
    regency_id: int | None = None
    event_type_id: int | None = None

    start_date: datetime | None = None
    end_date: datetime | None = None

    limit: int = Field(default=20, ge=1, le=100)
    offset: int = Field(default=0, ge=0)