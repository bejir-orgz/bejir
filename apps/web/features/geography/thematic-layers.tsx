"use client";

import { useEffect, useState } from "react";
import type { Map as LeafletMap } from "leaflet";
import { isRegionSelected } from "../webgis/region-tree";
import { classColors, classLabels } from "./aggregation";
import type { ThematicCollection, ThematicProperties } from "./thematic-geometry";

const labels: Record<string, string> = { rainfall: "Parameter rata-rata hujan", dem: "Rata-rata elevasi", susceptibility: "Kelas kerawanan", "land-cover": "Tutupan lahan dominan" };
const coverColors: Record<string, string> = {
  "Badan Air": "#2563eb", "Hutan Lahan Kering Primer": "#166534", "Hutan Lahan Kering Sekunder": "#15803d",
  "Hutan Tanaman": "#65a30d", Pemukiman: "#ef4444", Perkebunan: "#a16207", "Pertanian Lahan Kering": "#eab308",
  "Pertanian Lahan Kering Campur": "#d97706", Sawah: "#84cc16", Tambak: "#06b6d4", "Tanah Terbuka": "#a8a29e",
};

function color(id: string, row: ThematicProperties, range: [number, number]) {
  if (id === "susceptibility") return row.kelas_dominan_v2 == null ? "#a3a3a3" : classColors[row.kelas_dominan_v2 - 1] ?? "#a3a3a3";
  if (id === "land-cover") return coverColors[row.landcover_dominan || ""] || "#a3a3a3";
  const field = id === "dem" ? "mean_elevasi_m" : "mean_hujan_mm";
  const value = row[field];
  if (value == null) return "#a3a3a3";
  const [min, max] = range;
  const ratio = max === min ? 0.5 : (value - min) / (max - min);
  return id === "dem" ? `hsl(${120 - ratio * 100} 45% ${80 - ratio * 45}%)` : `hsl(215 80% ${92 - ratio * 57}%)`;
}

export function ThematicLayers({ map, layerIds, regionIds, onStatus }: {
  map: LeafletMap; layerIds: string[]; regionIds: string[];
  onStatus: (status: { message: string; retry?: () => void } | undefined) => void;
}) {
  const active = layerIds.filter((id) => id in labels).join(",");
  const hasActive = Boolean(active);
  const [collection, setCollection] = useState<ThematicCollection>();
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    if (!hasActive || collection) return;
    const controller = new AbortController();
    onStatus({ message: "Memuat layer parameter kecamatan…" });
    fetch("/api/spatial/layers", { signal: controller.signal }).then(async (response) => {
      if (!response.ok) throw new Error("Layer parameter kecamatan belum dapat dimuat.");
      const data: ThematicCollection = await response.json();
      if (!controller.signal.aborted) { setCollection(data); onStatus(undefined); }
    }).catch(() => {
      if (!controller.signal.aborted) onStatus({ message: "Layer parameter kecamatan belum dapat dimuat.", retry: () => setAttempt((value) => value + 1) });
    });
    return () => { controller.abort(); onStatus(undefined); };
  }, [hasActive, collection, attempt, onStatus]);

  useEffect(() => {
    if (!active || !collection) return;
    let closed = false;
    let cleanup: (() => void) | undefined;
    void import("leaflet").then((L) => {
      if (closed) return;
      const pane = map.getPane("thematic") || map.createPane("thematic");
      pane.style.zIndex = "350";
      const renderer = L.canvas({ pane: "thematic" }).addTo(map);
      const layers = L.layerGroup().addTo(map);
      const scoped: ThematicCollection = {
        ...collection,
        features: collection.features.filter(({ properties }) => !regionIds.length || isRegionSelected(regionIds, `${properties.regency_id}/${properties.district_id}`)),
      };
      for (const id of active.split(",")) {
        const field = id === "dem" ? "mean_elevasi_m" : "mean_hujan_mm";
        const values = id === "dem" || id === "rainfall" ? collection.features.map((feature) => feature.properties[field]).filter((value): value is number => value != null) : [0, 1];
        const range: [number, number] = [Math.min(...values), Math.max(...values)];
        L.geoJSON(scoped, {
          pane: "thematic",
          style: (feature) => ({ renderer, color: "#737373", weight: 0.5, fillColor: color(id, feature!.properties as ThematicProperties, range), fillOpacity: 0.8 }),
          onEachFeature(feature, layer) {
            const row = feature.properties as ThematicProperties;
            const value = id === "susceptibility" ? classLabels[(row.kelas_dominan_v2 ?? 0) - 1] ?? "—"
              : id === "land-cover" ? row.landcover_dominan || "—"
                : id === "dem" ? row.mean_elevasi_m == null ? "—" : row.mean_elevasi_m.toLocaleString("id-ID", { maximumFractionDigits: 1 }) + " m"
                  : row.mean_hujan_mm == null ? "—" : row.mean_hujan_mm.toLocaleString("id-ID", { maximumFractionDigits: 1 }) + " mm";
            const text = document.createElement("span");
            text.textContent = `Kecamatan ${row.district_name || row.district_id} · ${labels[id]}: ${value}. Periode spasial belum tersedia.`;
            layer.bindTooltip(text);
          },
        }).addTo(layers);
      }
      cleanup = () => { layers.remove(); renderer.remove(); };
    });
    return () => { closed = true; cleanup?.(); };
  }, [map, active, collection, regionIds]);
  return hasActive ? <p className="sr-only" role="status">Layer kecamatan {active.split(",").map((id) => labels[id]).join(", ")}. Periode spasial belum tersedia. Batas digeneralisasi untuk tampilan.</p> : null;
}
