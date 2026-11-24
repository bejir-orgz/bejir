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
  // Sending the default period would hide the fact that nobody chose one, and the
  // server could not fall back to the newest year this scope actually recorded.
  if (filters.date) {
    query.set("from", period.from);
    query.set("to", period.to);
  }
  const key = query.toString();
  const supported = filters.regionIds.every((id) => /^\d+$/.test(id));
  useEffect(() => {
    if (!enabled) return;
    const controller = new AbortController();
    fetch(`/backend/web/workspace/overview?${key}`, { signal: controller.signal }).then(async (response) => {
      if (!response.ok) throw new Error("Ringkasan backend gagal dimuat.");
      const overview: WorkspaceData["overview"] = await response.json();
      if (!controller.signal.aborted) setResult({ key, overview });
    }).catch(() => {
      if (!controller.signal.aborted) setResult({ key, overview: { ...initial, summary: "Ringkasan backend gagal dimuat. Pilih ulang filter untuk mencoba lagi." } });
    });
    return () => controller.abort();
  }, [key, initial, enabled]);
  const overview = result?.key === key ? result.overview : initial;
  // Facilities follow the period the summary actually covers, not the one we guessed.
  const facilities = useFacilityTotals(supported ? filters.regionIds.map(Number) : [], overview.period.from, overview.period.to, enabled && supported);
  if (!facilities) return overview;
  if (facilities.error) return { ...overview, summary: overview.summary + " " + facilities.error };
  return facilities.counts ? { ...overview, facilities: overview.facilities.map((facility) => ({ ...facility, count: facilities.counts![facility.id] })) } : overview;
}
