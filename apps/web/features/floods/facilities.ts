import { fetchBackend } from "../../lib/api/backend";
import { readPrepared } from "../geography/prepared-data";
import type { FacilityTotalsResponse, FloodImpactsResponse } from "../../lib/api/schemas";

export interface FacilityTotals extends FacilityTotalsResponse { prepared_at?: string }
interface FacilityGroup extends Pick<FacilityTotals, "health" | "education" | "worship"> { regency_id: number | null; date: string | null }

export function sumFacilityGroups(groups: FacilityGroup[], regencyIds: number[], from: string, to: string): FacilityTotals {
  const selected = groups.filter((row) => (!regencyIds.length || regencyIds.includes(row.regency_id!)) && (!from || (row.date !== null && row.date >= from && row.date <= (to || from))));
  const totals: FacilityTotals = { health: 0, education: 0, worship: 0, public: null, data_kind: "historical_damage" };
  for (const key of ["health", "education", "worship"] as const) {
    for (const row of selected) {
      const value = row[key];
      if (value === null) totals[key] = null;
      else if (!Number.isSafeInteger(value) || value < 0) throw new Error("Jumlah fasilitas tidak valid.");
      else if (totals[key] !== null) totals[key] += value;
    }
  }
  return totals;
}

export async function getFacilityTotals(regencyIds: number[], from = "", to = ""): Promise<FacilityTotals> {
  const query = new URLSearchParams();
  const ids = [...new Set(regencyIds)].sort((a, b) => a - b);
  for (const id of ids) query.append("regency_id", String(id));
  if (from) { query.set("start_date", `${from}T00:00:00`); query.set("end_date", `${to || from}T23:59:59.999999`); }
  const response = await fetchBackend(`/api/v1/flood/impacts?${query}`, { next: { revalidate: 300 }, signal: AbortSignal.timeout(15_000) });
  if (response.status === 404 || response.status === 501) {
    // Compatibility for the old deployment. Offline preparation replaces request-time event fan-out.
    const prepared = await readPrepared<{ groups: FacilityGroup[]; data_kind: string }>("facilities");
    if (!Array.isArray(prepared.groups) || prepared.data_kind !== "historical_damage") throw new Error("Data fasilitas olahan tidak valid.");
    return { ...sumFacilityGroups(prepared.groups, ids, from, to), prepared_at: prepared.prepared_at };
  }
  if (!response.ok) throw new Error("Agregasi fasilitas gagal dimuat.");
  const impacts: FloodImpactsResponse | null = await response.json();
  if (!impacts?.overall) throw new Error("Respons fasilitas tidak valid.");
  const data: FacilityTotals = {
    health: impacts.overall.health_facilities_damaged!,
    education: impacts.overall.schools_damaged!,
    worship: impacts.overall.religious_facilities_damaged!,
    public: null,
    data_kind: "historical_damage",
  };
  for (const key of ["health", "education", "worship", "public"] as const) {
    if (data[key] !== null && (!Number.isSafeInteger(data[key]) || data[key]! < 0)) throw new Error("Respons fasilitas tidak valid.");
  }
  return data;
}
