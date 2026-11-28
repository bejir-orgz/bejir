"use client";
import { useEffect } from "react";
import type { Coords, DoneCallback, Map as LeafletMap, TileEvent } from "leaflet";
import { riverTileMaxZoom, riverTileMinZoom, riverTileTemplate, riverVillageStatus } from "./tiles";
import type { RiverMode } from "./use-river-mode";
import { riverViewportLoader } from "./viewport";

export function RiverLayer({
  map,
  mode,
  regionIds,
  onStatus,
}: {
  map: LeafletMap;
  mode?: RiverMode;
  regionIds: string[];
  onStatus: (status: { message: string; retry?: () => void } | undefined) => void;
}) {
  const template = mode === "tiles" ? riverTileTemplate(regionIds) : null;
  const scope = regionIds.join(",");
  useEffect(() => {
    if (mode !== "tiles") return;
    if (!template) {
      onStatus(riverVillageStatus);
      return () => onStatus(undefined);
    }
    let layer: import("leaflet").GridLayer | undefined;
    let closed = false;
    let failed = false;
    const pending = new Map<HTMLElement, AbortController>();
    const load = async () => {
      onStatus({ message: "Memuat jaringan sungai…" });
      const [L, { VectorTile }, { PbfReader }] = await Promise.all([
        import("leaflet"), import("@mapbox/vector-tile"), import("pbf"),
      ]);
      if (closed) return;
      class RiverTiles extends L.GridLayer {
        protected createTile({ z, x, y }: Coords, done: DoneCallback) {
          const canvas = document.createElement("canvas");
          const size = this.getTileSize();
          canvas.width = size.x;
          canvas.height = size.y;
          const controller = new AbortController();
          pending.set(canvas, controller);
          const url = template!.replace("{z}", String(z)).replace("{x}", String(x)).replace("{y}", String(y));
          void fetch(url, { signal: controller.signal }).then(async (response) => {
            if (!response.ok) throw new Error("Tile jaringan sungai gagal dimuat.");
            const bytes = await response.arrayBuffer();
            if (controller.signal.aborted) return;
            const tile = new VectorTile(new PbfReader(bytes)).layers.rivers;
            const context = canvas.getContext("2d");
            if (tile && context) {
              const scale = size.x / tile.extent;
              context.strokeStyle = "#0284c7";
              context.globalAlpha = 0.85;
              context.lineWidth = 1.5;
              context.beginPath();
              for (let i = 0; i < tile.length; i++) {
                for (const [first, ...line] of tile.feature(i).loadGeometry()) {
                  if (!first) continue;
                  context.moveTo(first.x * scale, first.y * scale);
                  for (const point of line) context.lineTo(point.x * scale, point.y * scale);
                }
              }
              context.stroke();
            }
            done(undefined, canvas);
          }).catch(() => {
            if (!controller.signal.aborted) done(new Error("Tile jaringan sungai gagal dimuat."), canvas);
          }).finally(() => pending.delete(canvas));
          return canvas;
        }
      }
      layer = new RiverTiles({
        minZoom: riverTileMinZoom, maxNativeZoom: riverTileMaxZoom,
        noWrap: true, keepBuffer: 1, updateWhenIdle: true,
      });
      layer.on("loading", () => {
        failed = false;
        onStatus({ message: "Memuat jaringan sungai…" });
      });
      layer.on("load", () => {
        if (!failed) onStatus(undefined);
      });
      layer.on("tileerror", () => {
        failed = true;
        onStatus({ message: "Jaringan sungai belum dapat dimuat.", retry: () => layer?.redraw() });
      });
      layer.on("tileunload", ({ tile }: TileEvent) => pending.get(tile)?.abort());
      layer.addTo(map);
    };
    void load().catch(() => {
      if (!closed) onStatus({ message: "Jaringan sungai belum dapat dimuat." });
    });
    return () => {
      closed = true;
      for (const controller of pending.values()) controller.abort();
      layer?.remove();
      onStatus(undefined);
    };
  }, [map, mode, template, onStatus]);
  useEffect(() => {
    if (mode !== "geojson") return;
    let remove: (() => void) | undefined;
    const loader = riverViewportLoader(scope ? scope.split(",") : [], async (data, signal) => {
      const L = await import("leaflet");
      if (signal.aborted) return;
      remove?.();
      const renderer = L.canvas({ padding: 0.2 }).addTo(map);
      const layer = L.geoJSON(data, {
        style: { renderer, color: "#0284c7", weight: 1.5, opacity: 0.85 },
        onEachFeature(feature, line) {
          const label = document.createElement("span");
          label.textContent = `${feature.properties.name || "Sungai tanpa nama"} · ${feature.properties.river_type || "Jenis belum tersedia"}`;
          line.bindTooltip(label);
        },
      }).addTo(map);
      remove = () => {
        layer.remove();
        renderer.remove();
      };
    }, onStatus);
    const load = () => {
      const b = map.getBounds();
      void loader.load([b.getWest(), b.getSouth(), b.getEast(), b.getNorth()]);
    };
    load();
    map.on("moveend", load);
    return () => {
      loader.abort();
      map.off("moveend", load);
      remove?.();
      onStatus(undefined);
    };
  }, [map, mode, scope, onStatus]);
  return null;
}
