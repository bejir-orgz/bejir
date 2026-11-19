import { fetchBackend } from "../../lib/api/backend";
import type { FacilityTotalsResponse, FloodImpactsResponse } from "../../lib/api/schemas";

export interface FacilityTotals extends FacilityTotalsResponse { bridges: number | null }

export async function getFacilityTotals(regencyIds: number[], from = "", to = ""): Promise<FacilityTotals> {
  const query = new URLSearchParams();
  const ids = [...new Set(regencyIds)].sort((a, b) => a - b);
  for (const id of ids) query.append("regency_id", String(id));
  if (from) { query.set("start_date", `${from}T00:00:00`); query.set("end_date", `${to || from}T23:59:59.999999`); }
  const response = await fetchBackend(`/api/v1/flood/impacts?${query}`, { next: { revalidate: 300 }, signal: AbortSignal.timeout(15_000) });
  if (!response.ok) throw new Error("Agregasi fasilitas gagal dimuat.");
  const impacts: FloodImpactsResponse | null = await response.json();
  if (!impacts?.overall) throw new Error("Respons fasilitas tidak valid.");
  const data: FacilityTotals = {
    health: impacts.overall.health_facilities_damaged!,
    education: impacts.overall.schools_damaged!,
    worship: impacts.overall.religious_facilities_damaged!,
    bridges: impacts.overall.bridges_damaged!,
    public: null,
    data_kind: "historical_damage",
  };
  for (const key of ["health", "education", "worship", "bridges", "public"] as const) {
    if (data[key] !== null && (!Number.isSafeInteger(data[key]) || data[key]! < 0)) throw new Error("Respons fasilitas tidak valid.");
  }
  return data;
}
