"use client";

import { useState } from "react";
import {
  IconAlertTriangle,
  IconCloudRain,
  IconLayersIntersect,
  IconPlayerPause,
  IconPlayerPlay,
  IconShieldCheck,
  IconX,
} from "@tabler/icons-react";
import { useReducedMotion } from "framer-motion";
import { Button } from "@/components/ui/button";

type SimTab = "flood" | "landslide";
type SlopePreset = "gentle" | "moderate" | "steep";

const slopeAngles: Record<SlopePreset, { label: string; deg: number; factor: number }> = {
  gentle: { label: "Landai (8°)", deg: 8, factor: 0.45 },
  moderate: { label: "Curam (24°)", deg: 24, factor: 0.85 },
  steep: { label: "Sangat Curam (38°)", deg: 38, factor: 1.25 },
};

export function HydroSimulationPanel({
  open,
  overviewOpen,
  onClose,
  elevationLabel,
  susceptibilityLabel,
}: {
  open: boolean;
  overviewOpen: boolean;
  onClose: () => void;
  elevationLabel: string;
  susceptibilityLabel: string;
}) {
  const reduced = useReducedMotion();
  const [tab, setTab] = useState<SimTab>("flood");
  const [rainfall, setRainfall] = useState(95);
  const [slope, setSlope] = useState<SlopePreset>("moderate");
  const [paused, setPaused] = useState(false);

  if (!open) return null;

  const isRunning = !reduced && !paused;
  const rainRatio = (rainfall - 20) / 160; // 0 .. 1
  // Water rises from y=148 (low) up to y=96 (high flood stage) in SVG coordinates
  const waterLevelY = Math.round(148 - rainRatio * 50);
  const floodStage =
    rainfall < 65
      ? { label: "Aliran Normal di Dalam Alur", tone: "bg-emerald-100 text-emerald-900 border-emerald-300" }
      : rainfall < 120
        ? { label: "Meluap ke Sempadan & Bantaran", tone: "bg-amber-100 text-amber-900 border-amber-300" }
        : { label: "Genangan Cekungan Permukiman", tone: "bg-red-100 text-red-900 border-red-300" };

  const slopeMeta = slopeAngles[slope];
  const saturationIndex = Math.min(100, Math.round(rainRatio * 78 * slopeMeta.factor + (slope === "steep" ? 22 : 10)));
  const slideOffset = saturationIndex > 55 ? Math.round(((saturationIndex - 55) / 45) * 34) : 0;
  const slopeStage =
    saturationIndex < 45
      ? { label: "Lereng Stabil · Pori Tanah Belum Jenuh", tone: "bg-emerald-100 text-emerald-900 border-emerald-300" }
      : saturationIndex < 72
        ? { label: "Waspada Kejenuhan · Retakan Permukaan", tone: "bg-amber-100 text-amber-900 border-amber-300" }
        : { label: "Potensi Pergerakan Material Tanah", tone: "bg-red-100 text-red-900 border-red-300" };

  return (
    <section
      id="gis-hydro-simulation-panel"
      role="dialog"
      aria-modal="false"
      aria-labelledby="gis-sim-title"
      className={`gis-sim-panel absolute bottom-14 left-3 right-3 z-4 mx-auto w-[min(548px,calc(100vw-24px))] rounded-2xl border border-neutral-300 bg-white p-4 text-neutral-900 transition-[opacity,transform,right] duration-200 ease-[var(--ease-out-strong)] starting:scale-96 starting:opacity-0 max-[999.01px]:bottom-12 max-[999.01px]:p-3.5 ${
        overviewOpen ? "min-[1000px]:left-16 min-[1000px]:right-[calc(var(--overview-width)+64px)]" : "min-[1000px]:left-16 min-[1000px]:right-16"
      }`}
    >
      <div className="flex items-start justify-between gap-3 border-b border-neutral-200 pb-3">
        <div className="min-w-0">
          <span className="inline-flex items-center gap-1.5 rounded-md border border-amber-300 bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-900">
            <IconAlertTriangle className="size-3.5 shrink-0" aria-hidden="true" />
            SIMULASI EDUKATIF · BUKAN KONDISI BENCANA AKTUAL
          </span>
          <h2 id="gis-sim-title" className="mt-1.5 text-base leading-6 font-semibold text-neutral-900">
            Laboratorium Konsep Banjir Cekungan &amp; Stabilitas Lereng
          </h2>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          {!reduced && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              aria-pressed={paused}
              aria-label={paused ? "Putar animasi simulasi" : "Jeda animasi simulasi"}
              onClick={() => setPaused((prev) => !prev)}
            >
              {paused ? <IconPlayerPlay className="size-3.5" aria-hidden="true" /> : <IconPlayerPause className="size-3.5" aria-hidden="true" />}
              <span>{paused ? "Putar" : "Jeda"}</span>
            </Button>
          )}
          <Button type="button" variant="ghost" size="icon-sm" aria-label="Tutup panel simulasi edukatif" onClick={onClose}>
            <IconX className="size-4" aria-hidden="true" />
          </Button>
        </div>
      </div>

      <div className="mt-3 flex gap-2" role="tablist" aria-label="Mode simulasi hidro-geologi">
        <button
          type="button"
          role="tab"
          aria-selected={tab === "flood"}
          className={`flex-1 cursor-pointer rounded-xl border px-3 py-2 text-xs font-semibold transition-colors ${
            tab === "flood" ? "border-blue-600 bg-blue-600 text-white" : "border-neutral-200 bg-neutral-50 text-neutral-700 hover:bg-blue-50"
          }`}
          onClick={() => setTab("flood")}
        >
          <span className="inline-flex items-center gap-1.5">
            <IconCloudRain className="size-4" aria-hidden="true" />
            Genangan Banjir Cekungan
          </span>
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === "landslide"}
          className={`flex-1 cursor-pointer rounded-xl border px-3 py-2 text-xs font-semibold transition-colors ${
            tab === "landslide" ? "border-blue-600 bg-blue-600 text-white" : "border-neutral-200 bg-neutral-50 text-neutral-700 hover:bg-blue-50"
          }`}
          onClick={() => setTab("landslide")}
        >
          <span className="inline-flex items-center gap-1.5">
            <IconLayersIntersect className="size-4" aria-hidden="true" />
            Pergerakan Tanah &amp; Lereng
          </span>
        </button>
      </div>

      <div className="mt-3 rounded-xl border border-neutral-200 bg-[#f4f8fd] p-2.5">
        {tab === "flood" ? (
          <svg
            viewBox="0 0 520 190"
            className="block h-auto w-full rounded-lg bg-gradient-to-b from-[#e0effe] to-[#f8fbff]"
            role="img"
            aria-label={`Penampang simulasi banjir dengan curah hujan skenario ${rainfall} milimeter per hari, status ${floodStage.label}`}
          >
            {/* Hujan turun proporsional */}
            <g stroke="#3b82f6" strokeWidth="1.5" strokeLinecap="round" opacity={0.25 + rainRatio * 0.55}>
              {[38, 86, 134, 182, 230, 278, 326, 374, 422, 470].map((x, idx) => (
                <line
                  key={x}
                  x1={x}
                  y1={12 + (idx % 3) * 10}
                  x2={x - 6}
                  y2={28 + (idx % 3) * 10}
                  className={isRunning ? "gis-river-flow" : undefined}
                />
              ))}
            </g>

            {/* Bukit jauh */}
            <path d="M0 132 Q90 88 180 124 T380 116 T520 128 V190 H0 Z" fill="#cbd5e1" opacity="0.5" />

            {/* Permukiman bantaran & dataran tinggi aman */}
            <g>
              {/* Rumah di sempadan rendah */}
              <rect x="132" y="108" width="28" height="22" rx="2" fill="#ffffff" stroke="#475569" strokeWidth="1.5" />
              <polygon points="129,108 146,95 163,108" fill="#ef4444" />
              <rect x="348" y="106" width="30" height="24" rx="2" fill="#ffffff" stroke="#475569" strokeWidth="1.5" />
              <polygon points="345,106 363,92 381,106" fill="#f97316" />

              {/* Pos aman di teras tinggi */}
              <rect x="446" y="76" width="34" height="24" rx="2" fill="#ffffff" stroke="#15803d" strokeWidth="1.5" />
              <polygon points="443,76 463,62 483,76" fill="#16a34a" />
              <text x="434" y="56" fontSize="10" fontWeight="600" fill="#14532d">Teras Tinggi</text>
            </g>

            {/* Massa Air & Gelombang Dinamis */}
            <g
              style={{
                transform: `translateY(${waterLevelY - 148}px)`,
                transition: reduced ? "none" : "transform 260ms cubic-bezier(0.23, 1, 0.32, 1)",
              }}
            >
              <path
                d="M0 148 Q65 142 130 148 T260 148 T390 148 T520 148 V245 H0 Z"
                fill="#2563eb"
                opacity="0.76"
              />
              <path
                d="M0 151 Q65 156 130 151 T260 151 T390 151 T520 151"
                fill="none"
                stroke="#bae6fd"
                strokeWidth="2.5"
                className={isRunning ? "gis-river-flow" : undefined}
              />
            </g>

            {/* Penampang Tanah & Alur Sungai Cekung */}
            <path
              d="M0 112 L96 116 L124 130 L196 130 L226 164 L294 164 L322 130 L402 130 L432 100 L520 100 V190 H0 Z"
              fill="#64748b"
            />
            <path
              d="M0 112 L96 116 L124 130 L196 130 L226 164 L294 164 L322 130 L402 130 L432 100 L520 100"
              fill="none"
              stroke="#334155"
              strokeWidth="2.5"
            />
            <text x="233" y="180" fontSize="10" fontWeight="600" fill="#f8fafc">Alur Sungai</text>
            <text x="122" y="145" fontSize="10" fontWeight="600" fill="#f8fafc">Dataran Banjir</text>
          </svg>
        ) : (
          <svg
            viewBox="0 0 520 190"
            className="block h-auto w-full rounded-lg bg-gradient-to-b from-[#e0effe] to-[#f8fbff]"
            role="img"
            aria-label={`Penampang simulasi stabilitas lereng ${slopeMeta.label} pada curah hujan ${rainfall} milimeter per hari, status ${slopeStage.label}`}
          >
            {/* Hujan meresap ke pori tanah */}
            <g stroke="#3b82f6" strokeWidth="1.5" strokeLinecap="round" opacity={0.25 + rainRatio * 0.55}>
              {[60, 110, 160, 210, 260, 310, 360].map((x, idx) => (
                <line
                  key={x}
                  x1={x}
                  y1={10 + (idx % 2) * 12}
                  x2={x - 5}
                  y2={26 + (idx % 2) * 12}
                  className={isRunning ? "gis-river-flow" : undefined}
                />
              ))}
            </g>

            {/* Batuan Dasar Stabil (Bedrock) */}
            <path d="M0 64 L148 64 L374 168 L520 168 V190 H0 Z" fill="#475569" />
            <text x="28" y="176" fontSize="10" fontWeight="600" fill="#e2e8f0">Batuan Dasar Kedap</text>

            {/* Bidang Gelincir (Slip Surface) */}
            <line
              x1="146"
              y1="64"
              x2="374"
              y2="168"
              stroke="#f59e0b"
              strokeWidth="2.5"
              strokeDasharray="6 5"
            />
            <text x="196" y="118" fontSize="10" fontWeight="600" fill="#fef3c7" transform="rotate(24 196 118)">
              Bidang Gelincir
            </text>

            {/* Massa Tanah Atas Lereng yang Bergerak saat Jenuh */}
            <g
              style={{
                transform: `translate(${slideOffset}px, ${Math.round(slideOffset * 0.45)}px)`,
                transition: reduced ? "none" : "transform 300ms cubic-bezier(0.23, 1, 0.32, 1)",
              }}
            >
              <polygon
                points="146,64 236,64 366,154 342,154"
                fill={saturationIndex >= 72 ? "#92400e" : "#a16207"}
                opacity="0.92"
              />
              {/* Zona Jenuh Air Pori */}
              <polygon
                points="146,64 190,64 360,154 342,154"
                fill="#2563eb"
                opacity={Math.min(0.65, saturationIndex / 135)}
              />
              {/* Vegetasi kecil di atas massa tanah */}
              <circle cx="204" cy="54" r="8" fill="#16a34a" />
              <line x1="204" y1="62" x2="204" y2="66" stroke="#14532d" strokeWidth="2" />
            </g>

            {/* Retakan mahkota lereng ketika mendekati jenuh */}
            {saturationIndex >= 48 && (
              <path d="M144 48 L149 56 L145 64" fill="none" stroke="#dc2626" strokeWidth="2" />
            )}

            {/* Permukaan Puncak Bukit Kiri & Kaki Lereng Kanan */}
            <polygon points="0,46 146,46 146,64 0,64" fill="#15803d" />
            <rect x="416" y="144" width="32" height="24" rx="2" fill="#ffffff" stroke="#334155" strokeWidth="1.5" />
            <polygon points="413,144 432,130 451,144" fill="#dc2626" />
            <text x="398" y="124" fontSize="10" fontWeight="600" fill="#1e293b">Area Kaki Lereng</text>
          </svg>
        )}
      </div>

      <div className="mt-3 flex flex-col gap-2.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <label htmlFor="gis-sim-rainfall" className="text-xs font-semibold text-neutral-800">
            Intensitas Hujan Skenario: <span className="text-blue-700 tabular-nums">{rainfall} mm/hari</span>
          </label>
          <span
            className={`inline-flex items-center rounded-lg border px-2 py-0.5 text-[11px] font-semibold ${
              tab === "flood" ? floodStage.tone : slopeStage.tone
            }`}
          >
            {tab === "flood" ? floodStage.label : `${slopeStage.label} (${saturationIndex}%)`}
          </span>
        </div>

        <input
          id="gis-sim-rainfall"
          name="sim-rainfall"
          type="range"
          min={20}
          max={180}
          step={5}
          value={rainfall}
          onChange={(event) => setRainfall(Number(event.target.value))}
          className="h-2 w-full cursor-pointer accent-blue-600"
        />

        {tab === "landslide" && (
          <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
            <span className="text-xs text-neutral-600 mr-1">Kemiringan lereng:</span>
            {(Object.keys(slopeAngles) as SlopePreset[]).map((key) => (
              <button
                key={key}
                type="button"
                aria-pressed={slope === key}
                onClick={() => setSlope(key)}
                className={`cursor-pointer rounded-lg border px-2.5 py-1 text-xs font-medium transition-colors ${
                  slope === key
                    ? "border-blue-600 bg-blue-50 text-blue-700"
                    : "border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-50"
                }`}
              >
                {slopeAngles[key].label}
              </button>
            ))}
          </div>
        )}

        <p className="flex items-start gap-1.5 rounded-xl bg-neutral-50 p-2.5 text-[11px] leading-4 text-neutral-600">
          <IconShieldCheck className="mt-0.5 size-3.5 shrink-0 text-blue-600" aria-hidden="true" />
          <span>
            {tab === "flood"
              ? `Konteks wilayah aktif: elevasi rata-rata ${elevationLabel}, status kerawanan ${susceptibilityLabel}. Pada dataran rendah dekat sungai, kenaikan debit meluapkan air ke cekungan permukiman.`
              : `Konteks wilayah aktif: elevasi rata-rata ${elevationLabel}. Pada perbukitan curam Jawa Barat, hujan berkepanjangan menjenuhkan pori tanah di atas batuan kedap dan memicu pergerakan lereng.`}
          </span>
        </p>
      </div>
    </section>
  );
}
