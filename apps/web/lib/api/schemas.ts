// Generated from the live OpenAPI contract on 2026-11-12.

export type AssistantChatRequest = {
  "messages": Array<AssistantMessage>;
  "sources": Array<"flood_history" | "flood_susceptibility" | "population_exposure" | "evacuation_sites">;
};

export type AssistantChatResponse = {
  "answer": string;
  "sources": Array<"flood_history" | "flood_susceptibility" | "population_exposure" | "evacuation_sites">;
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
