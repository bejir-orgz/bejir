import type { AnalysisData, AnalysisRow } from "./analysis-types";

interface DistrictHazard {
  district_id: number;
  luas_km2: number | null;
}

interface PopulationExposure {
  district_id: number;
  penduduk_est: number | null;
}

interface Regency {
  id: number;
  name: string;
}

export function emptyAnalysisData(error?: string): AnalysisData {
  const classes: AnalysisData["classes"] = [
    { label: "Sangat Tinggi", color: "var(--status-very-high)" },
    { label: "Tinggi", color: "var(--status-high)" },
    { label: "Sedang", color: "var(--status-medium)" },
    { label: "Rendah", color: "var(--status-low)" },
    { label: "Sangat Rendah", color: "var(--status-very-low)" },
  ];
  return {
    source: "backend", error, years: [], regions: [], rows: [], classes,
    snapshots: {
      0: {
        metrics: [
          { id: "events", label: "Total Kejadian Banjir", value: "—", change: "—", trend: "increase" },
          { id: "area", label: "Total Area Terdampak", value: "—", change: "—", trend: "increase" },
          { id: "population", label: "Penduduk Terdampak", value: "—", change: "—", trend: "decrease" },
          { id: "average", label: "Rata-Rata Kejadian/Bulan", value: "—", change: "—", trend: "increase" },
        ],
        frequency: [], distribution: classes.map((entry) => ({ ...entry, value: null })), annualEvents: [],
        facilities: [
          { id: "health", label: "Fasilitas Kesehatan", count: null },
          { id: "education", label: "Fasilitas Pendidikan", count: null },
          { id: "public", label: "Fasilitas Umum", count: null },
          { id: "worship", label: "Tempat Ibadah", count: null },
        ],
      },
    },
  };
}

async function readAnalysis<T>(path: string): Promise<T[]> {
  const origin = (process.env.BEJIR_API_URL || "http://80.43.0.180:8000").replace(/\/+$/, "");
  const response = await fetch(`${origin}/api/v1/${path}`, {
    // Geography includes polygons larger than the Next.js data cache limit.
    ...(path.startsWith("geography/") ? { cache: "no-store" as const } : { next: { revalidate: 300 } }),
    signal: AbortSignal.timeout(30_000),
  });
  if (!response.ok) throw new Error("Data analisis gagal dimuat.");
  const rows: unknown = await response.json();
  if (!Array.isArray(rows)) throw new Error("Respons analisis tidak valid.");
  return rows;
}

function nullableSum(values: (number | null)[]): number | null {
  if (!values.length || values.includes(null)) return null;
  if (values.some((value) => typeof value !== "number" || !Number.isFinite(value) || value < 0)) {
    throw new Error("Nilai analisis tidak valid.");
  }
  return values.reduce<number>((total, value) => total + (value ?? 0), 0);
}

export async function getAnalysisData(): Promise<AnalysisData> {
  const [regencies, exposures] = await Promise.all([
    readAnalysis<Regency>("geography/regencies?province_code=32&limit=1000"),
    readAnalysis<PopulationExposure>("spatial-analysis/population-exposures"),
  ]);
  const population = new Map<number, number | null>();
  for (const exposure of exposures) {
    if (!Number.isSafeInteger(exposure.district_id) || population.has(exposure.district_id)) {
      throw new Error("ID kecamatan pada paparan penduduk tidak valid.");
    }
    population.set(exposure.district_id, exposure.penduduk_est);
  }
  const rows: AnalysisRow[] = [];
  const districtIds = new Set<number>();
  // The API omits regency_id on spatial rows, so fetch hazards with the documented parent filter.
  for (let index = 0; index < regencies.length; index += 6) {
    const batch = await Promise.all(regencies.slice(index, index + 6).map(async (regency) => {
      if (!Number.isSafeInteger(regency.id) || typeof regency.name !== "string") throw new Error("Wilayah tidak valid.");
      const hazards = await readAnalysis<DistrictHazard>(`spatial-analysis/district-hazards?regency_id=${regency.id}`);
      for (const hazard of hazards) {
        if (!Number.isSafeInteger(hazard.district_id) || districtIds.has(hazard.district_id)) {
          throw new Error("ID kecamatan pada kerawanan tidak valid.");
        }
        districtIds.add(hazard.district_id);
      }
      return {
        id: String(regency.id), year: null,
        region: /^(Kota|Kabupaten)\s/i.test(regency.name) ? regency.name : `Kabupaten ${regency.name}`,
        population: nullableSum(hazards.map((hazard) => population.get(hazard.district_id) ?? null)),
        areaKm2: nullableSum(hazards.map((hazard) => hazard.luas_km2)),
        susceptibility: null, rivers: null, elevationM: null,
      };
    }));
    rows.push(...batch);
  }
  return { ...emptyAnalysisData(), rows, regions: rows.map((row) => row.region) };
}
