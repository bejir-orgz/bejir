import type { FloodImpactsResponse } from "../../lib/api/schemas";
import type { FloodHistoryData, FloodHistoryRow } from "./types";
import { unavailableSnapshot } from "./history-summary";
import { fetchBackend } from "../../lib/api/backend";
import { regencyLabel } from "../geography/catalog";

export interface FloodEvent {
  id: number;
  event_datetime: string | null;
  regency_id: number | null;
  /** Impacts now travel with the list, so a year no longer costs one request per event. */
  houses_flooded?: number | null;
  fatalities?: number | null;
  missing?: number | null;
  event_type?: { name: string | null } | null;
}

export interface FloodStatistics {
  summary: { total_events: number };
  impacts: { affected_displaced: number | null; houses_flooded?: number | null; fatalities?: number | null };
  by_year: { year: number; total_events: number }[];
  by_regency: { regency_id: number; regency_name: string | null; total_events: number }[];
}

export async function getFloodStatistics(query = ""): Promise<FloodStatistics> {
  const data = await readFlood<FloodStatistics>(`statistics${query ? "?" + query : ""}`);
  const count = (value: unknown) => typeof value === "number" && Number.isSafeInteger(value) && value >= 0;
  if (
    !data ||
    !count(data.summary?.total_events) ||
    !data.impacts ||
    (data.impacts.affected_displaced !== null && !count(data.impacts.affected_displaced)) ||
    (data.impacts.houses_flooded != null && !count(data.impacts.houses_flooded)) ||
    (data.impacts.fatalities != null && !count(data.impacts.fatalities)) ||
    !Array.isArray(data.by_year) ||
    data.by_year.some((row) => !Number.isSafeInteger(row.year) || row.year < 1 || !count(row.total_events)) ||
    !Array.isArray(data.by_regency) ||
    data.by_regency.some(
      (row) =>
        !Number.isSafeInteger(row.regency_id) ||
        row.regency_id < 1 ||
        (row.regency_name !== null && typeof row.regency_name !== "string") ||
        !count(row.total_events),
    )
  ) {
    throw new Error("Respons statistik Flood tidak valid.");
  }
  return data;
}

async function readFlood<T>(path: string): Promise<T> {
  const response = await fetchBackend(`/api/v1/flood/${path}`, {
    next: { revalidate: 300 },
    signal: AbortSignal.timeout(20_000),
  });
  if (!response.ok) throw new Error("Data histori banjir gagal dimuat.");
  return response.json();
}

const regionName = (name: string | null) => (name === null ? "—" : regencyLabel(name));

export async function listFloodEvents(query: string): Promise<FloodEvent[]> {
  const events: FloodEvent[] = [];
  const seen = new Set<number>();
  let expected: number | undefined;
  for (let offset = 0; ; offset += 100) {
    const params = new URLSearchParams(query);
    params.set("limit", "100");
    params.set("offset", String(offset));
    const page = await readFlood<{ items: FloodEvent[]; total: number }>(`events?${params}`);
    if (
      !Array.isArray(page.items) ||
      !Number.isSafeInteger(page.total) ||
      page.total < 0 ||
      (expected !== undefined && expected !== page.total)
    ) {
      throw new Error("Daftar kejadian berubah atau tidak valid.");
    }
    expected = page.total;
    for (const event of page.items) {
      if (!Number.isSafeInteger(event.id) || seen.has(event.id)) {
        throw new Error("ID kejadian berulang. Backend memerlukan paginasi stabil.");
      }
      seen.add(event.id);
    }
    events.push(...page.items);
    if (events.length > page.total) throw new Error("Cakupan kejadian tidak valid.");
    if (events.length === page.total) return events;
    if (!page.items.length) throw new Error("Data histori banjir belum lengkap.");
  }
}

export { getFacilityTotals } from "./facilities";

export async function getFloodHistory(requestedYear?: number): Promise<FloodHistoryData> {
  const statistics = await getFloodStatistics();
  const years = statistics.by_year.map((entry) => entry.year).sort((a, b) => b - a);
  const year =
    requestedYear ??
    years[0] ??
    Number(new Intl.DateTimeFormat("en", { year: "numeric", timeZone: "Asia/Jakarta" }).format(new Date()));
  if (!years.includes(year)) years.push(year);
  const dates = (value: number) => `start_date=${value}-01-01T00:00:00&end_date=${value}-12-31T23:59:59.999999`;
  const [previous, previousImpacts] = await Promise.all([
    getFloodStatistics(dates(year - 1)),
    readFlood<FloodImpactsResponse>(`impacts?${dates(year - 1)}`)
      .then((data) => {
        if (
          !Array.isArray(data.by_regency) ||
          data.by_regency.some(
            (row) =>
              !Number.isSafeInteger(row.regency_id) ||
              row.regency_id < 1 ||
              (row.houses_flooded != null && (!Number.isSafeInteger(row.houses_flooded) || row.houses_flooded < 0)),
          ) ||
          new Set(data.by_regency.map((row) => row.regency_id)).size !== data.by_regency.length
        ) {
          throw new Error("Impacts tidak valid.");
        }
        return new Map(data.by_regency.map((row) => [row.regency_id, row.houses_flooded ?? null]));
      })
      .catch(() => new Map<number, number | null>()),
  ]);
  const events = await listFloodEvents(dates(year));

  const names = new Map(statistics.by_regency.map((entry) => [entry.regency_id, regionName(entry.regency_name)]));
  // The events list carries impacts and the event type, so no per-event detail read is needed.
  const impact = (value: number | null | undefined) =>
    typeof value === "number" && Number.isSafeInteger(value) && value >= 0 ? value : null;
  const rows: FloodHistoryRow[] = events.map((event) => ({
    id: String(event.id),
    date: event.event_datetime?.slice(0, 10) ?? "",
    region: names.get(event.regency_id ?? -1) ?? "—",
    district: "",
    village: "",
    severity: null,
    housesFlooded: impact(event.houses_flooded),
    floodType: event.event_type?.name ?? null,
    deaths: impact(event.fatalities),
    missing: impact(event.missing),
  }));
  return {
    source: "backend",
    years,
    regions: [...names.values()],
    rows,
    previousCounts: previous.by_regency.map((entry) => ({
      region: regionName(entry.regency_name),
      events: entry.total_events,
      housesFlooded: previousImpacts.get(entry.regency_id) ?? null,
    })),
    snapshots: { [year]: unavailableSnapshot },
  };
}
