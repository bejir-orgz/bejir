import type { AnalysisData, AnalysisRow } from "./analysis-types";
import { fetchBackend } from "../../lib/api/backend";
import { getFloodStatistics } from "../floods/api";

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
  const response = await fetchBackend(`/api/v1/${path}`, {
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
  const data = { ...emptyAnalysisData(), rows, regions: rows.map((row) => row.region) };
  try {
    const statistics = await getFloodStatistics();
    data.years = statistics.by_year.map((row) => row.year).sort((a, b) => b - a);
    if (data.years.length) data.snapshots[data.years[0]] = await getAnalysisSummary(data.years[0], []);
  } catch {
    data.error = "Ringkasan histori belum dapat dimuat. Tabel spasial tetap tersedia.";
  }
  return data;
}

export async function getAnalysisSummary(year: number, regencyIds: number[]) {
  const groups = await Promise.all((regencyIds.length ? [...new Set(regencyIds)] : [undefined]).map(async (id) => {
    const query = new URLSearchParams();
    if (id !== undefined) query.set("regency_id", String(id));
    const period = (value: number) => {
      const scoped = new URLSearchParams(query);
      scoped.set("start_date", `${value}-01-01T00:00:00`);
      scoped.set("end_date", `${value}-12-31T23:59:59.999999`);
      return scoped.toString();
    };
    const [current, previous, history] = await Promise.all([
      getFloodStatistics(period(year)), getFloodStatistics(period(year - 1)), getFloodStatistics(query.toString()),
    ]);
    return { current, previous, history };
  }));
  const snapshot = emptyAnalysisData().snapshots[0];
  const total = groups.reduce((sum, group) => sum + group.current.summary.total_events, 0);
  const previous = groups.reduce((sum, group) => sum + group.previous.summary.total_events, 0);
  const change = previous ? (total - previous) / previous * 100 : null;
  snapshot.metrics[0].value = total.toLocaleString("id-ID");
  snapshot.metrics[0].change = change === null ? "—" : `${change >= 0 ? "+" : ""}${change.toLocaleString("id-ID", { maximumFractionDigits: 1 })}% dari ${year - 1}`;
  snapshot.metrics[0].trend = change !== null && change < 0 ? "decrease" : "increase";
  snapshot.metrics[3].value = (total / 12).toLocaleString("id-ID", { maximumFractionDigits: 1 });
  snapshot.metrics[3].change = "Total kejadian dibagi 12 bulan";
  const affected = groups.map((group) => group.current.impacts.affected_displaced);
  if (affected.every((value) => value !== null)) {
    snapshot.metrics[2].value = affected.reduce<number>((sum, value) => sum + (value ?? 0), 0).toLocaleString("id-ID") + " jiwa";
    snapshot.metrics[2].change = "Akumulasi terdampak/mengungsi";
  }
  snapshot.frequency = groups.flatMap((group) => group.current.by_regency).map((row) => ({
    id: String(row.regency_id),
    region: /^(Kota|Kabupaten)\s/i.test(row.regency_name) ? row.regency_name : `Kabupaten ${row.regency_name}`,
    events: row.total_events,
  })).sort((a, b) => b.events - a.events).slice(0, 10);
  const annual = new Map<number, number>();
  for (const group of groups) {
    for (const row of group.history.by_year) annual.set(row.year, (annual.get(row.year) ?? 0) + row.total_events);
  }
  snapshot.annualEvents = Array.from({ length: 5 }, (_, index) => ({
    year: String(year - 4 + index), events: annual.get(year - 4 + index) ?? 0,
  }));
  return snapshot;
}
