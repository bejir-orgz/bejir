"use client";

import { useState } from "react";
import Link from "next/link";
import {
  IconArrowUpRight,
  IconChartBar,
  IconCloudRain,
  IconLayersIntersect,
  IconMountain,
  IconPlayerPause,
  IconPlayerPlay,
  IconRoute,
  IconWaveSine,
} from "@tabler/icons-react";
import { useReducedMotion } from "framer-motion";
import { useRegionSelection } from "@/features/regions/region-selection";
import { Button } from "@/components/ui/button";
import { AnimatedNumber, MotionDataBar, MotionReveal } from "./landing-motion";
import { topFloodRegions } from "./flood-data";
import styles from "./landing.module.css";

type LayerKey = "susceptibility" | "rivers" | "rainfall" | "dem" | "evacuation";

interface LayerSpec {
  id: LayerKey;
  label: string;
  scope: string;
  headline: string;
  summary: string;
  legendTitle: string;
  legendItems: { label: string; color: string; detail: string }[];
  icon: typeof IconCloudRain;
}

const layerSpecs: LayerSpec[] = [
  {
    id: "susceptibility",
    label: "Kerawanan Banjir",
    scope: "627 kecamatan · Metode AHP 5 parameter",
    headline: "Pemetaan kelas kerawanan dari hulu ke cekungan hilir",
    summary: "Menggabungkan jarak sungai (30,1%), kemiringan lereng (26,5%), curah hujan (18,6%), elevasi HAND (16,0%), dan tutupan lahan (8,9%) untuk memetakan tingkat kerentanan tiap kecamatan.",
    legendTitle: "Kelas Kerawanan Dominan",
    legendItems: [
      { label: "Sangat Rendah", color: "#3cff00", detail: "Punggung lereng stabil" },
      { label: "Rendah", color: "#e1ff00", detail: "Perbukitan drainase baik" },
      { label: "Sedang", color: "#ffd000", detail: "Transisi kaki bukit" },
      { label: "Tinggi", color: "#ff6a00", detail: "Dataran aluvial sungai" },
      { label: "Sangat Tinggi", color: "#ff0000", detail: "Cekungan banjir & hilir" },
    ],
    icon: IconChartBar,
  },
  {
    id: "rivers",
    label: "Jaringan Sungai",
    scope: "~114.000 segmen sungai terpetakan",
    headline: "Koridor sungai sebagai faktor penentu utama genangan",
    summary: "Menelusuri jaringan sungai utama dan anak sungai yang melintasi cekungan Bandung, Bogor, hingga dataran rendah pantura Karawang, Bekasi, dan Cirebon.",
    legendTitle: "Elemen Hidrologi",
    legendItems: [
      { label: "Alur sungai utama", color: "#0284c7", detail: "Koridor debit besar" },
      { label: "Anak sungai hulu", color: "#38bdf8", detail: "Aliran kiriman lereng" },
      { label: "Zona sempadan dekat", color: "#bae6fd", detail: "Bobot AHP tertinggi (0,301)" },
    ],
    icon: IconWaveSine,
  },
  {
    id: "rainfall",
    label: "Curah Hujan",
    scope: "27 kabupaten/kota & parameter kecamatan",
    headline: "Distribusi intensitas hujan bulanan dan tahunan",
    summary: "Membandingkan pola curah hujan tinggi di wilayah perbukitan selatan-tengah dengan akumulasi limpasan air menuju wilayah hilir.",
    legendTitle: "Reklasifikasi Hujan Tahunan",
    legendItems: [
      { label: "< 2.500 mm/thn", color: "#dbeafe", detail: "Sangat Rendah" },
      { label: "2.500 s.d. 3.400 mm/thn", color: "#60a5fa", detail: "Rendah hingga Sedang" },
      { label: "> 3.400 mm/thn", color: "#1d4ed8", detail: "Tinggi hingga Sangat Tinggi" },
    ],
    icon: IconCloudRain,
  },
  {
    id: "dem",
    label: "Elevasi (DEM)",
    scope: "Resolusi grid 30 m · EPSG:32748",
    headline: "Kontras topografi pegunungan vulkanik dan dataran rendah",
    summary: "Membaca ketinggian rata-rata wilayah dari pesisir utara (14 mdpl) hingga dataran tinggi priangan (>1.200 mdpl) untuk mengenali cekungan akumulasi air.",
    legendTitle: "Rentang Elevasi Wilayah",
    legendItems: [
      { label: "Dataran rendah (< 50 mdpl)", color: "#86efac", detail: "Rawan genangan lama" },
      { label: "Perbukitan (50 s.d. 500 mdpl)", color: "#4ade80", detail: "Zona transisi aliran" },
      { label: "Pegunungan (> 500 mdpl)", color: "#166534", detail: "Hulu tangkapan hujan" },
    ],
    icon: IconMountain,
  },
  {
    id: "evacuation",
    label: "Titik & Rute Evakuasi",
    scope: "Pencarian rute berkendara terdekat di peta",
    headline: "Temukan titik evakuasi dan estimasi rute dari lokasi pilih",
    summary: "Klik titik mana saja pada Map Interaktif saat layer evakuasi aktif untuk menghitung jarak dan waktu tempuh menuju fasilitas evakuasi terdekat yang dapat dijangkau.",
    legendTitle: "Simbol Navigasi Evakuasi",
    legendItems: [
      { label: "Titik awal pengguna", color: "#111827", detail: "Lokasi klik pada peta" },
      { label: "Jalur evakuasi terdekat", color: "#2563eb", detail: "Estimasi jarak & menit" },
      { label: "Lokasi evakuasi", color: "#16a34a", detail: "Fasilitas terdata API" },
    ],
    icon: IconRoute,
  },
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
  const [activeLayer, setActiveLayer] = useState<LayerKey>("susceptibility");
  const reduced = useReducedMotion();
  const [flowPaused, setFlowPaused] = useState(false);
  const current = layerSpecs.find((item) => item.id === activeLayer) ?? layerSpecs[0];
  const animateFlow = !reduced && !flowPaused;

  return (
    <div className={styles.atlasWorkbench} data-ui="atlas-preview">
      <div className={styles.atlasTabs} role="tablist" aria-label="Pilih simulasi layer SIBAJAWA">
        {layerSpecs.map((spec) => {
          const Icon = spec.icon;
          const active = spec.id === activeLayer;
          return (
            <button
              key={spec.id}
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
                <Icon size={18} stroke={1.9} />
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
              Pratinjau Konsep Layer · {current.scope}
            </span>
            {!reduced && (activeLayer === "rivers" || activeLayer === "evacuation") && (
              <button
                type="button"
                className={styles.atlasPauseBtn}
                onClick={() => setFlowPaused((prev) => !prev)}
                aria-pressed={flowPaused}
              >
                {flowPaused ? <IconPlayerPlay size={13} aria-hidden="true" /> : <IconPlayerPause size={13} aria-hidden="true" />}
                <span>{flowPaused ? "Putar aliran" : "Jeda aliran"}</span>
              </button>
            )}
          </div>

          <svg
            viewBox="0 0 640 360"
            className={styles.atlasSvg}
            role="img"
            aria-label={`Ilustrasi skematik layer ${current.label} pada cekungan wilayah Jawa Barat`}
          >
            <defs>
              <pattern id="atlas-grid" width="32" height="32" patternUnits="userSpaceOnUse">
                <path d="M 32 0 L 0 0 0 32" fill="none" stroke="#dbe7f6" strokeWidth="0.75" />
              </pattern>
            </defs>

            <rect width="640" height="360" fill="#f4f8fd" />
            <rect width="640" height="360" fill="url(#atlas-grid)" opacity="0.55" />

            {/* Garis pantai utara Jawa Barat */}
            <path d="M0 0 H640 V74 Q520 92 410 68 T190 82 Q88 90 0 64 Z" fill="#dbeafe" opacity="0.7" />
            <text x="24" y="34" fill="#2563eb" fontSize="11" fontWeight="500" opacity="0.8">Laut Jawa (Pantura)</text>

            {/* Layer DEM / Topografi */}
            <g opacity={activeLayer === "dem" ? 0.95 : 0.22} style={{ transition: "opacity 220ms cubic-bezier(0.23, 1, 0.32, 1)" }}>
              <path d="M0 64 Q88 90 190 82 T410 68 Q520 92 640 74 V165 Q480 148 320 168 T0 154 Z" fill="#bbf7d0" />
              <path d="M0 154 Q160 184 320 168 T640 165 V258 Q460 238 290 262 T0 248 Z" fill="#4ade80" opacity="0.75" />
              <path d="M0 248 Q150 278 290 262 T640 258 V360 H0 Z" fill="#166534" opacity="0.82" />
              {activeLayer === "dem" && (
                <g fill="#0f172a" fontSize="11" fontWeight="600">
                  <text x="450" y="122">Dataran Pantura (14 s.d. 35 mdpl)</text>
                  <text x="388" y="216">Cekungan Tengah (400 s.d. 750 mdpl)</text>
                  <text x="382" y="316" fill="#ffffff">Pegunungan Hulu (&gt;1.200 mdpl)</text>
                </g>
              )}
            </g>

            {/* Layer Curah Hujan */}
            <g opacity={activeLayer === "rainfall" ? 0.95 : 0} style={{ transition: "opacity 220ms cubic-bezier(0.23, 1, 0.32, 1)" }}>
              <ellipse cx="185" cy="272" rx="145" ry="74" fill="#1d4ed8" opacity="0.78" />
              <ellipse cx="355" cy="224" rx="165" ry="78" fill="#3b82f6" opacity="0.62" />
              <ellipse cx="470" cy="138" rx="150" ry="62" fill="#93c5fd" opacity="0.65" />
              <g fill="#ffffff" fontSize="11" fontWeight="600">
                <text x="108" y="276">Bogor &amp; Sukabumi (&gt;3.900 mm/thn)</text>
                <text x="292" y="226">Cekungan Bandung (~2.800 mm/thn)</text>
              </g>
              <text x="386" y="138" fill="#1e3a8a" fontSize="11" fontWeight="600">Karawang &amp; Indramayu (&lt;2.500 mm/thn)</text>
            </g>

            {/* Layer Kerawanan Banjir (Poligon Kecamatan Skematik) */}
            <g opacity={activeLayer === "susceptibility" ? 0.92 : 0.14} style={{ transition: "opacity 220ms cubic-bezier(0.23, 1, 0.32, 1)" }}>
              <polygon points="78,86 196,80 212,138 92,146" fill="#ff0000" stroke="#ffffff" strokeWidth="1.5" />
              <polygon points="196,80 332,72 344,136 212,138" fill="#ff6a00" stroke="#ffffff" strokeWidth="1.5" />
              <polygon points="332,72 478,78 462,142 344,136" fill="#ff0000" stroke="#ffffff" strokeWidth="1.5" />
              <polygon points="92,146 212,138 228,208 106,214" fill="#ffd000" stroke="#ffffff" strokeWidth="1.5" />
              <polygon points="212,138 356,136 368,214 228,208" fill="#ff6a00" stroke="#ffffff" strokeWidth="1.5" />
              <polygon points="356,136 488,144 476,218 368,214" fill="#e1ff00" stroke="#ffffff" strokeWidth="1.5" />
              <polygon points="106,214 248,208 258,288 118,296" fill="#e1ff00" stroke="#ffffff" strokeWidth="1.5" />
              <polygon points="248,208 392,214 404,294 258,288" fill="#3cff00" stroke="#ffffff" strokeWidth="1.5" />
              {activeLayer === "susceptibility" && (
                <g fontSize="11" fontWeight="600" fill="#111111">
                  <rect x="104" y="102" width="76" height="20" rx="5" fill="#ffffffeb" />
                  <text x="112" y="116">Bekasi · Tinggi</text>
                  <rect x="358" y="96" width="96" height="20" rx="5" fill="#ffffffeb" />
                  <text x="366" y="110">Karawang · Tinggi</text>
                  <rect x="242" y="164" width="104" height="20" rx="5" fill="#ffffffeb" />
                  <text x="250" y="178">Cekungan Bandung</text>
                </g>
              )}
            </g>

            {/* Jaringan Sungai Utama (Selalu terlihat tipis sebagai referensi, tegas saat Rivers aktif) */}
            <g opacity={activeLayer === "rivers" ? 1 : 0.5} style={{ transition: "opacity 220ms cubic-bezier(0.23, 1, 0.32, 1)" }}>
              <path d="M298 332 C284 274 282 222 254 176 C226 132 184 112 162 76" fill="none" stroke="#0284c7" strokeWidth={activeLayer === "rivers" ? 4 : 2} strokeLinecap="round" />
              <path d="M446 322 C432 268 404 214 398 158 C394 118 416 96 422 70" fill="none" stroke="#0284c7" strokeWidth={activeLayer === "rivers" ? 3.5 : 1.8} strokeLinecap="round" />
              <path d="M168 314 C162 262 142 208 118 156 C104 124 96 98 88 74" fill="none" stroke="#0284c7" strokeWidth={activeLayer === "rivers" ? 3 : 1.6} strokeLinecap="round" />
              {activeLayer === "rivers" && (
                <>
                  <path d="M298 332 C284 274 282 222 254 176 C226 132 184 112 162 76" fill="none" stroke="#e0f2fe" strokeWidth="2" className={animateFlow ? "gis-river-flow" : undefined} />
                  <path d="M446 322 C432 268 404 214 398 158 C394 118 416 96 422 70" fill="none" stroke="#e0f2fe" strokeWidth="2" className={animateFlow ? "gis-river-flow" : undefined} />
                  <path d="M168 314 C162 262 142 208 118 156 C104 124 96 98 88 74" fill="none" stroke="#e0f2fe" strokeWidth="1.8" className={animateFlow ? "gis-river-flow" : undefined} />
                  <g fontSize="11" fontWeight="600" fill="#0c4a6e">
                    <rect x="256" y="196" width="84" height="20" rx="5" fill="#ffffffeb" />
                    <text x="264" y="210">DAS Citarum</text>
                    <rect x="408" y="166" width="90" height="20" rx="5" fill="#ffffffeb" />
                    <text x="416" y="180">DAS Cimanuk</text>
                  </g>
                </>
              )}
            </g>

            {/* Layer Evakuasi & Rute */}
            {activeLayer === "evacuation" && (
              <g>
                <circle cx="236" cy="142" r="28" fill="#ef4444" opacity="0.16" />
                <path d="M236 142 L268 158 L302 152 L338 176 L372 192" fill="none" stroke="#ffffff" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M236 142 L268 158 L302 152 L338 176 L372 192" fill="none" stroke="#2563eb" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" className={animateFlow ? "gis-route-flow" : undefined} />
                <circle cx="236" cy="142" r="7" fill="#ffffff" stroke="#111827" strokeWidth="3" />
                <circle cx="372" cy="192" r="9" fill="#16a34a" stroke="#ffffff" strokeWidth="2.5" />
                <circle cx="152" cy="198" r="6" fill="#ffffff" stroke="#2563eb" strokeWidth="2" />
                <circle cx="468" cy="154" r="6" fill="#ffffff" stroke="#2563eb" strokeWidth="2" />
                <rect x="246" y="106" width="154" height="24" rx="7" fill="#172554" />
                <text x="256" y="122" fill="#ffffff" fontSize="11" fontWeight="500">Rute terdekat · 3,4 km · 8 mnt</text>
                <rect x="358" y="208" width="136" height="22" rx="6" fill="#ffffff" stroke="#bbf7d0" />
                <text x="366" y="223" fill="#14532d" fontSize="11" fontWeight="600">Pos Evakuasi Kecamatan</text>
              </g>
            )}
          </svg>
        </div>

        <div className={styles.atlasDetails}>
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
        </div>
      </div>
    </div>
  );
}
