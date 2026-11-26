"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  IconArrowUpRight,
  IconChartBar,
  IconCloudRain,
  IconLayersIntersect,
  IconMountain,
  IconRoute,
  IconWaveSine,
} from "@tabler/icons-react";
import { AnimatePresence, useReducedMotion } from "framer-motion";
import * as m from "framer-motion/m";
import { useRegionSelection } from "@/features/regions/region-selection";
import { Button } from "@/components/ui/button";
import { AnimatedNumber, MotionDataBar, MotionReveal } from "./landing-motion";
import { TerrainDioramaCanvas, type DioramaCalloutPin } from "./terrain-diorama-canvas";
import type { DioramaCameraPose, DioramaLayerMode } from "./terrain-diorama-gl";
import { topFloodRegions } from "./flood-data";
import styles from "./landing.module.css";

interface LayerSpec {
  id: DioramaLayerMode;
  label: string;
  scope: string;
  headline: string;
  summary: string;
  legendTitle: string;
  legendItems: { label: string; color: string; detail: string }[];
  icon: typeof IconCloudRain;
  pose: DioramaCameraPose;
  defaultWaterM: number;
  activePinId: string;
}

const layerSpecs: LayerSpec[] = [
  {
    id: "susceptibility",
    label: "Kerawanan Banjir",
    scope: "627 kecamatan · Metode AHP 5 parameter",
    headline: "Pemetaan kelas kerawanan dari hulu ke cekungan hilir",
    summary:
      "Menggabungkan jarak sungai (30,1%), kemiringan lereng (26,5%), curah hujan (18,6%), elevasi HAND (16,0%), dan tutupan lahan (8,9%) langsung di atas relief 3D Jawa Barat.",
    legendTitle: "Kelas Kerawanan Dominan",
    legendItems: [
      { label: "Sangat Rendah", color: "#3cff00", detail: "Punggung lereng stabil" },
      { label: "Rendah", color: "#e1ff00", detail: "Perbukitan drainase baik" },
      { label: "Sedang", color: "#ffd000", detail: "Transisi kaki bukit" },
      { label: "Tinggi", color: "#ff6a00", detail: "Dataran aluvial sungai" },
      { label: "Sangat Tinggi", color: "#ff0000", detail: "Cekungan banjir & hilir" },
    ],
    icon: IconChartBar,
    pose: { yawDeg: -24, pitchDeg: 43, distance: 3.85, panX: 0, panZ: 0.02 },
    defaultWaterM: 0,
    activePinId: "basin",
  },
  {
    id: "flood-sim",
    label: "Simulasi Banjir (DEM)",
    scope: "Model edukatif DEM 30 m · Bangunan & penduduk",
    headline: "Simulasikan kenaikan muka air di cekungan permukiman 3D",
    summary:
      "Geser tinggi kenaikan muka air untuk melihat bagaimana cekungan berelevasi rendah mulai tergenang di sela bangunan 3D sementara kawasan perbukitan tetap kering.",
    legendTitle: "Kedalaman Genangan Simulasi",
    legendItems: [
      { label: "Dangkal (< 0,5 m)", color: "#38bdf8", detail: "Genangan tepi saluran" },
      { label: "Sedang (0,5 s.d. 2 m)", color: "#2563eb", detail: "Limpasan cekungan permukiman" },
      { label: "Dalam (> 2 m)", color: "#1e3a8a", detail: "Inti dataran aluvial rendah" },
    ],
    icon: IconLayersIntersect,
    pose: { yawDeg: 14, pitchDeg: 41, distance: 3.72, panX: -0.04, panZ: 0.04 },
    defaultWaterM: 3.5,
    activePinId: "basin",
  },
  {
    id: "rivers",
    label: "Jaringan Sungai",
    scope: "114.304 segmen sungai terpetakan",
    headline: "Koridor sungai sebagai faktor penentu utama genangan",
    summary:
      "Menelusuri jaringan sungai utama dan anak sungai yang melintasi cekungan Bandung, Bogor, hingga dataran rendah pantura Karawang, Bekasi, dan Cirebon.",
    legendTitle: "Elemen Hidrologi",
    legendItems: [
      { label: "Alur sungai utama", color: "#0284c7", detail: "Koridor debit besar" },
      { label: "Anak sungai hulu", color: "#38bdf8", detail: "Aliran kiriman lereng" },
      { label: "Zona sempadan dekat", color: "#bae6fd", detail: "Bobot AHP tertinggi (0,301)" },
    ],
    icon: IconWaveSine,
    pose: { yawDeg: -8, pitchDeg: 46, distance: 3.82, panX: 0, panZ: 0.02 },
    defaultWaterM: 0,
    activePinId: "basin",
  },
  {
    id: "rainfall",
    label: "Curah Hujan",
    scope: "27 kabupaten/kota & parameter kecamatan",
    headline: "Distribusi intensitas hujan di pegunungan hulu dan lembah",
    summary:
      "Membandingkan pola curah hujan tinggi di puncak perbukitan selatan-tengah dengan akumulasi limpasan air yang bergerak menuju cekungan hilir.",
    legendTitle: "Reklasifikasi Hujan Tahunan",
    legendItems: [
      { label: "< 2.500 mm/thn", color: "#dbeafe", detail: "Sangat Rendah" },
      { label: "2.500 s.d. 3.400 mm/thn", color: "#60a5fa", detail: "Rendah hingga Sedang" },
      { label: "> 3.400 mm/thn", color: "#1d4ed8", detail: "Tinggi hingga Sangat Tinggi" },
    ],
    icon: IconCloudRain,
    pose: { yawDeg: -34, pitchDeg: 44, distance: 3.85, panX: 0.06, panZ: -0.06 },
    defaultWaterM: 0,
    activePinId: "upstream",
  },
  {
    id: "dem",
    label: "Elevasi & Kontur 3D",
    scope: "Resolusi grid 30 m · 470 s.d. 2.318 mdpl",
    headline: "Kontras topografi pegunungan vulkanik dan cekungan dataran",
    summary:
      "Membaca ketinggian daratan dan garis kontur 3D untuk membedakan punggung bukit tangkapan hujan dengan dasar cekungan tempat air melambat.",
    legendTitle: "Rentang Elevasi Wilayah",
    legendItems: [
      { label: "Cekungan rendah (< 700 mdpl)", color: "#86efac", detail: "Rawan genangan lama" },
      { label: "Perbukitan (700 s.d. 1.200 mdpl)", color: "#4ade80", detail: "Zona transisi aliran" },
      { label: "Pegunungan (> 1.200 mdpl)", color: "#166534", detail: "Hulu tangkapan hujan" },
    ],
    icon: IconMountain,
    pose: { yawDeg: 26, pitchDeg: 39, distance: 3.82, panX: 0, panZ: 0 },
    defaultWaterM: 0,
    activePinId: "upstream",
  },
  {
    id: "evacuation",
    label: "Titik & Rute Evakuasi",
    scope: "14.338 titik evakuasi · 4 kategori fasilitas",
    headline: "Jalur evakuasi aman tampil utuh di atas bangunan 3D",
    summary:
      "Klik lokasi mana pun pada Map Interaktif untuk menghitung rute berkendara atau menemukan titik evakuasi aman terdekat di luar zona simulasi banjir.",
    legendTitle: "Simbol Navigasi Evakuasi",
    legendItems: [
      { label: "Titik awal pengguna", color: "#111827", detail: "Lokasi klik pada peta" },
      { label: "Garis panduan evakuasi aman", color: "#15803d", detail: "Utuh di atas atap 3D" },
      { label: "Lokasi evakuasi aman", color: "#2563eb", detail: "Kesehatan, pendidikan, ibadah" },
    ],
    icon: IconRoute,
    pose: { yawDeg: 34, pitchDeg: 45, distance: 3.65, panX: -0.08, panZ: 0.06 },
    defaultWaterM: 3.2,
    activePinId: "evacSafe",
  },
];

