export type FloodSeverity = "Rendah" | "Sedang" | "Tinggi";

export interface FloodHistoryRow {
  id: string;
  date: string;
  region: string;
  district: string;
  village: string;
  severity: FloodSeverity | null;
  areaKm2: number | null;
  deaths: number | null;
  missing: number | null;
}

export interface HistoryFilters {
  query: string;
  regionIds: string[];
  severities: FloodSeverity[];
  from: string;
  to: string;
}

export interface FloodHistoryData {
  source?: "backend" | "dummy";
  error?: string;
  previousCounts?: { region: string; events: number }[];
  years: number[];
  regions: string[];
  rows: FloodHistoryRow[];
  snapshots: Record<number, {
    events: string;
    eventChange: string;
    area: string;
    areaChange: string;
    deaths: number | null;
    missing: number | null;
    timeline: { month: string; events: number }[];
  }>;
}
