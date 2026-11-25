"use client";
import { useEffect } from "react";
import type { Map as LeafletMap } from "leaflet";
import type { FeatureCollection, MultiLineString } from "geojson";
import type { RiverProperties } from "./types";

type RiverViewport = { returned: number; total_matching: number; truncated: boolean; scope_unsupported: "village" | "too-wide" | null };

function riverStatus(data: RiverViewport): { message: string } | undefined {
  if (data.scope_unsupported === "village") return { message: "Filter sungai tingkat kelurahan/desa belum tersedia." };
  if (data.scope_unsupported === "too-wide") return { message: "Pilihan wilayah terlalu luas untuk filter sungai. Pilih lebih sedikit daerah." };
  const shown = data.returned.toLocaleString("id-ID");
  // A truncated page arrives longest-first, so the view is the major rivers, not a random slice.
  if (data.truncated) return { message: `Menampilkan ${shown} sungai terpanjang dari ${data.total_matching.toLocaleString("id-ID")} segmen pada area peta. Perbesar peta untuk melihat anak sungai.` };
  return data.returned ? undefined : { message: "Tidak ada segmen sungai pada area peta ini." };
}

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
        const data: FeatureCollection<MultiLineString, RiverProperties> & { returned: number; total_matching: number; truncated: boolean; scope_unsupported: "village" | "too-wide" | null } = await response.json();
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
        onStatus(riverStatus(data));
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
