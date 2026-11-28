"use client";

import { useEffect, useState } from "react";

export type RiverMode = "tiles" | "geojson";

export function useRiverMode(enabled: boolean) {
  const [mode, setMode] = useState<RiverMode>();
  useEffect(() => {
    if (!enabled) return;
    const controller = new AbortController();
    fetch("/backend/web/rivers/mode", { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error("Pemeriksaan API sungai gagal.");
        const result: { mode?: RiverMode } = await response.json();
        if (!controller.signal.aborted) setMode(result.mode === "tiles" ? "tiles" : "geojson");
      })
      .catch(() => {
        if (!controller.signal.aborted) setMode("geojson");
      });
    return () => controller.abort();
  }, [enabled]);
  return enabled ? mode : undefined;
}
