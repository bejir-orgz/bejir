import { weightedMean } from "../geography/aggregation";
import type { RainfallPageData, RainfallParameter, RainfallRow } from "./types";

export function aggregateRainfall(parameters: RainfallParameter[]) {
  const known = parameters.filter((row) => row.mean_hujan_mm !== null);
  if (known.some((row) => !Number.isFinite(row.mean_hujan_mm) || row.mean_hujan_mm! < 0)) throw new Error("Parameter hujan tidak valid.");
  const values = known.map((row) => row.mean_hujan_mm!);
  return {
    average: weightedMean(known, "mean_hujan_mm"),
    minimum: values.length ? Math.min(...values) : null,
    maximum: values.length ? Math.max(...values) : null,
    known: known.length, total: parameters.length,
  };
}

export function rainfallSnapshot(rows: RainfallRow[]): RainfallPageData["snapshots"][number] {
  const totals = aggregateRainfall(rows.flatMap((row) => row.parameters));
  const format = (value: number | null) => value === null ? "—" : value.toLocaleString("id-ID", { maximumFractionDigits: 1 }) + " mm";
  return {
    metrics: [
      { label: "Rata-Rata Curah Hujan", value: format(totals.average), change: `${totals.known}/${totals.total} kecamatan · berbobot piksel`, trend: "increase" },
      { label: "Curah Hujan Minimum", value: format(totals.minimum), change: "Rata-rata kecamatan terendah", trend: "decrease" },
      { label: "Curah Hujan Maksimum", value: format(totals.maximum), change: "Rata-rata kecamatan tertinggi", trend: "increase" },
    ],
    distribution: [],
  };
}
