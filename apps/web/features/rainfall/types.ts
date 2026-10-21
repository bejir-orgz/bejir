export type RainfallClass = "Sangat Rendah" | "Rendah" | "Sedang" | "Tinggi" | "Sangat Tinggi";

export interface RainfallRow {
  id: string;
  period: string; // YYYY-MM; these table specimens have monthly, not daily, resolution.
  region: string;
  classification: RainfallClass;
  rainfallMm: number;
  averageMm: number;
  minimumMm: number;
  maximumMm: number;
}

export interface RainfallFilters {
  query: string;
  region: string;
  month: string;
  classifications: RainfallClass[];
}

/** UI presentation fixtures; not an agreed backend contract or research methodology. */
export interface RainfallPageData {
  years: number[];
  regions: string[];
  rows: RainfallRow[];
  legend: { label: RainfallClass; range: string; color: string }[];
  snapshots: Record<number, {
    metrics: { label: string; value: string; change: string; trend: "increase" | "decrease" }[];
    distribution: { month: string; rainfallMm: number }[];
  }>;
}
