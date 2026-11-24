import { yearOverYear } from "../../lib/year-over-year";
import type { AnalysisData, AnalysisRow } from "./analysis-types";
import { classLabels, dominantClass, getHazardParameters, getSpatialDistricts, nullableSum, susceptibilityDistribution, weightedMean, type DistrictParameters } from "../geography/spatial-data";
import { getFloodStatistics, type FloodStatistics } from "../floods/api";
import { regencyLabel } from "../geography/catalog";

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
          { id: "housesFlooded", label: "Total Rumah Terpendam", value: "—", change: "—", trend: "increase" },
          { id: "population", label: "Penduduk Terdampak", value: "—", change: "—", trend: "decrease" },
          { id: "average", label: "Rata-Rata Kejadian/Bulan", value: "—", change: "—", trend: "increase" },
        ],
        frequency: [], distribution: classes.map((entry) => ({ ...entry, value: null })), annualEvents: [],
        facilities: [
          { id: "health", label: "Fasilitas Kesehatan", count: null },
          { id: "education", label: "Fasilitas Pendidikan", count: null },
          { id: "worship", label: "Tempat Ibadah", count: null },
          { id: "bridges", label: "Jembatan", count: null },
        ],
      },
    },
  };
}

export async function getAnalysisData(): Promise<AnalysisData> {
  const [spatial, statistics] = await Promise.allSettled([getSpatialDistricts(), getFloodStatistics()]);
  const { regencies, districts, errors } = spatial.status === "fulfilled" ? spatial.value : { regencies: [], districts: [], errors: ["Tabel spasial gagal dimuat."] };
  const rows: AnalysisRow[] = regencies.map((regency) => {
    const records = districts.filter((row) => row.regency_id === regency.id);
    const classification = dominantClass(records);
    return {
      id: String(regency.id), year: null, districts: records,
      region: regencyLabel(regency.name),
      population: nullableSum(records.map((row) => row.population)),
      areaKm2: nullableSum(records.map((row) => row.luas_km2)),
      susceptibility: classification === null ? null : classLabels[classification - 1],
      rivers: null, elevationM: weightedMean(records, "mean_elevasi_m"),
    };
  });
  const data = { ...emptyAnalysisData(), rows, regions: rows.map((row) => row.region) };
  data.error = errors.join(" ") || undefined;
  if (statistics.status === "fulfilled") {
    data.years = statistics.value.by_year.map((row) => row.year).sort((a, b) => b - a);
    if (data.years.length) {
      const parameters = spatial.status === "fulfilled" && !errors.some((error) => error.includes("parameter")) ? districts : Promise.reject(new Error("Parameter spasial gagal dimuat."));
      data.snapshots[data.years[0]] = await getAnalysisSummary(data.years[0], [], parameters, statistics.value);
    }
  } else {
    data.error = [data.error, "Ringkasan histori gagal dimuat."].filter(Boolean).join(" ");
    if (districts.length) data.snapshots[0].distribution = susceptibilityDistribution(districts).reverse();
  }
  return data;
}

export async function getAnalysisSummary(year: number, regencyIds: number[], districts?: DistrictParameters[] | Promise<DistrictParameters[]>, allTime?: FloodStatistics) {
  const spatial = districts ? Promise.resolve(districts) : getHazardParameters(regencyIds);
  const ids = regencyIds.length ? [...new Set(regencyIds)] : [undefined];
  const query = (id: number | undefined, period?: number) => {
    const params = new URLSearchParams();
    if (id !== undefined) params.set("regency_id", String(id));
    if (period !== undefined) {
      params.set("start_date", `${period}-01-01T00:00:00`);
      params.set("end_date", `${period}-12-31T23:59:59.999999`);
    }
    return params.toString();
  };
  const [current, previous, history, records] = await Promise.allSettled([
    Promise.all(ids.map((id) => getFloodStatistics(query(id, year)))),
    Promise.all(ids.map((id) => getFloodStatistics(query(id, year - 1)))),
    Promise.all(ids.map((id) => id === undefined && allTime ? Promise.resolve(allTime) : getFloodStatistics(query(id)))), spatial,
  ]);
  const snapshot = emptyAnalysisData().snapshots[0];
  snapshot.errors = [
    ...(current.status === "rejected" ? ["Statistik tahun terpilih gagal dimuat."] : []),
    ...(previous.status === "rejected" ? ["Perbandingan tahun sebelumnya gagal dimuat."] : []),
    ...(history.status === "rejected" ? ["Grafik histori gagal dimuat."] : []),
    ...(records.status === "rejected" ? ["Distribusi spasial gagal dimuat."] : []),
  ];
  if (current.status === "fulfilled") {
    const total = current.value.reduce((sum, group) => sum + group.summary.total_events, 0);
    const prior = previous.status === "fulfilled" ? previous.value.reduce((sum, group) => sum + group.summary.total_events, 0) : null;
    const comparison = yearOverYear(total, prior);
    snapshot.metrics[0].value = total.toLocaleString("id-ID");
    Object.assign(snapshot.metrics[0], comparison);
    snapshot.metrics[3].value = (total / 12).toLocaleString("id-ID", { maximumFractionDigits: 1 });
    Object.assign(snapshot.metrics[3], comparison);
    const houses = current.value.map((group) => group.impacts.houses_flooded);
    if (houses.every((value) => value != null)) {
      snapshot.metrics[1].value = houses.reduce<number>((sum, value) => sum + (value ?? 0), 0).toLocaleString("id-ID") + " unit";
      const priorHouses = previous.status === "fulfilled" ? nullableSum(previous.value.map((group) => group.impacts.houses_flooded ?? null)) : null;
      Object.assign(snapshot.metrics[1], yearOverYear(nullableSum(houses.map((value) => value ?? null)), priorHouses));
    }
    const affected = current.value.map((group) => group.impacts.affected_displaced);
    if (affected.every((value) => value !== null)) {
      snapshot.metrics[2].value = affected.reduce<number>((sum, value) => sum + (value ?? 0), 0).toLocaleString("id-ID") + " jiwa";
      const priorAffected = previous.status === "fulfilled" ? nullableSum(previous.value.map((group) => group.impacts.affected_displaced)) : null;
      Object.assign(snapshot.metrics[2], yearOverYear(nullableSum(affected), priorAffected));
    }
    snapshot.frequency = current.value.flatMap((group) => group.by_regency).map((row) => ({
      id: String(row.regency_id), region: row.regency_name === null ? "—" : regencyLabel(row.regency_name), events: row.total_events,
    })).sort((a, b) => b.events - a.events).slice(0, 10);
  }
  if (history.status === "fulfilled") {
    const annual = new Map<number, number>();
    for (const group of history.value) for (const row of group.by_year) annual.set(row.year, (annual.get(row.year) ?? 0) + row.total_events);
    snapshot.annualEvents = Array.from({ length: 5 }, (_, index) => ({ year: String(year - 4 + index), events: annual.get(year - 4 + index) ?? 0 }));
  }
  if (records.status === "fulfilled") snapshot.distribution = susceptibilityDistribution(records.value).reverse();
  return snapshot;
}
