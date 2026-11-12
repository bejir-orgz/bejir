"use client";

import { useEffect } from "react";
import type { Map as LeafletMap } from "leaflet";
import type { EvacuationSite } from "./types";

export function EvacuationLayer({ map, sites, enabled }: {
  map: LeafletMap; sites: EvacuationSite[]; enabled: boolean;
}) {
  useEffect(() => {
    if (!enabled || !sites.length) return;
    let cancelled = false;
    let cleanup: (() => void) | undefined;
    void import("leaflet").then((L) => {
      if (cancelled) return;
      const renderer = L.canvas({ padding: 0.25 }).addTo(map);
      const layer = L.layerGroup().addTo(map);
      for (const site of sites) {
        const content = document.createElement("span");
        content.textContent = `${site.name || "Lokasi tanpa nama"} · ${site.category || "Kategori tidak tersedia"}`;
        L.circleMarker([site.latitude, site.longitude], {
          renderer, radius: 5, color: "#2563eb", weight: 1,
          fillColor: "#ffffff", fillOpacity: 0.9,
        }).bindTooltip(content).addTo(layer);
      }
      cleanup = () => { layer.remove(); renderer.remove(); };
    });
    return () => { cancelled = true; cleanup?.(); };
  }, [map, sites, enabled]);
  return enabled ? <p className="sr-only" role="status">{sites.length} titik evakuasi dari API. Arahkan penunjuk ke titik untuk melihat nama dan kategori lokasi.</p> : null;
}
