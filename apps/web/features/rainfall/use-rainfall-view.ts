"use client";

import { useEffect, useState } from "react";
import type { RainfallView } from "./types";

export function useRainfallView(initial: RainfallView, key: string) {
  const [result, setResult] = useState(initial);
  useEffect(() => {
    if (result.key === key) return;
    const controller = new AbortController();
    const timer = setTimeout(() => {
      fetch("/backend/web/rainfall", { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: key, signal: controller.signal }).then(async (response) => {
        if (!response.ok) throw new Error("Ringkasan hujan gagal dimuat.");
        const view: RainfallView = await response.json();
        if (view.key !== key) throw new Error("Filter respons hujan tidak sesuai.");
        if (!controller.signal.aborted) setResult(view);
      }).catch(() => {
        if (!controller.signal.aborted) setResult({ ...initial, key, rows: [], snapshot: { metrics: initial.snapshot.metrics.map((metric) => ({ ...metric, value: "—", change: "—" })), distribution: [] }, error: "Data curah hujan gagal dimuat. Pilih ulang filter untuk mencoba lagi." });
      });
    }, 200);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [key, initial, result.key]);
  if (result.key === key) return result;
  return { ...initial, rows: [], snapshot: { metrics: initial.snapshot.metrics.map((metric) => ({ ...metric, value: "—", change: "—" })), distribution: [] }, error: "Memuat data curah hujan…" };
}
