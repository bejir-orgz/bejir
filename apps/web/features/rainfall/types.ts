import type { DistrictParameters } from "../geography/spatial-data";

export type RainfallClass = string;
export type RainfallParameter = Pick<DistrictParameters, "mean_hujan_mm" | "n_piksel"> & { district_name?: string | null };
export interface MonthlyRainfallParameter extends RainfallParameter { year: number | null; month: number; kelas_hujan?: number | null; label_hujan?: string | null }

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


export interface RainfallRequest {
  summaryYear: number;
  tableYear: number;
  summaryRegionIds: string[];
  filters: RainfallFilters;
}

export interface RainfallView {
  key: string;
  years: number[];
  regions: string[];
  legend: RainfallPageData["legend"];
  rows: RainfallRow[];
  snapshot: RainfallPageData["snapshots"][number];
  classificationOptions: string[];
  monthlyAvailable: boolean;
  error?: string;
}
