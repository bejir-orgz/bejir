import { yearOverYear } from "../../lib/year-over-year";
import { weightedMean } from "../geography/aggregation";
import type { MonthlyRainfallParameter, RainfallPageData, RainfallParameter, RainfallRow } from "./types";

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

/**
 * Approved mode of API classes, weighted by pixels for each selected district/month.
 * Seven Bekasi districts fall outside the rainfall raster and carry no class in any year,
 * so a district without one is skipped rather than voiding its whole regency — the same
 * way the average column already ignores a district with no reading.
 */
export function rainfallClassification(parameters: readonly MonthlyRainfallParameter[]): string | null {
  const classes = new Map<number, { weight: number; label: string }>();
  for (const row of parameters) {
    if (row.kelas_hujan == null || !row.label_hujan || row.n_piksel == null || row.n_piksel <= 0) continue;
    const previous = classes.get(row.kelas_hujan);
    // One class carrying two labels is contradictory data, not a gap: refuse it.
    if (previous && previous.label !== row.label_hujan) return null;
    classes.set(row.kelas_hujan, { weight: (previous?.weight ?? 0) + row.n_piksel, label: row.label_hujan });
  }
  if (!classes.size) return null;
  const highest = Math.max(...[...classes.values()].map((entry) => entry.weight));
  const winners = [...classes.values()].filter((entry) => entry.weight === highest);
  return winners.length === 1 ? winners[0].label : null;
}

export function rainfallSnapshot(rows: RainfallRow[], previousRows: RainfallRow[] = []): RainfallPageData["snapshots"][number] {
  const parameters = rows.flatMap((row) => row.parameters);
  const totals = aggregateRainfall(parameters);
  const previous = aggregateRainfall(previousRows.flatMap((row) => row.parameters));
  const monthly = rows.flatMap((row) => row.monthly ?? []);
  const months = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
  const format = (value: number | null) => value === null ? "—" : value.toLocaleString("id-ID", { maximumFractionDigits: 1 }) + " mm";
  return {
    metrics: [
      { label: "Rata-Rata Curah Hujan", value: format(totals.average), ...yearOverYear(totals.average, previous.average) },
      { label: "Curah Hujan Minimum", value: format(totals.minimum), ...yearOverYear(totals.minimum, previous.minimum) },
      { label: "Curah Hujan Maksimum", value: format(totals.maximum), ...yearOverYear(totals.maximum, previous.maximum) },
    ],
    distribution: monthly.length ? months.map((month, index) => ({ month, rainfallMm: aggregateRainfall(monthly.filter((row) => row.month === index + 1)).average })) : [],
  };
}
