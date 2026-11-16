"use client";
import { useEffect, useState } from "react";
import type { RiverSummary } from "./types";
export function useRiverSummary(regionIds: string[], enabled = true) {
  const query = new URLSearchParams();
  for (const id of regionIds) query.append("region", id);
  const key = query.toString();
  const [result, setResult] = useState<{ key: string; data?: RiverSummary; error?: string }>();
  useEffect(() => {
    if (!enabled) return;
    const controller = new AbortController();
    fetch(`/api/rivers/summary?${key}`, { signal: controller.signal }).then(async (response) => {
      if (!response.ok) throw new Error("Jumlah segmen sungai belum dapat dimuat.");
      const data: RiverSummary = await response.json();
      if (!controller.signal.aborted) setResult({ key, data });
    }).catch(() => { if (!controller.signal.aborted) setResult({ key, error: "Jumlah segmen sungai belum dapat dimuat." }); });
    return () => controller.abort();
  }, [key, enabled]);
  return enabled && result?.key === key ? result : undefined;
}
