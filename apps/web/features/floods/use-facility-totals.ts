"use client";
import { useEffect, useState } from "react";
import type { FacilityTotals } from "./facilities";

export function useFacilityTotals(ids: number[], from: string, to: string, enabled: boolean) {
  const query = new URLSearchParams();
  for (const id of [...new Set(ids)].sort((a, b) => a - b)) query.append("regency_id", String(id));
  if (from) query.set("from", from);
  if (to) query.set("to", to);
  const key = query.toString();
  const [result, setResult] = useState<{ key: string; counts?: FacilityTotals; error?: string }>();
  useEffect(() => {
    if (!enabled) return;
    const controller = new AbortController();
    fetch(`/api/flood/facilities?${key}`, { signal: controller.signal }).then(async (response) => {
      if (!response.ok) throw new Error("Jumlah fasilitas belum dapat dimuat.");
      const counts: FacilityTotals = await response.json();
      if (!controller.signal.aborted) setResult({ key, counts });
    }).catch(() => {
      if (!controller.signal.aborted) setResult({ key, error: "Jumlah fasilitas belum dapat dimuat." });
    });
    return () => controller.abort();
  }, [key, enabled]);
  return enabled && result?.key === key ? result : undefined;
}
