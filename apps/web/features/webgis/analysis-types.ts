import type { FacilityMetric, OverviewMetric } from "./types";

export type SusceptibilityClass = "Sangat Rendah" | "Rendah" | "Sedang" | "Tinggi" | "Sangat Tinggi";

export interface AnalysisRow {
  id: string;
  year: number;
  region: string;
  susceptibility: SusceptibilityClass;
  population: number;
  areaKm2: number;
  rivers: number;
  elevationM: number;
}

export interface AnalysisFilters {
  query: string;
  region: string;
  susceptibility: SusceptibilityClass[];
}

/** Dashboard presentation only; no API contract or spatial analysis method is implied. */
export interface AnalysisData {
  years: number[];
  regions: string[];
  rows: AnalysisRow[];
  classes: { label: SusceptibilityClass; color: string }[];
  snapshots: Record<number, {
    metrics: OverviewMetric[];
    frequency: { id: string; region: string; events: number }[];
    distribution: { label: SusceptibilityClass; value: number; color: string }[];
    annualEvents: { year: string; events: number }[];
    facilities: FacilityMetric[];
  }>;
}
