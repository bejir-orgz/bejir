import type { FloodHistoryData, FloodHistoryRow } from "./types";
import { unavailableSnapshot } from "./history-summary";
import { fetchBackend } from "../../lib/api/backend";

interface FloodEvent {
  id: number;
  event_datetime: string | null;
  regency_id: number | null;
}

export interface FloodStatistics {
  summary: { total_events: number };
  impacts: { affected_displaced: number | null };
  by_year: { year: number; total_events: number }[];
  by_regency: { regency_id: number; regency_name: string; total_events: number }[];
}

export function getFloodStatistics(query = "") {
  return readFlood<FloodStatistics>(`statistics${query ? "?" + query : ""}`);
}

interface FloodDetail extends FloodEvent {
  impacts: { fatalities: number | null; missing: number | null }[];
}

async function readFlood<T>(path: string): Promise<T> {
  const response = await fetchBackend(`/api/v1/flood/${path}`, {
    next: { revalidate: 300 },
    signal: AbortSignal.timeout(20_000),
  });
  if (!response.ok) throw new Error("Data histori banjir gagal dimuat.");
  return response.json();
}

const regionName = (name: string) => /^(Kota|Kabupaten)\s/i.test(name) ? name : `Kabupaten ${name}`;

export async function getFloodHistory(requestedYear?: number): Promise<FloodHistoryData> {
  const statistics = await getFloodStatistics();
  const years = statistics.by_year.map((entry) => entry.year).sort((a, b) => b - a);
  const year = requestedYear ?? years[0] ?? Number(new Intl.DateTimeFormat("en", { year: "numeric", timeZone: "Asia/Jakarta" }).format(new Date()));
  if (!years.includes(year)) years.push(year);
  const dates = (value: number) => `start_date=${value}-01-01T00:00:00&end_date=${value}-12-31T23:59:59.999999`;
  const previous = await getFloodStatistics(dates(year - 1));
  const events: FloodEvent[] = [];
  for (let offset = 0; ; offset += 100) {
    const page = await readFlood<{ items: FloodEvent[]; total: number }>(`events?${dates(year)}&limit=100&offset=${offset}`);
    events.push(...page.items);
    if (events.length >= page.total) break;
    if (!page.items.length) throw new Error("Data histori banjir belum lengkap.");
  }

  const names = new Map(statistics.by_regency.map((entry) => [entry.regency_id, regionName(entry.regency_name)]));
  const rows: FloodHistoryRow[] = [];
  // Bound concurrency because the live list contract exposes impacts only on event detail.
  for (let index = 0; index < events.length; index += 6) {
    const batch = await Promise.all(events.slice(index, index + 6).map(async (event) => {
      const detail = await readFlood<FloodDetail>(`events/${event.id}`);
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
