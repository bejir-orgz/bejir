"use client";

import { useEffect, useRef, useState } from "react";
import type { Map as LeafletMap, TileLayer, LayerGroup } from "leaflet";
import Link from "next/link";
import { IconArrowUpRight, IconFocus2, IconMapPin, IconMinus, IconPlus } from "@tabler/icons-react";
import { westJavaBasemap } from "@/features/map/basemap";
import "leaflet/dist/leaflet.css";
import styles from "./landing.module.css";
import { floodRankingSource, topFloodRegions } from "./flood-data";

export function LandingMiniMap() {
  const container = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const tilesRef = useRef<TileLayer | null>(null);
  const markersRef = useRef<LayerGroup | null>(null);
  const [selected, setSelected] = useState<number | null>(null);
  const [showRegions, setShowRegions] = useState(true);
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
        map = L.map(container.current, { zoomControl: false, scrollWheelZoom: false, minZoom: westJavaBasemap.minZoom, maxZoom: westJavaBasemap.maxZoom });
        mapRef.current = map;
        map.attributionControl.setPrefix(false);
        const tiles = L.tileLayer(westJavaBasemap.tileUrl, { attribution: westJavaBasemap.attribution, maxZoom: westJavaBasemap.maxZoom, keepBuffer: 0, updateWhenIdle: true });
        tilesRef.current = tiles;
        let tileFailed = false;
        tiles.on("loading", () => { tileFailed = false; });
        tiles.on("tileerror", () => { tileFailed = true; if (!cancelled) setStatus("error"); });
        tiles.on("load", () => { if (!cancelled) setStatus(tileFailed ? "error" : "ready"); });
        tiles.addTo(map);
        const markers = L.layerGroup().addTo(map);
        markersRef.current = markers;
        topFloodRegions.forEach((region, index) => {
          // Offset neighboring labels so Karawang and Bekasi remain individually selectable.
          const iconAnchor: [number, number] = region.code === "3215" ? [0, 28] : region.code === "3216" ? [15, -10] : [15, 15];
          const marker = L.marker(region.coordinates, { title: `${region.name}: ${region.count} kejadian banjir (2024)`, alt: `Pilih ${region.name}`, icon: L.divIcon({ className: styles.cityMarker, html: `<b aria-hidden="true">${index + 1}</b>`, iconSize: [30, 30], iconAnchor }) });
          marker.bindTooltip(`${region.name} · ${region.count} kejadian (2024)`, { direction: "top", offset: [0, -12] });
          marker.on("click", () => { setSelected(index); map?.flyTo(region.coordinates, 9, { animate: !window.matchMedia("(prefers-reduced-motion: reduce)").matches }); });
          marker.addTo(markers);
        });
        map.fitBounds(westJavaBasemap.bounds, { padding: [20, 20], animate: false });
        setZoom(map.getZoom());
        map.on("zoomend", () => { if (!cancelled && map) setZoom(map.getZoom()); });
        observer = new ResizeObserver(() => map?.invalidateSize({ animate: false }));
        observer.observe(container.current);
      } catch { if (!cancelled) setStatus("error"); }
    }
    void initialize();
    return () => { cancelled = true; observer?.disconnect(); map?.remove(); mapRef.current = null; tilesRef.current = null; markersRef.current = null; };
  }, []);

  function selectRegion(index: number) {
    setSelected(index);
    mapRef.current?.flyTo(topFloodRegions[index].coordinates, 9, { animate: !window.matchMedia("(prefers-reduced-motion: reduce)").matches });
  }

  function resetView() {
    setSelected(null);
    mapRef.current?.fitBounds(westJavaBasemap.bounds, { padding: [20, 20], animate: !window.matchMedia("(prefers-reduced-motion: reduce)").matches });
  }

  function toggleRegions() {
    const map = mapRef.current;
    const markers = markersRef.current;
    if (!map || !markers) return;
    if (showRegions) map.removeLayer(markers); else markers.addTo(map);
    setShowRegions(!showRegions);
  }

  return (
    <div className={styles.mapFrame}>
      <div className={styles.mapToolbar}><span><i /> BANJIR JAWA BARAT · 2024</span><button type="button" onClick={toggleRegions} aria-pressed={showRegions} disabled={status === "loading"}>Penanda <span>{showRegions ? "Aktif" : "Nonaktif"}</span></button></div>
      <div className={styles.mapBody}>
        <div ref={container} className={styles.mapCanvas} role="region" aria-label="Peta lima kabupaten dengan kejadian banjir terbanyak di Jawa Barat pada 2024. Penanda mewakili wilayah, bukan lokasi setiap kejadian. Gunakan tombol panah untuk menggeser, serta tombol tambah dan kurang untuk zoom." />
        <div className={styles.mapControls} role="group" aria-label="Kontrol peta mini"><button type="button" aria-label="Perbesar peta mini" disabled={zoom >= westJavaBasemap.maxZoom} onClick={() => mapRef.current?.zoomIn()}><IconPlus size={19} /></button><button type="button" aria-label="Perkecil peta mini" disabled={zoom <= westJavaBasemap.minZoom} onClick={() => mapRef.current?.zoomOut()}><IconMinus size={19} /></button><button type="button" aria-label="Tampilkan seluruh Jawa Barat" onClick={resetView}><IconFocus2 size={19} /></button></div>
        {status !== "ready" && <div className={styles.mapStatus} role="status">{status === "loading" ? "Memuat peta Jawa Barat…" : <>Peta belum dapat dimuat sepenuhnya. <button type="button" onClick={() => { setStatus("loading"); if (tilesRef.current) tilesRef.current.redraw(); else window.location.reload(); }}>Coba lagi</button></>}</div>}
        <span className={styles.mapHint}>Geser untuk menjelajah · Gunakan + / − untuk zoom</span>
      </div>
      <div className={styles.mapInfo}>
        <div className="col-span-full"><span className={styles.mapInfoLabel}><IconMapPin size={13} aria-hidden="true" /> 5 DAERAH DENGAN BANJIR TERBANYAK · 2024</span><h3 aria-live="polite">{selected === null ? "Kenali riwayat wilayahnya." : `${topFloodRegions[selected].name} · ${topFloodRegions[selected].count} kejadian`}</h3></div>
        <div className="col-span-full grid grid-cols-5 gap-1.5" role="group" aria-label="Pilih kabupaten berdasarkan peringkat banjir 2024">{topFloodRegions.map((region, i) => <button type="button" key={region.code} aria-label={`Peringkat ${i + 1}, ${region.name}, ${region.count} kejadian banjir pada 2024`} aria-pressed={selected === i} onClick={() => selectRegion(i)} className={`min-w-0 rounded-lg border px-1 py-2 text-center transition-colors focus-visible:ring-2 focus-visible:ring-blue-600 ${selected === i ? "border-blue-600 bg-blue-600 text-white" : "border-neutral-200 bg-white text-neutral-600 hover:border-blue-200 hover:bg-blue-50"}`}><span className="block text-[8px] opacity-60">#{i + 1}</span><span className="mt-0.5 block truncate text-[9px] font-medium sm:text-[10px]">{region.shortName}</span><strong className="mt-1 block text-base font-medium tabular-nums">{region.count}</strong></button>)}</div>
        <small className="col-span-full text-[9px] leading-relaxed text-neutral-500">Jumlah kejadian Januari–Desember 2024. Penanda mewakili kabupaten, bukan titik kejadian. Data historis, bukan kondisi saat ini.</small>
        <a href={floodRankingSource} target="_blank" rel="noreferrer" className="!justify-self-start">BNPB · Tabel L5, hlm. 128–129 <IconArrowUpRight size={12} aria-hidden="true" /></a>
        <Link href="/map">Buka WebGIS <IconArrowUpRight size={14} aria-hidden="true" /></Link>
      </div>
    </div>
  );
}