const waterQuickPresets = [
  { label: "Ringan", value: 1.5 },
  { label: "Sedang", value: 3.5 },
  { label: "Ekstrem", value: 7.0 },
];

function normalizeName(name: string) {
  return name.toLocaleLowerCase("id-ID").replace(/\s+/g, " ").trim();
}

export function InteractiveFloodRanking() {
  const { tree, toMapIds } = useRegionSelection();
  const regencies = tree[0]?.children ?? [];

  function resolveMapHref(regionName: string, shortName: string) {
    const targetFull = normalizeName(regionName);
    const targetShort = normalizeName(`kabupaten ${shortName}`);
    const match = regencies.find((node) => {
      const candidate = normalizeName(node.name);
      return candidate === targetFull || candidate === targetShort || candidate === normalizeName(shortName);
    });
    const mapId = match ? toMapIds([match.id])[0] : undefined;
    return mapId ? `/map?region=${encodeURIComponent(mapId)}` : "/map";
  }

  return (
    <ol className={styles.regionList} role="list" aria-label="Peringkat kejadian banjir">
      {topFloodRegions.map((region, i) => {
        const href = resolveMapHref(region.name, region.shortName);
        return (
          <MotionReveal as="li" key={region.code} delay={i * 0.06}>
            <Link href={href} className={styles.regionLink} aria-label={`${region.name}, ${region.count} kejadian banjir. Buka wilayah ini di Map Interaktif`}>
              <span className={styles.regionRank} aria-hidden="true">{i + 1}</span>
              <span className={styles.regionName}>
                {region.name}
                <span className={styles.regionJump}>Buka peta <IconArrowUpRight size={13} aria-hidden="true" /></span>
              </span>
              <strong className={styles.regionCount}>
                <AnimatedNumber value={region.count} delay={i * 0.06} />
                <small>kejadian</small>
              </strong>
              <div className={styles.regionBar} aria-hidden="true">
                <div style={{ width: `${(region.count / topFloodRegions[0].count) * 100}%` }}>
                  <MotionDataBar />
                </div>
              </div>
            </Link>
          </MotionReveal>
        );
      })}
    </ol>
  );
}

