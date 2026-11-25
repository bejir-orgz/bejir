import { fetchBackend } from "../../lib/api/backend";
import { riverScope } from "./filter";
import type { RiverSummary } from "./types";

interface RegencyTotal {
  regency_id: number;
  regency_name: string | null;
  total: number;
}

/** Per-regency counts are identical for everyone and only change when rivers are re-imported. */
async function regencyTotals(): Promise<Record<string, number>> {
  const response = await fetchBackend("/api/v1/rivers/summary", { next: { revalidate: 3600 } });
  if (!response.ok) throw new Error(`Rivers summary HTTP ${response.status}`);
  const rows: RegencyTotal[] = await response.json();
  if (!Array.isArray(rows) || !rows.length) throw new Error("Ringkasan sungai tidak valid.");
  const totals: Record<string, number> = {};
  for (const row of rows) {
    if (
      !Number.isSafeInteger(row.regency_id) ||
      row.regency_id < 1 ||
      !Number.isSafeInteger(row.total) ||
      row.total < 0
    ) {
      throw new Error("Baris ringkasan sungai tidak valid.");
    }
    totals[String(row.regency_id)] = row.total;
  }
  return totals;
}

/** Distinct rivers touching the selection; summing regency totals would double-count shared ones. */
async function scopedTotal(query: string): Promise<number | null> {
  const response = await fetchBackend(`/api/v1/rivers?limit=1${query ? `&${query}` : ""}`, {
    next: { revalidate: 3600 },
  });
  if (!response.ok) throw new Error(`Rivers count HTTP ${response.status}`);
  const page: { total?: number } = await response.json();
  return typeof page.total === "number" && Number.isSafeInteger(page.total) ? page.total : null;
}

export async function getRiverSummary(regionIds: string[]): Promise<RiverSummary> {
  const scope = await riverScope(regionIds);
  // Village scope, and selections wider than the API's 100 district ids, have no scoped count.
  if (scope.kind === "village" || scope.kind === "too-wide") {
    return { total: null, by_regency: await regencyTotals() };
  }
  if (scope.kind === "empty") return { total: 0, by_regency: await regencyTotals() };
  const [by_regency, total] = await Promise.all([regencyTotals(), scopedTotal(scope.query)]);
  return { total, by_regency };
}
