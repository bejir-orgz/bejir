export type FloodSeverity = "Rendah" | "Sedang" | "Tinggi";

export interface FloodHistoryRow {
  id: string;
  date: string;
  region: string;
  district: string;
  village: string;
  severity: FloodSeverity;
  areaKm2: number;
  deaths: number;
  missing: number;
}

export interface HistoryFilters {
  query: string;
  region: string;
  severities: FloodSeverity[];
  from: string;
  to: string;
}

/** Presentation fixtures, not an agreed backend API contract. */
export interface FloodHistoryData {
  years: number[];
  regions: string[];
  rows: FloodHistoryRow[];
  snapshots: Record<number, {
    events: string;
    eventChange: string;
    area: string;
    areaChange: string;
    deaths: number;
    missing: number;
    timeline: { month: string; events: number }[];
  }>;
}
