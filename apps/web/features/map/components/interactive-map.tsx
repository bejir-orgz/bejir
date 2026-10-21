"use client";

import { useEffect, useRef, useState } from "react";
import type { Map as LeafletMap, TileLayer } from "leaflet";
import { IconCurrentLocation, IconMinus, IconPlus } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { westJavaBasemap } from "../basemap";
import "leaflet/dist/leaflet.css";

/** Basemap only. Domain data, region geometries, and API calls do not belong here. */
export function InteractiveMap() {
  const container = useRef<HTMLDivElement>(null);
  const instance = useRef<LeafletMap | null>(null);
  const tileLayer = useRef<TileLayer | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [zoom, setZoom] = useState(7);

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
    <section className="gis-map" aria-label="Peta interaktif Jawa Barat">
      <div ref={container} className="gis-leaflet-map" aria-label="Peta dasar OpenStreetMap Jawa Barat. Gunakan tombol panah untuk menggeser serta tombol tambah dan kurang untuk zoom." />
      {status !== "ready" ? <div className="gis-map-status" role="status">
        {status === "loading" ? "Memuat peta dasar…" : "Sebagian peta dasar belum dapat dimuat. Periksa koneksi internet."}
        {status === "error" ? <Button size="sm" variant="outline" onClick={() => { setStatus("loading"); tileLayer.current?.redraw(); }}>Coba lagi</Button> : null}
      </div> : null}
      <div className="gis-map-controls" aria-label="Kontrol peta">
        <div className="gis-zoom-controls">
          <Button variant="ghost" size="icon-sm" aria-label="Perbesar peta" disabled={zoom >= westJavaBasemap.maxZoom} onClick={() => instance.current?.zoomIn()}><IconPlus className="size-6" aria-hidden="true" /></Button>
          <Button variant="ghost" size="icon-sm" aria-label="Perkecil peta" disabled={zoom <= westJavaBasemap.minZoom} onClick={() => instance.current?.zoomOut()}><IconMinus className="size-6" aria-hidden="true" /></Button>
        </div>
        <Button variant="ghost" size="icon-sm" className="gis-reset-map" aria-label="Kembali ke Jawa Barat" title="Kembali ke Jawa Barat, tanpa akses lokasi perangkat" onClick={() => instance.current?.fitBounds(westJavaBasemap.bounds, { padding: [24, 24] })}><IconCurrentLocation className="size-6" aria-hidden="true" /></Button>
      </div>
      <p className="gis-map-disclaimer">Jawa Barat · Peta dasar OSM · Statistik dummy</p>
    </section>
  );
}
