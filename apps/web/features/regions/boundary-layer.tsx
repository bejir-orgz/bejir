"use client";

import { useEffect } from "react";
import type { Map as LeafletMap } from "leaflet";
import type { GeoJsonObject } from "geojson";
import { requestBackend } from "../../lib/api/client";

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
      const rows = await Promise.all(ids.map((id) => {
        const parts = id.split("/");
        const resource = ["regencies", "districts", "villages"][parts.length - 1];
        return requestBackend<{ name: string; geom: GeoJsonObject | null }>(`/api/v1/geography/${resource}/${parts.at(-1)}`, { signal: controller.signal });
      }));
      const L = await import("leaflet");
      if (controller.signal.aborted) return;
      const layer = L.featureGroup().addTo(map);
      cleanup = () => { layer.remove(); };
      for (const row of rows) {
        if (!row.geom) continue;
        const content = document.createElement("span");
        content.textContent = row.name;
        L.geoJSON(row.geom, { style: { color: "#2563eb", weight: 2, fillOpacity: 0 } }).bindTooltip(content).addTo(layer);
      }
      if (layer.getBounds().isValid()) map.fitBounds(layer.getBounds(), { padding: [24, 24] });
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
