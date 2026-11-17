from pydantic import BaseModel, ConfigDict


class FloodImpactTotals(BaseModel):
    fatalities: int = 0
    missing: int = 0
    injured: int = 0
    affected_displaced: int = 0
    houses_heavily_damaged: int = 0
    houses_moderately_damaged: int = 0
    houses_slightly_damaged: int = 0
    houses_flooded: int = 0
    schools_damaged: int = 0
    religious_facilities_damaged: int = 0
    health_facilities_damaged: int = 0
    offices_damaged: int = 0
    bridges_damaged: int = 0


class FloodRegencyImpacts(FloodImpactTotals):
    regency_id: int
    regency_name: str | None = None


class FloodImpactsResponse(BaseModel):
    overall: FloodImpactTotals
    by_regency: list[FloodRegencyImpacts]


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