import { getSpatialDistricts, readSpatialRows } from "../geography/spatial-data";
import { regencyLabel } from "../geography/catalog";
import type { DistrictRainfallMonthlyResponse } from "../../lib/api/schemas";
import { validateSchema } from "../../lib/api/validation";
import contract from "../../lib/api/openapi.json" with { type: "json" };
import { aggregateRainfall, rainfallSnapshot } from "./summary";
import type { RainfallPageData } from "./types";

export function emptyRainfallData(error?: string): RainfallPageData {
  return {
    source: "backend", error, years: [], regions: [], rows: [],
    // Annual mean_hujan_mm thresholds supplied by the backend engineer; monthly API labels stay unchanged.
    legend: [
      { label: "Sangat Rendah", range: "< 2.500 mm/tahun", color: "var(--status-very-low)" },
      { label: "Rendah", range: "2.500–<3.000 mm/tahun", color: "var(--status-low)" },
      { label: "Sedang", range: "3.000–<3.400 mm/tahun", color: "var(--status-medium)" },
      { label: "Tinggi", range: "3.400–<3.900 mm/tahun", color: "var(--status-high)" },
      { label: "Sangat Tinggi", range: "≥ 3.900 mm/tahun", color: "var(--status-very-high)" },
    ],
    snapshots: {
      0: {
        metrics: [
          { label: "Rata-Rata Curah Hujan", value: "—", change: "—", trend: "increase" },
          { label: "Curah Hujan Minimum", value: "—", change: "—", trend: "decrease" },
          { label: "Curah Hujan Maksimum", value: "—", change: "—", trend: "increase" },
        ],
        distribution: [],
      },
    },
  };
}

export async function getRainfallPageData(): Promise<RainfallPageData> {
  const { regencies, districts, errors } = await getSpatialDistricts(false);
  if (!regencies.length || !districts.length) throw new Error("Parameter hujan belum tersedia.");
  const monthly: DistrictRainfallMonthlyResponse[] = [];
  // Cache regional responses separately: the complete multi-year payload exceeds Next's 2 MB entry limit.
  for (let index = 0; index < regencies.length; index += 6) {
    const batch = regencies.slice(index, index + 6);
    const results = await Promise.allSettled(batch.map((regency) =>
      readSpatialRows<DistrictRainfallMonthlyResponse>(`spatial-analysis/district-rainfall-monthly?regency_id=${regency.id}`)));
    for (const [offset, result] of results.entries()) {
      if (result.status === "rejected") {
        errors.push(`Seri hujan bulanan ${batch[offset].name} gagal dimuat.`);
        continue;
      }
      const expected = new Set(districts.filter((row) => row.regency_id === batch[offset].id).map((row) => row.district_id));
      if (result.value.some((row) => !row || !expected.has(row.district_id))) throw new Error("Wilayah seri hujan bulanan tidak valid.");
      monthly.push(...result.value);
    }
  }
  const districtIds = new Set(districts.map((row) => row.district_id));
  const keys = new Set<string>();
  for (const row of monthly) {
    if (validateSchema(contract.components.schemas.DistrictRainfallMonthlyResponse, row, {}).length) throw new Error("Seri hujan bulanan tidak valid.");
    if ((row.kelas_hujan != null && (!Number.isInteger(row.kelas_hujan) || row.kelas_hujan < 1 || row.kelas_hujan > 5)) ||
        (row.label_hujan != null && !row.label_hujan.trim())) throw new Error("Klasifikasi hujan bulanan tidak valid.");
    const key = `${row.district_id}/${row.year ?? "unknown"}/${row.month}`;
    if (!districtIds.has(row.district_id) || !Number.isInteger(row.month) || row.month < 1 || row.month > 12 ||
        (row.year != null && (!Number.isInteger(row.year) || row.year < 1 || row.year > 9998)) ||
        (row.n_piksel != null && (!Number.isSafeInteger(row.n_piksel) || row.n_piksel < 0)) ||
        (row.hujan_mm != null && (!Number.isFinite(row.hujan_mm) || row.hujan_mm < 0)) || keys.has(key)) throw new Error("Seri hujan bulanan tidak valid atau berulang.");
    keys.add(key);
  }
  const byDistrict = new Map<number, DistrictRainfallMonthlyResponse[]>();
  for (const row of monthly) {
    const group = byDistrict.get(row.district_id) ?? [];
    group.push(row); byDistrict.set(row.district_id, group);
  }
  const rows = regencies.map((regency) => {
    const parameters = districts.filter((row) => row.regency_id === regency.id).map(({ mean_hujan_mm, n_piksel, district_name }) => ({ mean_hujan_mm, n_piksel, district_name }));
    const totals = aggregateRainfall(parameters);
    return {
      id: String(regency.id), period: null, classification: null,
      region: regencyLabel(regency.name),
      rainfallMm: totals.average, averageMm: totals.average, minimumMm: totals.minimum, maximumMm: totals.maximum,
      parameters,
      monthly: districts.filter((row) => row.regency_id === regency.id).flatMap((district) => (byDistrict.get(district.district_id) ?? []).map((row) => ({
        district_name: district.district_name, year: row.year ?? null, month: row.month, kelas_hujan: row.kelas_hujan ?? null, label_hujan: row.label_hujan ?? null, n_piksel: row.n_piksel ?? null, mean_hujan_mm: row.hujan_mm ?? null,
      }))),
    };
  });
  return {
    ...emptyRainfallData(errors.join(" ") || undefined), rows, regions: rows.map((row) => row.region),
    years: [...new Set(monthly.flatMap((row) => row.year == null ? [] : [row.year]))].sort((a, b) => b - a),
    snapshots: { 0: rainfallSnapshot(rows) },
  };
}
