import { getSpatialDistricts } from "../geography/spatial-data";
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
  const { regencies, districts, errors } = await getSpatialDistricts(false);
  if (!regencies.length || !districts.length) throw new Error("Parameter hujan belum tersedia.");
  const rows = regencies.map((regency) => {
    const parameters = districts.filter((row) => row.regency_id === regency.id).map(({ mean_hujan_mm, n_piksel, district_name }) => ({ mean_hujan_mm, n_piksel, district_name }));
    const totals = aggregateRainfall(parameters);
    return {
      id: String(regency.id), period: null, classification: null,
      region: /^(Kabupaten|Kota)\s/i.test(regency.name) ? regency.name : `Kabupaten ${regency.name}`,
      rainfallMm: totals.average, averageMm: totals.average, minimumMm: totals.minimum, maximumMm: totals.maximum,
      parameters,
    };
  });
  return {
    ...emptyRainfallData(errors.join(" ") || undefined), rows, regions: rows.map((row) => row.region), snapshots: { 0: rainfallSnapshot(rows) },
  };
}
