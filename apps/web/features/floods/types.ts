export type FloodSeverity = "Rendah" | "Sedang" | "Tinggi";

export interface FloodHistoryRow {
  id: string;
  date: string;
  region: string;
  district: string;
  village: string;
  severity: FloodSeverity | null;
  floodType: string | null;
  housesFlooded: number | null;
  deaths: number | null;
  missing: number | null;
}

export interface HistoryFilters {
  query: string;
  regionIds: string[];
  floodTypes: string[];
  from: string;
  to: string;
}

export interface FloodHistoryData {
  source?: "backend";
  error?: string;
  previousCounts?: { region: string; events: number; housesFlooded?: number | null }[];
  years: number[];
  regions: string[];
  rows: FloodHistoryRow[];
  snapshots: Record<number, {
    events: string;
    eventChange: string;
    housesFlooded: string;
    housesFloodedNote: string;
    deaths: number | null;
    missing: number | null;
    timeline: { month: string; events: number }[];
  }>;
}
