import type { SusceptibilityClass } from "../webgis/analysis-types";
import type { DistrictParameters } from "./spatial-data";

export const classLabels: SusceptibilityClass[] = ["Sangat Rendah", "Rendah", "Sedang", "Tinggi", "Sangat Tinggi"];
export const classColors = ["#3cff00", "#e1ff00", "#ffd000", "#ff6a00", "#ff0000"];

export function nullableSum(values: (number | null | undefined)[]): number | null {
  if (!values.length || values.some((value) => value == null)) return null;
  if (values.some((value) => typeof value !== "number" || !Number.isFinite(value) || value < 0)) throw new Error("Nilai agregasi tidak valid.");
  return values.reduce<number>((sum, value) => sum + (value ?? 0), 0);
}

export function weightedMean<Field extends "mean_elevasi_m" | "mean_hujan_mm" | "mean_hand_m" | "mean_slope_pct" | "pct_rawan_v2">(rows: (Pick<DistrictParameters, "n_piksel"> & Partial<Record<Field, number | null>>)[], field: Field): number | null {
  if (!rows.length || rows.some((row) => row[field] == null || !Number.isFinite(row[field]) || !Number.isSafeInteger(row.n_piksel) || row.n_piksel! <= 0)) return null;
  const weight = rows.reduce((sum, row) => sum + row.n_piksel!, 0);
  return rows.reduce((sum, row) => sum + row[field]! * row.n_piksel!, 0) / weight;
}

/** Approved pixel-weighted mode of district dominant classes. A tied mode remains unavailable. */
export function dominantClass(rows: DistrictParameters[]): number | null {
  if (!rows.length || rows.some((row) => !Number.isInteger(row.kelas_dominan_v2) || row.kelas_dominan_v2! < 1 || row.kelas_dominan_v2! > 5 || !Number.isSafeInteger(row.n_piksel) || row.n_piksel! <= 0)) return null;
  const weights = new Map<number, number>();
  for (const row of rows) weights.set(row.kelas_dominan_v2!, (weights.get(row.kelas_dominan_v2!) ?? 0) + row.n_piksel!);
  const highest = Math.max(...weights.values());
  const winners = [...weights].filter(([, weight]) => weight === highest);
  return winners.length === 1 ? winners[0][0] : null;
}

export function susceptibilityDistribution(rows: DistrictParameters[]) {
  return classLabels.map((label, index) => ({
    label, color: classColors[index], value: rows.filter((row) => row.kelas_dominan_v2 === index + 1).length,
  }));
}