export function InteractiveAtlasPreview() {
  const [activeLayer, setActiveLayer] = useState<DioramaLayerMode>("susceptibility");
  const [simWaterM, setSimWaterM] = useState(3.5);
  const [pillRect, setPillRect] = useState<{ left: number; top: number; width: number; height: number } | null>(null);
  const tabListRef = useRef<HTMLDivElement>(null);
  const tabRefs = useRef<Map<DioramaLayerMode, HTMLButtonElement>>(new Map());
  const reduced = useReducedMotion();

  const current = layerSpecs.find((item) => item.id === activeLayer) ?? layerSpecs[0];

  const measureActiveTab = useCallback(() => {
    const btn = tabRefs.current.get(activeLayer);
    if (!btn) return;
    setPillRect({
      left: btn.offsetLeft,
      top: btn.offsetTop,
      width: btn.offsetWidth,
      height: btn.offsetHeight,
    });
  }, [activeLayer]);

  useEffect(() => {
    measureActiveTab();
    const list = tabListRef.current;
    if (!list) return;
    const ro = new ResizeObserver(() => measureActiveTab());
    ro.observe(list);
    return () => ro.disconnect();
  }, [measureActiveTab]);

  const effectiveWaterM = activeLayer === "flood-sim" ? simWaterM : current.defaultWaterM;

  const pins = useMemo<DioramaCalloutPin[]>(
    () => [
      { id: "upstream", badge: "01", label: "Hulu · 1.870 mdpl", anchor: "upstream", active: current.activePinId === "upstream" },
      { id: "basin", badge: "02", label: "Cekungan · 660 mdpl", anchor: "basin", active: current.activePinId === "basin" },
      { id: "evacSafe", badge: "03", label: "Evakuasi · 810 mdpl", anchor: "evacSafe", active: current.activePinId === "evacSafe" },
    ],
    [current.activePinId],
  );

  return (
    <div className={styles.atlasWorkbench} data-ui="atlas-preview">
      <div ref={tabListRef} className={styles.atlasTabs} role="tablist" aria-label="Pilih simulasi layer 3D SIBAJAWA">
        {pillRect && (
          <span
            aria-hidden="true"
            className={styles.atlasActivePill}
            style={{
              width: `${pillRect.width}px`,
              height: `${pillRect.height}px`,
              transform: `translate3d(${pillRect.left}px, ${pillRect.top}px, 0)`,
            }}
          />
        )}
        {layerSpecs.map((spec) => {
          const Icon = spec.icon;
          const active = spec.id === activeLayer;
          return (
            <button
              key={spec.id}
              ref={(el) => {
                if (el) tabRefs.current.set(spec.id, el);
                else tabRefs.current.delete(spec.id);
              }}
              type="button"
              role="tab"
              id={`atlas-tab-${spec.id}`}
              aria-selected={active}
              aria-controls={`atlas-panel-${spec.id}`}
              className={styles.atlasTab}
              data-active={active}
              onClick={() => setActiveLayer(spec.id)}
            >
              <span className={styles.atlasTabIcon} aria-hidden="true">
                <Icon size={17} stroke={1.9} />
              </span>
              <span>{spec.label}</span>
            </button>
          );
        })}
      </div>

      <div
        id={`atlas-panel-${current.id}`}
        role="tabpanel"
        aria-labelledby={`atlas-tab-${current.id}`}
        className={styles.atlasStage}
      >
        <div className={styles.atlasCanvasWrap}>
          <div className={styles.atlasCanvasBar}>
            <span className={styles.atlasTag}>
              <IconLayersIntersect size={14} aria-hidden="true" />
              Maket 3D Cekungan Bandung · {current.scope}
            </span>
          </div>

          <TerrainDioramaCanvas
            mode={activeLayer}
            targetPose={current.pose}
            waterRiseM={effectiveWaterM}
            pins={pins}
            showEvacRoute={activeLayer === "evacuation"}
            allowDragOrbit
            ariaLabel={`Maket 3D interaktif layer ${current.label} pada Cekungan Bandung dan DAS Citarum`}
            className={styles.atlasDiorama}
          />

          {activeLayer === "flood-sim" && (
            <div className={styles.atlasFloodBar}>
              <div className={styles.atlasFloodRow}>
                <label htmlFor="landing-flood-rise">
                  Kenaikan muka air: <strong>+{simWaterM.toLocaleString("id-ID", { minimumFractionDigits: 1, maximumFractionDigits: 1 })} m</strong>
                </label>
                <div className={styles.atlasFloodPresets} role="group" aria-label="Preset tinggi banjir 3D">
                  {waterQuickPresets.map((preset) => {
                    const isPreset = Math.abs(simWaterM - preset.value) < 0.05;
                    return (
                      <button
                        key={preset.value}
                        type="button"
                        aria-pressed={isPreset}
                        data-active={isPreset}
                        className={styles.atlasFloodPreset}
                        onClick={() => setSimWaterM(preset.value)}
                      >
                        {preset.label}
                      </button>
                    );
                  })}
                </div>
              </div>
              <input
                id="landing-flood-rise"
                type="range"
                min={0.5}
                max={8.0}
                step={0.5}
                value={simWaterM}
                onChange={(event) => setSimWaterM(Number(event.target.value))}
                className={styles.atlasFloodSlider}
              />
            </div>
          )}
        </div>

        <AnimatePresence mode="wait" initial={false}>
          <m.div
            key={current.id}
            className={styles.atlasDetails}
            initial={reduced ? { opacity: 0 } : { opacity: 0, transform: "translateY(6px) scale(0.985)" }}
            animate={reduced ? { opacity: 1 } : { opacity: 1, transform: "translateY(0px) scale(1)" }}
            exit={reduced ? { opacity: 0 } : { opacity: 0, transform: "translateY(-4px) scale(0.99)" }}
            transition={{ duration: reduced ? 0.12 : 0.2, ease: [0.23, 1, 0.32, 1] }}
          >
            <span className={styles.atlasScopeBadge}>{current.scope}</span>
            <h3>{current.headline}</h3>
            <p>{current.summary}</p>

            <div className={styles.atlasLegendBox}>
              <h4>{current.legendTitle}</h4>
              <ul>
                {current.legendItems.map((item) => (
                  <li key={item.label}>
                    <span className={styles.atlasSwatch} style={{ backgroundColor: item.color }} aria-hidden="true" />
                    <strong>{item.label}</strong>
                    <span>{item.detail}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className={styles.atlasCtaRow}>
              <Button asChild>
                <Link href="/map">
                  Buka di Map Interaktif <IconArrowUpRight size={16} aria-hidden="true" />
                </Link>
              </Button>
              <Link href="/analisis" className={styles.atlasSecondaryLink}>
                Lihat data analisis wilayah <IconArrowUpRight size={15} aria-hidden="true" />
              </Link>
            </div>
          </m.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
