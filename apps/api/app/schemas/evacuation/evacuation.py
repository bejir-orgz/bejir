from typing import Literal
from uuid import UUID

from pydantic import BaseModel, Field


class EvacuationSiteResponse(BaseModel):
    id: int
    name: str | None = None
    category: str | None = None
    district_id: int | None = None
    longitude: float
    latitude: float


class EvacuationSiteDetailResponse(EvacuationSiteResponse):
    fid: int | None = None
    osm_id: str | None = None
    osm_type: str | None = None
    source: str | None = None
    code_kec: str | None = None
    display_name: str | None = None


class EvacuationSiteNearbyResponse(EvacuationSiteResponse):
    distance_m: float


class EvacuationSiteListResponse(BaseModel):
    items: list[EvacuationSiteResponse]
    total: int
    limit: int
    offset: int


class RoadSegmentResponse(BaseModel):
    id: int
    road_class: str | None = None
    name: str | None = None
    oneway: str | None = None
    speed_kmh: int | None = None
    length_m: float | None = None
    geometry: dict | None = None


class RoadSegmentListResponse(BaseModel):
    items: list[RoadSegmentResponse]
    total: int
    limit: int
    offset: int


class RouteRequest(BaseModel):
    origin_longitude: float = Field(description="Longitude in EPSG:4326, from -180 to 180")
    origin_latitude: float = Field(description="Latitude in EPSG:4326, from -90 to 90")
    evacuation_site_id: int | None = Field(
        default=None,
        gt=0,
        description="Optional. Omit to find the top limit reachable evacuation sites.",
    )
    travel_mode: Literal["driving"] = Field(
        default="driving",
        description="Routing mode. Currently only driving is supported.",
    )
    limit: int = Field(
        default=3,
        ge=1,
        le=10,
        description="Maximum destinations returned when evacuation_site_id is omitted.",
    )


class RouteSegmentResponse(BaseModel):
    sequence: int
    road_segment_id: int
    name: str | None = None
    distance_m: float
    geometry: dict | None = None


class RouteResponse(BaseModel):
    route_request_id: UUID
    origin_longitude: float
    origin_latitude: float
    travel_mode: Literal["driving"]
    reachable_destinations: int
    routes: list["DestinationRouteResponse"]
    # Legacy aliases refer to the first ranked route.
    evacuation_site: EvacuationSiteResponse | None = None
    distance_m: float | None = None
    duration_minutes: float | None = None
    segments: list[RouteSegmentResponse] = Field(default_factory=list)


class DestinationRouteResponse(BaseModel):
    evacuation_site: EvacuationSiteResponse
    distance_m: float
    duration_minutes: float
    rank: int
    geometry: dict
    segment_count: int
    segments: list[RouteSegmentResponse]
