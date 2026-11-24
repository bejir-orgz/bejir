"use client";

import { useEffect } from "react";
import type { Map as LeafletMap } from "leaflet";
import type { GeoJsonObject } from "geojson";

export function BoundaryLayer({ map, regionIds, onStatus }: {
  map: LeafletMap; regionIds: string[];
  onStatus: (status: { message: string } | undefined) => void;
}) {
  useEffect(() => {
    const ids = regionIds.filter((id) => !id.startsWith("!"));
    if (!ids.length) return;
    const controller = new AbortController();
    onStatus({ message: "Memuat batas wilayah…" });
    let cleanup: (() => void) | undefined;
    async function draw() {
      const rows = await Promise.all(ids.map(async (id) => {
        const response = await fetch(`/backend/web/geography/boundary?region=${encodeURIComponent(id)}`, { signal: controller.signal });
        if (!response.ok) throw new Error("Batas wilayah gagal dimuat.");
        return response.json() as Promise<{ name: string; geom: GeoJsonObject | null }>;
      }));
      const L = await import("leaflet");
      if (controller.signal.aborted) return;
      const layer = L.featureGroup().addTo(map);
      cleanup = () => { layer.remove(); };
      for (const row of rows) {
        if (!row.geom) continue;
        const content = document.createElement("span");
        content.textContent = row.name;
        L.geoJSON(row.geom, { style: { color: "#1d4ed8", weight: 2.5, fillColor: "#3b82f6", fillOpacity: 0.08 } }).bindTooltip(content).addTo(layer);
      }
      if (layer.getBounds().isValid()) {
        const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        if (reduced) map.fitBounds(layer.getBounds(), { padding: [32, 32], animate: false });
        else map.flyToBounds(layer.getBounds(), { padding: [32, 32], duration: 0.65 });
      }
      onStatus(undefined);
    }
    void draw().catch(() => {
      if (!controller.signal.aborted) {
        cleanup?.();
        onStatus({ message: "Batas wilayah belum dapat dimuat. Pilih ulang wilayah untuk mencoba lagi." });
      }
    });
    return () => { controller.abort(); cleanup?.(); onStatus(undefined); };
  }, [map, regionIds, onStatus]);
  return null;
}
