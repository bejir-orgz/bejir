"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import type { Map as LeafletMap, TileLayer } from "leaflet";
import { IconCurrentLocation, IconMinus, IconPlus } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { westJavaBasemap } from "../basemap";
import "leaflet/dist/leaflet.css";

/** Owns map lifecycle; domain layers are composed by the workspace. */
export function InteractiveMap({
  children,
  dataStatus,
  onRetryWebGL,
}: {
  children?: (map: LeafletMap) => ReactNode;
  dataStatus?: { message: string; retry?: () => void };
  onRetryWebGL?: () => void;
}) {
  const container = useRef<HTMLDivElement>(null);
  const instance = useRef<LeafletMap | null>(null);
  const tileLayer = useRef<TileLayer | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [zoom, setZoom] = useState(7);
  const [minZoom, setMinZoom] = useState(westJavaBasemap.minZoom);
  const [readyMap, setReadyMap] = useState<LeafletMap | null>(null);

  useEffect(() => {
    let cancelled = false;
    let map: LeafletMap | undefined;
    let observer: ResizeObserver | undefined;

    async function initialize() {
      try {
        const L = await import("leaflet");
        if (cancelled || !container.current) return;
        map = L.map(container.current, {
          zoomControl: false,
          minZoom: westJavaBasemap.minZoom,
          maxZoom: westJavaBasemap.maxZoom,
          maxBounds: westJavaBasemap.panBounds,
          maxBoundsViscosity: 1,
          attributionControl: true,
        });
        instance.current = map;
        setReadyMap(map);
        map.attributionControl.setPrefix(false);
        map.attributionControl.setPosition("bottomleft");
        const tiles = L.tileLayer(westJavaBasemap.tileUrl, {
          attribution: westJavaBasemap.attribution,
          maxZoom: westJavaBasemap.maxZoom,
          // Load only the visible viewport; let the browser honor normal tile caching.
          keepBuffer: 0,
          updateWhenIdle: true,
        });
        tileLayer.current = tiles;
        tiles.on("tileerror", () => {
          if (!cancelled) setStatus("error");
        });
        tiles.on("tileload", () => {
          if (!cancelled) setStatus("ready");
        });
        tiles.addTo(map);
        map.fitBounds(westJavaBasemap.bounds, { padding: [24, 24], animate: false });
        const leafletMap = map;
        const updateMinZoom = () => {
          const { x, y } = leafletMap.getSize();
          if (x <= 48 || y <= 48) return;
          leafletMap.setMinZoom(westJavaBasemap.minZoom);
          const panBoxZoom = leafletMap.getBoundsZoom(westJavaBasemap.panBounds, true);
          leafletMap.setMinZoom(panBoxZoom);
          setMinZoom(panBoxZoom);
        };
        updateMinZoom();
        setZoom(map.getZoom());
        map.on("zoomend", () => {
          if (!cancelled && map) setZoom(map.getZoom());
        });
        observer = new ResizeObserver(() => {
          leafletMap.invalidateSize({ pan: true, animate: false });
          updateMinZoom();
        });
        observer.observe(container.current);
      } catch {
        if (!cancelled) setStatus("error");
      }
    }
    void initialize();
    return () => {
      cancelled = true;
      observer?.disconnect();
      map?.remove();
      instance.current = null;
      tileLayer.current = null;
    };
  }, []);

  return (
    <section
      className="gis-map absolute [inset:0] overflow-hidden bg-[#e8eee6] [&_.leaflet-control-attribution]:[font:11px/16px_var(--font-google-sans-flex),Arial,sans-serif]! [&_.leaflet-control-attribution]:bg-white! [&_:is(.leaflet-bar,.leaflet-control-layers,.leaflet-popup-content-wrapper,.leaflet-popup-tip,.leaflet-tooltip)]:shadow-none! [&_.leaflet-control-scale-line]:[text-shadow:none]! max-[999.01px]:[inset:0]"
      aria-label="Peta interaktif Jawa Barat"
    >
      <div
        ref={container}
        className="gis-leaflet-map absolute! [inset:0]! z-0! [font-family:inherit]!"
        aria-label="Peta dasar OpenStreetMap Jawa Barat. Gunakan tombol panah untuk menggeser serta tombol tambah dan kurang untuk zoom."
      />
      {readyMap ? children?.(readyMap) : null}

      {dataStatus || status !== "ready" ? (
        <div
          className="gis-map-status absolute z-1 left-[calc(var(--regions-width,0px)_+_64px)] right-16 bottom-16 flex items-center flex-wrap gap-2 rounded-xl border border-neutral-200 bg-white px-3 py-2 text-xs text-neutral-800 [transition:left_var(--gis-slide-duration)_var(--gis-slide-easing),right_var(--gis-slide-duration)_var(--gis-slide-easing)] motion-reduce:[transition:none]"
          role="status"
        >
          {dataStatus?.message ??
            (status === "loading"
              ? "Memuat peta dasar..."
              : "Sebagian peta dasar belum dapat dimuat. Periksa koneksi internet.")}
          {dataStatus?.retry || (!dataStatus && status === "error") ? (
            <Button
              size="sm"
              variant="outline"
              className="h-7 rounded-lg text-xs"
              onClick={() => {
                if (dataStatus?.retry) dataStatus.retry();
                else {
                  setStatus("loading");
                  tileLayer.current?.redraw();
                }
              }}
            >
              Coba lagi
            </Button>
          ) : null}
        </div>
      ) : null}

      <div className="gis-map-settings pointer-events-none absolute right-4 bottom-4 z-2 flex flex-col items-end gap-2 [transition:right_var(--gis-slide-duration)_var(--gis-slide-easing)] motion-reduce:[transition:none]">
        <div
          className="gis-map-controls pointer-events-auto flex flex-col gap-2 text-[var(--gis-blue)] [&_button]:w-6 [&_button]:h-6 [&_button]:p-0 [&_button]:rounded-sm [&_button]:cursor-pointer [&_button:disabled]:[opacity:.4] [&_button:disabled]:cursor-default [&_.gis-reset-map]:w-9 [&_.gis-reset-map]:h-9 [&_.gis-reset-map]:p-[6px] [&_.gis-reset-map]:rounded-xl [&_.gis-reset-map]:border [&_.gis-reset-map]:border-neutral-200"
          role="group"
          aria-label="Kontrol peta"
        >
          <div className="gis-zoom-controls flex flex-col gap-2 rounded-xl border border-neutral-200 bg-white p-[6px]">
            <Button
              variant="ghost"
              size="icon-sm"
              className="dark:hover:bg-accent"
              aria-label="Perbesar peta"
              disabled={zoom >= westJavaBasemap.maxZoom}
              onClick={() => instance.current?.zoomIn()}
            >
              <IconPlus className="size-5" aria-hidden="true" />
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              className="dark:hover:bg-accent"
              aria-label="Perkecil peta"
              disabled={zoom <= minZoom}
              onClick={() => instance.current?.zoomOut()}
            >
              <IconMinus className="size-5" aria-hidden="true" />
            </Button>
          </div>
          <Button
            variant="ghost"
            size="icon-sm"
            className="gis-reset-map bg-white dark:hover:bg-accent"
            aria-label="Kembali ke Jawa Barat"
            title="Kembali ke Jawa Barat"
            onClick={() => {
              const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
              if (reduced) instance.current?.fitBounds(westJavaBasemap.bounds, { padding: [24, 24], animate: false });
              else instance.current?.flyToBounds(westJavaBasemap.bounds, { padding: [24, 24], duration: 0.65 });
            }}
          >
            <IconCurrentLocation className="size-5" aria-hidden="true" />
          </Button>
        </div>

        {onRetryWebGL ? (
          <Button type="button" variant="outline" className="pointer-events-auto bg-white" onClick={onRetryWebGL}>
            Coba lagi Terrain / Satelit
          </Button>
        ) : null}
      </div>
    </section>
  );
}
