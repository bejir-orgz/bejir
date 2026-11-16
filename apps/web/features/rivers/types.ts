import type { Feature, MultiLineString } from "geojson";
export interface RiverProperties { id: number; name: string | null; river_type: string | null; district_paths: string[] }
export type RiverFeature = Feature<MultiLineString, RiverProperties> & { id: number; bbox: [number, number, number, number] };
export interface PreparedRivers { source: string; prepared_at: string; total: number; source_crs: "EPSG:4326"; display_tolerance_m_3857: number; features: RiverFeature[] }
export interface RiverSummary { total: number | null; by_regency: Record<string, number>; prepared_at: string }
