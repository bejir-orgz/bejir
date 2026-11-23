"use client";

import { useEffect, useState } from "react";
import type { EvacuationSite } from "./types";

export function useEvacuationSites(enabled: boolean) {
  const [result, setResult] = useState<{ sites: EvacuationSite[]; error?: string } | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!enabled) return;
    const controller = new AbortController();
    fetch("/backend/web/evacuation/sites", { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error("Titik evakuasi gagal dimuat.");
        const sites: EvacuationSite[] = await response.json();
        if (!controller.signal.aborted) setResult({ sites });
      })
      .catch(() => {
        if (!controller.signal.aborted) setResult({ sites: [], error: "Titik evakuasi belum dapat dimuat." });
      });
    return () => controller.abort();
  }, [enabled, attempt]);

  const dataStatus = !enabled ? undefined : result === null
    ? { message: "Memuat titik evakuasi…" }
    : result.error ? { message: result.error, retry: () => { setResult(null); setAttempt((value) => value + 1); } }
      : undefined;
  return { sites: result?.sites ?? [], dataStatus };
}
