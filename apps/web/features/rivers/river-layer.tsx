"use client";
import { useEffect } from "react";
import type { Map as LeafletMap } from "leaflet";
import type { FeatureCollection, MultiLineString } from "geojson";
import type { RiverProperties } from "./types";

export function RiverLayer({ map, enabled, regionIds, onStatus }: { map: LeafletMap; enabled: boolean; regionIds: string[]; onStatus: (status: { message: string; retry?: () => void } | undefined) => void }) {
  const scope = regionIds.join(",");
  useEffect(() => {
    if (!enabled) return;
    let controller: AbortController | undefined;
    let remove: (() => void) | undefined;
    let closed = false;
    async function load() {
      controller?.abort();
      const active = new AbortController(); controller = active;
      const bounds = map.getBounds();
      const bbox = [Math.max(-180, bounds.getWest()), Math.max(-90, bounds.getSouth()), Math.min(180, bounds.getEast()), Math.min(90, bounds.getNorth())].map((n) => n.toFixed(6)).join(",");
      const query = new URLSearchParams({ bbox });
      for (const id of scope.split(",").filter(Boolean)) query.append("region", id);
      onStatus({ message: "Memuat jaringan sungai…" });
      try {
        const response = await fetch(`/backend/web/rivers/layers?${query}`, { signal: active.signal });
        if (!response.ok) throw new Error("Jaringan sungai belum dapat dimuat.");
        const data: FeatureCollection<MultiLineString, RiverProperties> & { returned: number; total_matching: number; truncated: boolean; village_unsupported: boolean; region_unsupported: boolean } = await response.json();
        const L = await import("leaflet");
        if (closed || active.signal.aborted) return;
        remove?.();
        const renderer = L.canvas({ padding: 0.2 }).addTo(map);
        const layer = L.geoJSON(data, { style: { renderer, color: "#0284c7", weight: 1.5, opacity: 0.85 }, onEachFeature(feature, line) {
          const text = document.createElement("span");
          text.textContent = `${feature.properties.name || "Sungai tanpa nama"} · ${feature.properties.river_type || "Jenis belum tersedia"}`;
          line.bindTooltip(text);
        } }).addTo(map);
        remove = () => { layer.remove(); renderer.remove(); };
        // The API filters rivers by viewport only, so say so rather than imply the region filter applied.
        const scopeNote = data.region_unsupported ? " Layer sungai mengikuti area peta yang terlihat, belum filter wilayah." : "";
        onStatus(data.village_unsupported || data.region_unsupported || data.truncated
          // A truncated page now arrives longest-first, so the view is the major rivers
          // rather than an arbitrary slice.
          ? { message: (data.truncated ? `Menampilkan ${data.returned.toLocaleString("id-ID")} sungai terpanjang dari ${data.total_matching.toLocaleString("id-ID")} segmen pada area peta. Perbesar peta untuk melihat anak sungai.` : `Menampilkan ${data.returned.toLocaleString("id-ID")} segmen pada area peta.`) + scopeNote }
          : undefined);
      } catch (error) {
        if (!closed && !active.signal.aborted) { remove?.(); remove = undefined; onStatus({ message: error instanceof Error ? error.message : "Layer sungai gagal.", retry: () => { void load(); } }); }
      }
    }
    void load();
    map.on("moveend", load);
    return () => { closed = true; controller?.abort(); map.off("moveend", load); remove?.(); onStatus(undefined); };
  }, [map, enabled, scope, onStatus]);
  return null;
}
