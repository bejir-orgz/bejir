from typing import Literal
from uuid import UUID

from pydantic import BaseModel, Field


class EvacuationSiteResponse(BaseModel):
    id: int
    name: str | None = None
    category: str | None = None
    district_id: int
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
    origin_longitude: float = Field(ge=-180, le=180)
    origin_latitude: float = Field(ge=-90, le=90)
    evacuation_site_id: int = Field(gt=0)
    travel_mode: Literal["driving"] = "driving"


class RouteSegmentResponse(BaseModel):
    sequence: int
    road_segment_id: int
    name: str | None = None
    distance_m: float
    geometry: dict | None = None


class RouteResponse(BaseModel):
    route_request_id: UUID
    evacuation_site: EvacuationSiteResponse
    distance_m: float
    duration_minutes: float | None = None
    segments: list[RouteSegmentResponse]
