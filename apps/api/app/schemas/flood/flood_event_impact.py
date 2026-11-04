from pydantic import BaseModel, ConfigDict


class FloodEventImpactResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    flood_event_id: int

    fatalities: int | None = None
    missing: int | None = None
    injured: int | None = None
    affected_displaced: int | None = None

    houses_heavily_damaged: int | None = None
    houses_moderately_damaged: int | None = None
    houses_slightly_damaged: int | None = None
    houses_flooded: int | None = None

    schools_damaged: int | None = None
    religious_facilities_damaged: int | None = None
    health_facilities_damaged: int | None = None
    offices_damaged: int | None = None
    bridges_damaged: int | None = None