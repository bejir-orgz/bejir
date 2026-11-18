import type { DistrictParameters } from "../geography/spatial-data";

export type RainfallClass = "Sangat Rendah" | "Rendah" | "Sedang" | "Tinggi" | "Sangat Tinggi";
export type RainfallParameter = Pick<DistrictParameters, "mean_hujan_mm" | "n_piksel"> & { district_name?: string | null };
export interface MonthlyRainfallParameter extends RainfallParameter { year: number | null; month: number }

export interface RainfallRow {
  id: string;
  period: string | null;
  month?: number;
  year?: number;
  region: string;
  classification: RainfallClass | null;
  rainfallMm: number | null;
  averageMm: number | null;
  minimumMm: number | null;
  maximumMm: number | null;
  parameters: RainfallParameter[];
  monthly?: MonthlyRainfallParameter[];
}

export interface RainfallFilters {
  query: string;
  regionIds: string[];
  month: string;
  classifications: RainfallClass[];
}

/** Presentation values retain missing period and rainfall classification metadata. */
export interface RainfallPageData {
  source?: "backend";
  error?: string;
  years: number[];
  regions: string[];
  rows: RainfallRow[];
  legend: { label: RainfallClass; range: string; color: string }[];
  snapshots: Record<number, {
    metrics: { label: string; value: string; change: string; trend: "increase" | "decrease" }[];
    distribution: { month: string; rainfallMm: number | null }[];
  }>;
}
