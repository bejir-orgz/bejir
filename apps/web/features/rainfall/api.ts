import { getSpatialDistricts, readSpatialRows } from "../geography/spatial-data";
import type { DistrictRainfallMonthlyResponse } from "../../lib/api/schemas";
import { aggregateRainfall, rainfallSnapshot } from "./summary";
import type { RainfallPageData } from "./types";

export function emptyRainfallData(error?: string): RainfallPageData {
  return {
    source: "backend", error, years: [], regions: [], rows: [],
    legend: [
      { label: "Sangat Rendah", range: "—", color: "var(--status-very-low)" },
      { label: "Rendah", range: "—", color: "var(--status-low)" },
      { label: "Sedang", range: "—", color: "var(--status-medium)" },
      { label: "Tinggi", range: "—", color: "var(--status-high)" },
      { label: "Sangat Tinggi", range: "—", color: "var(--status-very-high)" },
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
  const [spatial, monthlyResult] = await Promise.allSettled([
    getSpatialDistricts(false), readSpatialRows<DistrictRainfallMonthlyResponse>("spatial-analysis/district-rainfall-monthly"),
  ]);
  if (spatial.status === "rejected") throw spatial.reason;
  const { regencies, districts, errors } = spatial.value;
  if (!regencies.length || !districts.length) throw new Error("Parameter hujan belum tersedia.");
  const monthly = monthlyResult.status === "fulfilled" ? monthlyResult.value : [];
  if (monthlyResult.status === "rejected") errors.push("Seri hujan bulanan gagal dimuat.");
  const districtIds = new Set(districts.map((row) => row.district_id));
  const keys = new Set<string>();
  for (const row of monthly) {
    if (!row) throw new Error("Seri hujan bulanan tidak valid.");
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
      region: /^(Kabupaten|Kota)\s/i.test(regency.name) ? regency.name : `Kabupaten ${regency.name}`,
      rainfallMm: totals.average, averageMm: totals.average, minimumMm: totals.minimum, maximumMm: totals.maximum,
      parameters,
      monthly: districts.filter((row) => row.regency_id === regency.id).flatMap((district) => (byDistrict.get(district.district_id) ?? []).map((row) => ({
        district_name: district.district_name, year: row.year ?? null, month: row.month, n_piksel: row.n_piksel ?? null, mean_hujan_mm: row.hujan_mm ?? null,
      }))),
    };
  });
  return {
    ...emptyRainfallData(errors.join(" ") || undefined), rows, regions: rows.map((row) => row.region),
    years: [...new Set(monthly.flatMap((row) => row.year == null ? [] : [row.year]))].sort((a, b) => b - a),
    snapshots: { 0: rainfallSnapshot(rows) },
  };
}
