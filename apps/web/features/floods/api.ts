import type { FloodHistoryData, FloodHistoryRow } from "./types";
import { unavailableSnapshot } from "./history-summary";
import { fetchBackend } from "../../lib/api/backend";

export interface FloodEvent {
  id: number;
  event_datetime: string | null;
  regency_id: number | null;
}

export interface FloodStatistics {
  summary: { total_events: number };
  impacts: { affected_displaced: number | null };
  by_year: { year: number; total_events: number }[];
  by_regency: { regency_id: number; regency_name: string | null; total_events: number }[];
}

export async function getFloodStatistics(query = ""): Promise<FloodStatistics> {
  const data = await readFlood<FloodStatistics>(`statistics${query ? "?" + query : ""}`);
  const count = (value: unknown) => typeof value === "number" && Number.isSafeInteger(value) && value >= 0;
  if (!data || !count(data.summary?.total_events) || !data.impacts || (data.impacts.affected_displaced !== null && !count(data.impacts.affected_displaced)) ||
      !Array.isArray(data.by_year) || data.by_year.some((row) => !Number.isSafeInteger(row.year) || row.year < 1 || !count(row.total_events)) ||
      !Array.isArray(data.by_regency) || data.by_regency.some((row) => !Number.isSafeInteger(row.regency_id) || row.regency_id < 1 || (row.regency_name !== null && typeof row.regency_name !== "string") || !count(row.total_events))) {
    throw new Error("Respons statistik Flood tidak valid.");
  }
  return data;
}

interface FloodDetail extends FloodEvent { impacts: FloodImpact[]; event_type?: { name: string | null } | null }

export interface FloodImpact {
  fatalities: number | null;
  missing: number | null;
  schools_damaged?: number | null;
  religious_facilities_damaged?: number | null;
  health_facilities_damaged?: number | null;
  offices_damaged?: number | null;
  bridges_damaged?: number | null;
}

async function readFlood<T>(path: string): Promise<T> {
  const response = await fetchBackend(`/api/v1/flood/${path}`, {
    next: { revalidate: 300 },
    signal: AbortSignal.timeout(20_000),
  });
  if (!response.ok) throw new Error("Data histori banjir gagal dimuat.");
  return response.json();
}

const regionName = (name: string | null) => name === null ? "—" : /^(Kota|Kabupaten)\s/i.test(name) ? name : `Kabupaten ${name}`;

export async function listFloodEvents(query: string): Promise<FloodEvent[]> {
  const events: FloodEvent[] = [];
  const seen = new Set<number>();
  let expected: number | undefined;
  for (let offset = 0; ; offset += 100) {
    const params = new URLSearchParams(query);
    params.set("limit", "100");
    params.set("offset", String(offset));
    const page = await readFlood<{ items: FloodEvent[]; total: number }>(`events?${params}`);
    if (!Array.isArray(page.items) || !Number.isSafeInteger(page.total) || page.total < 0 || (expected !== undefined && expected !== page.total)) throw new Error("Daftar kejadian berubah atau tidak valid.");
    expected = page.total;
    for (const event of page.items) {
      if (!Number.isSafeInteger(event.id) || seen.has(event.id)) throw new Error("ID kejadian berulang. Backend memerlukan paginasi stabil.");
      seen.add(event.id);
    }
    events.push(...page.items);
    if (events.length > page.total) throw new Error("Cakupan kejadian tidak valid.");
    if (events.length === page.total) return events;
    if (!page.items.length) throw new Error("Data histori banjir belum lengkap.");
  }
}

export function getFloodDetail(id: number) { return readFlood<FloodDetail>(`events/${id}`); }

export { getFacilityTotals } from "./facilities";

export async function getFloodHistory(requestedYear?: number): Promise<FloodHistoryData> {
  const statistics = await getFloodStatistics();
  const years = statistics.by_year.map((entry) => entry.year).sort((a, b) => b - a);
  const year = requestedYear ?? years[0] ?? Number(new Intl.DateTimeFormat("en", { year: "numeric", timeZone: "Asia/Jakarta" }).format(new Date()));
  if (!years.includes(year)) years.push(year);
  const dates = (value: number) => `start_date=${value}-01-01T00:00:00&end_date=${value}-12-31T23:59:59.999999`;
  const previous = await getFloodStatistics(dates(year - 1));
  const events = await listFloodEvents(dates(year));

  const names = new Map(statistics.by_regency.map((entry) => [entry.regency_id, regionName(entry.regency_name)]));
  const rows: FloodHistoryRow[] = [];
  // Bound concurrency because the live list contract exposes impacts only on event detail.
  for (let index = 0; index < events.length; index += 6) {
    const batch = await Promise.all(events.slice(index, index + 6).map(async (event) => {
      const detail = await getFloodDetail(event.id);
      const sum = (field: "fatalities" | "missing") => {
        const values = detail.impacts.map((impact) => impact[field]);
        return values.length && values.every((value) => value !== null)
          ? values.reduce<number>((total, value) => total + (value ?? 0), 0) : null;
      };
      return {
        id: String(event.id),
        date: event.event_datetime?.slice(0, 10) ?? "",
        region: names.get(event.regency_id ?? -1) ?? "—",
        district: "", village: "", severity: null, areaKm2: null,
        floodType: detail.event_type?.name ?? null,
        deaths: sum("fatalities"), missing: sum("missing"),
      };
    }));
    rows.push(...batch);
  }
  return {
    source: "backend", years, regions: [...names.values()], rows,
    previousCounts: previous.by_regency.map((entry) => ({ region: regionName(entry.regency_name), events: entry.total_events })),
    snapshots: { [year]: unavailableSnapshot },
  };
}
