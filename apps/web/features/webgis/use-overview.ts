"use client";
import { useEffect, useState } from "react";
import { useFacilityTotals } from "../floods/use-facility-totals";
import type { WorkspaceData, WorkspaceFilters } from "./types";
import { getOverviewDateRange } from "./timeline";

export function useOverview(initial: WorkspaceData["overview"], filters: WorkspaceFilters, enabled: boolean) {
  const [result, setResult] = useState<{ key: string; overview: WorkspaceData["overview"] }>();
  const period = getOverviewDateRange(filters.date, filters.dateTo || "");
  const query = new URLSearchParams();
  for (const id of filters.regionIds) query.append("region", id);
  query.set("from", period.from);
  query.set("to", period.to);
  const key = query.toString();
  const supported = filters.regionIds.every((id) => /^\d+$/.test(id));
  const facilities = useFacilityTotals(supported ? filters.regionIds.map(Number) : [], period.from, period.to, enabled && supported);
  useEffect(() => {
    if (!enabled) return;
    const controller = new AbortController();
    fetch(`/api/workspace/overview?${key}`, { signal: controller.signal }).then(async (response) => {
      if (!response.ok) throw new Error("Ringkasan backend gagal dimuat.");
      const overview: WorkspaceData["overview"] = await response.json();
      if (!controller.signal.aborted) setResult({ key, overview });
    }).catch(() => {
      if (!controller.signal.aborted) setResult({ key, overview: { ...initial, summary: "Ringkasan backend gagal dimuat. Pilih ulang filter untuk mencoba lagi." } });
    });
    return () => controller.abort();
  }, [key, initial, enabled]);
  const overview = result?.key === key ? result.overview : initial;
  if (!facilities) return overview;
  if (facilities.error) return { ...overview, summary: overview.summary + " " + facilities.error };
  return facilities.counts ? { ...overview, summary: overview.summary + (facilities.counts.prepared_at ? ` Snapshot fasilitas disiapkan ${new Date(facilities.counts.prepared_at).toLocaleDateString("id-ID")}.` : ""), facilities: overview.facilities.map((facility) => ({ ...facility, count: facilities.counts![facility.id] })) } : overview;
}
