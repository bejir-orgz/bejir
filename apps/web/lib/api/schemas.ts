// Types for documented API responses and web presentation projections.

export type AssistantChatRequest = {
  "messages": Array<AssistantMessage>;
  "sources": Array<"flood_history" | "flood_susceptibility" | "population_exposure" | "evacuation_sites" | "rivers">;
};

export type AssistantChatResponse = {
  "answer": string;
  "sources": Array<"flood_history" | "flood_susceptibility" | "population_exposure" | "evacuation_sites" | "rivers">;
  "model": string;
};

export type AssistantMessage = {
  "role": "user" | "model";
  "content": string;
};

export type DestinationRouteResponse = {
  "evacuation_site": EvacuationSiteResponse;
  "distance_m": number;
  "duration_minutes": number;
  "rank": number;
  "geometry": Record<string, unknown>;
  "segment_count": number;
  "segments": Array<RouteSegmentResponse>;
};

export type EvacuationSiteResponse = {
  "id": number;
  "name"?: string | null;
  "category"?: string | null;
  "district_id"?: number | null;
  "longitude": number;
  "latitude": number;
};

export type HTTPValidationError = {
  "detail"?: Array<ValidationError>;
};

export type RouteRequest = {
  "origin_longitude": number;
  "origin_latitude": number;
  "evacuation_site_id"?: number | null;
  "travel_mode"?: "driving";
  "limit"?: number;
};

export type RouteResponse = {
  "route_request_id": string;
  "origin_longitude": number;
  "origin_latitude": number;
  "travel_mode": "driving";
  "reachable_destinations": number;
  "routes": Array<DestinationRouteResponse>;
  "evacuation_site"?: EvacuationSiteResponse | null;
  "distance_m"?: number | null;
  "duration_minutes"?: number | null;
  "segments"?: Array<RouteSegmentResponse>;
};

export type RouteSegmentResponse = {
  "sequence": number;
  "road_segment_id": number;
  "name"?: string | null;
  "distance_m": number;
  "geometry"?: Record<string, unknown> | null;
};

export type ValidationError = {
  "loc": Array<string | number>;
  "msg": string;
  "type": string;
  "input"?: unknown;
  "ctx"?: Record<string, unknown>;
};

export interface RegencyMetadata { id: number; name: string }
export interface DistrictMetadata extends RegencyMetadata { regency_id: number }
export interface AdministrativeCatalog { regencies: RegencyMetadata[]; districts: DistrictMetadata[] }
export interface FacilityTotalsResponse {
  health: number | null;
  education: number | null;
  worship: number | null;
  public: null;
  data_kind: "historical_damage";
}

export interface FloodImpactTotals {
  fatalities?: number;
  missing?: number;
  injured?: number;
  affected_displaced?: number;
  houses_heavily_damaged?: number;
  houses_moderately_damaged?: number;
  houses_slightly_damaged?: number;
  houses_flooded?: number;
  schools_damaged?: number;
  religious_facilities_damaged?: number;
  health_facilities_damaged?: number;
  offices_damaged?: number;
  bridges_damaged?: number;
}

export interface FloodRegencyImpacts {
  fatalities?: number;
  missing?: number;
  injured?: number;
  affected_displaced?: number;
  houses_heavily_damaged?: number;
  houses_moderately_damaged?: number;
  houses_slightly_damaged?: number;
  houses_flooded?: number;
  schools_damaged?: number;
  religious_facilities_damaged?: number;
  health_facilities_damaged?: number;
  offices_damaged?: number;
  bridges_damaged?: number;
  regency_id: number;
  regency_name?: string | null;
}

export interface FloodImpactsResponse {
  overall: FloodImpactTotals;
  by_regency: FloodRegencyImpacts[];
}

export interface DistrictRainfallMonthlyResponse {
  district_id: number;
  year?: number | null;
  month: number;
  n_piksel?: number | null;
  hujan_mm?: number | null;
}
