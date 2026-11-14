import type { ScopedDistrict } from "../geography/spatial-data";
import type { FacilityMetric, OverviewMetric } from "./types";

export type SusceptibilityClass = "Sangat Rendah" | "Rendah" | "Sedang" | "Tinggi" | "Sangat Tinggi";

export interface AnalysisRow {
  id: string;
  year: number | null;
  region: string;
  susceptibility: SusceptibilityClass | null;
  population: number | null;
  areaKm2: number | null;
  rivers: number | null;
  elevationM: number | null;
  districts?: ScopedDistrict[];
}

export interface AnalysisFilters {
  query: string;
  regionIds: string[];
  susceptibility: SusceptibilityClass[];
}

/** Dashboard presentation only; no API contract or spatial analysis method is implied. */
export interface AnalysisData {
  source?: "backend" | "dummy";
  error?: string;
  years: number[];
  regions: string[];
  rows: AnalysisRow[];
  classes: { label: SusceptibilityClass; color: string }[];
  snapshots: Record<number, {
    errors?: string[];
    metrics: OverviewMetric[];
    frequency: { id: string; region: string; events: number }[];
    distribution: { label: SusceptibilityClass; value: number | null; color: string }[];
    annualEvents: { year: string; events: number }[];
    facilities: FacilityMetric[];
  }>;
}
