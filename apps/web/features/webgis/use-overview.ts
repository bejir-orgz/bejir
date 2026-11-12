"use client";
import { useEffect, useState } from "react";
import type { WorkspaceData, WorkspaceFilters } from "./types";

export function useOverview(initial: WorkspaceData["overview"], filters: WorkspaceFilters) {
  const [result, setResult] = useState<{ key: string; overview: WorkspaceData["overview"] }>();
  const query = new URLSearchParams();
  for (const id of filters.regionIds) query.append("region", id);
  if (filters.date) query.set("from", filters.date);
  if (filters.dateTo) query.set("to", filters.dateTo);
  const key = query.toString();
  useEffect(() => {
    const controller = new AbortController();
    fetch(`/api/workspace/overview?${key}`, { signal: controller.signal }).then(async (response) => {
      if (!response.ok) throw new Error("Ringkasan backend gagal dimuat.");
      const overview: WorkspaceData["overview"] = await response.json();
      if (!controller.signal.aborted) setResult({ key, overview });
    }).catch(() => {
      if (!controller.signal.aborted) setResult({ key, overview: { ...initial, summary: "Ringkasan backend gagal dimuat. Pilih ulang filter untuk mencoba lagi." } });
    });
    return () => controller.abort();
  }, [key, initial]);
  return result?.key === key ? result.overview : initial;
}
