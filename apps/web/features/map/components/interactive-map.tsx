"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import type { Map as LeafletMap, TileLayer } from "leaflet";
import { IconCurrentLocation, IconMinus, IconPlus } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { westJavaBasemap } from "../basemap";
import "leaflet/dist/leaflet.css";

/** Owns map lifecycle; domain layers are composed by the workspace. */
export function InteractiveMap({ children, dataStatus }: {
  children?: (map: LeafletMap) => ReactNode;
  dataStatus?: { message: string; retry?: () => void };
}) {
  const container = useRef<HTMLDivElement>(null);
  const instance = useRef<LeafletMap | null>(null);
  const tileLayer = useRef<TileLayer | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [zoom, setZoom] = useState(7);
  const [readyMap, setReadyMap] = useState<LeafletMap | null>(null);

  useEffect(() => {
    let cancelled = false;
    let map: LeafletMap | undefined;
    let observer: ResizeObserver | undefined;

    async function initialize() {
      try {
        const L = await import("leaflet");
        if (cancelled || !container.current) return;
        map = L.map(container.current, { zoomControl: false, minZoom: westJavaBasemap.minZoom, maxZoom: westJavaBasemap.maxZoom, attributionControl: true });
        instance.current = map;
        setReadyMap(map);
        map.attributionControl.setPrefix(false);
        const tiles = L.tileLayer(westJavaBasemap.tileUrl, {
          attribution: westJavaBasemap.attribution,
          maxZoom: westJavaBasemap.maxZoom,
          // Load only the visible viewport; let the browser honor normal tile caching.
          keepBuffer: 0,
          updateWhenIdle: true,
        });
        tileLayer.current = tiles;
        tiles.on("tileerror", () => { if (!cancelled) setStatus("error"); });
        tiles.on("tileload", () => { if (!cancelled) setStatus("ready"); });
        tiles.addTo(map);
        map.fitBounds(westJavaBasemap.bounds, { padding: [24, 24], animate: false });
        setZoom(map.getZoom());
        map.on("zoomend", () => { if (!cancelled && map) setZoom(map.getZoom()); });
        observer = new ResizeObserver(() => map?.invalidateSize({ pan: true, animate: false }));
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
    <section className="gis-map absolute [inset:0] overflow-hidden bg-[#e8eee6] [&_.leaflet-control-attribution]:[font:10px/16px_var(--font-google-sans-flex),Arial,sans-serif]! [&_.leaflet-control-attribution]:bg-[#fffffff2]! [&_:is(.leaflet-bar,.leaflet-control-layers,.leaflet-popup-content-wrapper,.leaflet-popup-tip,.leaflet-tooltip)]:shadow-none! [&_.leaflet-control-scale-line]:[text-shadow:none]! max-[999.01px]:[inset:0]" aria-label="Peta interaktif Jawa Barat">
      <div ref={container} className="gis-leaflet-map absolute! [inset:0]! z-0! [font-family:inherit]!" aria-label="Peta dasar OpenStreetMap Jawa Barat. Gunakan tombol panah untuk menggeser serta tombol tambah dan kurang untuk zoom." />
      {readyMap ? children?.(readyMap) : null}
      {dataStatus || status !== "ready" ? <div className="gis-map-status absolute z-1 left-[calc(var(--regions-width,0px)_+_16px)] right-16 bottom-16 flex items-center flex-wrap gap-2 p-2 rounded-lg bg-[white] text-[12px] [transition:left_var(--gis-slide-duration)_var(--gis-slide-easing),right_var(--gis-slide-duration)_var(--gis-slide-easing)] motion-reduce:[transition:none]" role="status">
        {dataStatus?.message ?? (status === "loading" ? "Memuat peta dasar…" : "Sebagian peta dasar belum dapat dimuat. Periksa koneksi internet.")}
        {dataStatus?.retry || (!dataStatus && status === "error") ? <Button size="sm" variant="outline" onClick={() => { if (dataStatus?.retry) dataStatus.retry(); else { setStatus("loading"); tileLayer.current?.redraw(); } }}>Coba lagi</Button> : null}
      </div> : null}
      <div className="gis-map-controls absolute z-1 bottom-4 right-4 [transition:right_var(--gis-slide-duration)_var(--gis-slide-easing)] motion-reduce:[transition:none] flex flex-col gap-2 text-[var(--gis-blue)] [&_button]:w-6 [&_button]:h-6 [&_button]:p-0 [&_button]:rounded-sm [&_button]:cursor-pointer [&_button:disabled]:[opacity:.4] [&_button:disabled]:cursor-default [&_.gis-reset-map]:w-9 [&_.gis-reset-map]:h-9 [&_.gis-reset-map]:p-[6px] [&_.gis-reset-map]:rounded-lg [&_.gis-reset-map]:bg-[white]" aria-label="Kontrol peta">
        <div className="gis-zoom-controls flex flex-col gap-2 p-[6px] rounded-lg bg-[white]">
          <Button variant="ghost" size="icon-sm" aria-label="Perbesar peta" disabled={zoom >= westJavaBasemap.maxZoom} onClick={() => instance.current?.zoomIn()}><IconPlus className="size-6" aria-hidden="true" /></Button>
          <Button variant="ghost" size="icon-sm" aria-label="Perkecil peta" disabled={zoom <= westJavaBasemap.minZoom} onClick={() => instance.current?.zoomOut()}><IconMinus className="size-6" aria-hidden="true" /></Button>
        </div>
        <Button variant="ghost" size="icon-sm" className="gis-reset-map" aria-label="Kembali ke Jawa Barat" title="Kembali ke Jawa Barat, tanpa akses lokasi perangkat" onClick={() => instance.current?.fitBounds(westJavaBasemap.bounds, { padding: [24, 24] })}><IconCurrentLocation className="size-6" aria-hidden="true" /></Button>
      </div>
      <p className="gis-map-disclaimer absolute z-1 left-2 bottom-6 max-w-[calc(100%_-_64px)] p-[4px_8px] rounded-sm text-[10px] leading-[16px] bg-[#fffffff2] text-[#525252] pointer-events-none">Jawa Barat · Peta dasar OSM · Data backend</p>
    </section>
  );
}
