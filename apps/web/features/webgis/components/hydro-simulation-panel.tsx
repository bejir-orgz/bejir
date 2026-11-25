"use client";

import {
  IconAlertTriangle,
  IconClick,
  IconCloudRain,
  IconLayersIntersect,
  IconPlayerPause,
  IconPlayerPlay,
  IconRefresh,
  IconX,
} from "@tabler/icons-react";
import { useReducedMotion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useRegionSelection } from "@/features/regions/region-selection";
import type { SelectedSimRegion } from "@/features/simulation/map-simulation-layer";
import type {
  SimulationMode,
  SimulationParams,
  SimulationScope,
  SimulationStats,
} from "@/features/simulation/terrain-pack";

const floodPresets = [
  { label: "Ringan (+1,5 m)", value: 1.5 },
  { label: "Sedang (+3,5 m)", value: 3.5 },
  { label: "Ekstrem (+7,0 m)", value: 7.0 },
];

const slopeThresholds = [
  { label: "Sensitif (14°)", value: 14 },
  { label: "Normal (18°)", value: 18 },
  { label: "Kuat (24°)", value: 24 },
];

const quickRegionTemplates = [
  { label: "Kab. Bandung (Cekungan)", match: "kabupaten bandung" },
  { label: "Kab. Bogor (Perbukitan)", match: "kabupaten bogor" },
];

export function HydroSimulationPanel({
  open,
  overviewOpen,
  mode,
  scope,
  params,
  paused,
  selectedRegion,
  stats,
  onModeChange,
  onScopeChange,
  onParamsChange,
  onTogglePause,
  onPickExample,
  onResetRegion,
  onClose,
}: {
  open: boolean;
  overviewOpen: boolean;
  mode: SimulationMode;
  scope: SimulationScope;
  params: SimulationParams;
  paused: boolean;
  selectedRegion: SelectedSimRegion | null;
  stats: SimulationStats | null;
  onModeChange: (mode: SimulationMode) => void;
  onScopeChange: (scope: SimulationScope) => void;
  onParamsChange: (patch: Partial<SimulationParams>) => void;
  onTogglePause: () => void;
  onPickExample: (regencyId: number, districtId: number | null) => void;
  onResetRegion: () => void;
  onClose: () => void;
}) {
  const reduced = useReducedMotion();
  const { tree, toMapIds } = useRegionSelection();

  if (!open) return null;

  const regencyNodes = tree.flatMap((root) => (root.children?.length ? root.children : [root]));
  const quickRegionExamples = quickRegionTemplates
    .map((tpl) => {
      const found = regencyNodes.find((node) => node.name.toLowerCase() === tpl.match);
      const mapped = found ? toMapIds([found.id])[0] : "";
      const id = Number(mapped);
      return Number.isSafeInteger(id) && id > 0 ? { label: tpl.label, regencyId: id, districtId: null } : null;
    })
    .filter((item): item is { label: string; regencyId: number; districtId: null } => item !== null);

  const affectedAreaText = stats
    ? `${stats.affectedAreaKm2.toLocaleString("id-ID", { maximumFractionDigits: 1 })} km² (${stats.affectedPct.toLocaleString("id-ID", { maximumFractionDigits: 1 })}%)`
    : "0 km²";

  return (
    <section
      id="gis-hydro-simulation-panel"
      role="dialog"
      aria-modal="false"
      aria-labelledby="gis-sim-title"
      className={`gis-sim-panel absolute bottom-3 left-3 right-3 z-4 mx-auto max-h-[52dvh] overflow-y-auto w-[min(620px,calc(100vw-24px))] rounded-2xl border border-neutral-300 bg-white/97 p-3.5 text-neutral-900 backdrop-blur-[2px] transition-[opacity,transform,right] duration-200 ease-[var(--ease-out-strong)] starting:scale-96 starting:opacity-0 max-[999.01px]:bottom-2.5 max-[999.01px]:p-2.5 ${
        overviewOpen
          ? "min-[1000px]:left-16 min-[1000px]:right-[calc(var(--overview-width)+58px)]"
          : "min-[1000px]:left-16 min-[1000px]:right-16"
      }`}
    >
      {/* Header & Mandatory Disclaimer */}
      <div className="flex flex-wrap items-start justify-between gap-2 border-b border-neutral-200 pb-2.5">
        <div className="min-w-0">
          <span className="inline-flex items-center gap-1.5 rounded-md border border-amber-300 bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-900">
            <IconAlertTriangle className="size-3.5 shrink-0" aria-hidden="true" />
            SIMULASI EDUKATIF · BUKAN KONDISI BENCANA AKTUAL
          </span>
          <h2 id="gis-sim-title" className="mt-1 text-sm leading-5 font-semibold text-neutral-900">
            Simulasi Kontur Peta Berbasis DEM &amp; Kemiringan Lereng
          </h2>
        </div>

        <div className="flex shrink-0 items-center gap-1">
          {!reduced && selectedRegion && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-7 px-2 text-xs"
              aria-pressed={paused}
              aria-label={paused ? "Putar animasi peta" : "Jeda animasi peta"}
              onClick={onTogglePause}
            >
              {paused ? <IconPlayerPlay className="size-3.5" aria-hidden="true" /> : <IconPlayerPause className="size-3.5" aria-hidden="true" />}
              <span>{paused ? "Putar" : "Jeda"}</span>
            </Button>
          )}
          {selectedRegion && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-7 px-2 text-xs"
              aria-label="Reset daerah simulasi"
              onClick={onResetRegion}
            >
              <IconRefresh className="size-3.5" aria-hidden="true" />
              <span>Reset</span>
            </Button>
          )}
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="h-7 w-7"
            aria-label="Tutup panel simulasi peta"
            onClick={onClose}
          >
            <IconX className="size-4" aria-hidden="true" />
          </Button>
        </div>
      </div>

      {/* Mode Tabs + Scope Switcher */}
      <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-1 min-w-[230px] gap-1.5" role="tablist" aria-label="Pilih skenario simulasi peta">
          <button
            type="button"
            role="tab"
            aria-selected={mode === "flood"}
            className={`flex-1 cursor-pointer rounded-xl border px-2.5 py-1.5 text-xs font-semibold transition-colors ${
              mode === "flood"
                ? "border-blue-600 bg-blue-600 text-white"
                : "border-neutral-200 bg-neutral-50 text-neutral-700 hover:bg-blue-50"
            }`}
            onClick={() => onModeChange("flood")}
          >
            <span className="inline-flex items-center justify-center gap-1.5">
              <IconCloudRain className="size-3.5" aria-hidden="true" />
              Banjir (DEM)
            </span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mode === "landslide"}
            className={`flex-1 cursor-pointer rounded-xl border px-2.5 py-1.5 text-xs font-semibold transition-colors ${
              mode === "landslide"
                ? "border-orange-600 bg-orange-600 text-white"
                : "border-neutral-200 bg-neutral-50 text-neutral-700 hover:bg-orange-50"
            }`}
            onClick={() => onModeChange("landslide")}
          >
            <span className="inline-flex items-center justify-center gap-1.5">
              <IconLayersIntersect className="size-3.5" aria-hidden="true" />
              Longsor (Lereng)
            </span>
          </button>
        </div>

        <div className="inline-flex items-center rounded-xl border border-neutral-200 bg-neutral-50 p-0.5" role="group" aria-label="Cakupan klik wilayah">
          <button
            type="button"
            aria-pressed={scope === "district"}
            onClick={() => onScopeChange("district")}
            className={`cursor-pointer rounded-lg px-2.5 py-1 text-[11px] font-semibold transition-colors ${
              scope === "district" ? "bg-white text-neutral-900 shadow-xs" : "text-neutral-600 hover:text-neutral-900"
            }`}
          >
            Kecamatan
          </button>
          <button
            type="button"
            aria-pressed={scope === "regency"}
            onClick={() => onScopeChange("regency")}
            className={`cursor-pointer rounded-lg px-2.5 py-1 text-[11px] font-semibold transition-colors ${
              scope === "regency" ? "bg-white text-neutral-900 shadow-xs" : "text-neutral-600 hover:text-neutral-900"
            }`}
          >
            Kabupaten
          </button>
        </div>
      </div>

      {/* Selected Region Summary or Click Guidance */}
      {!selectedRegion ? (
        <div className="mt-2.5 flex flex-col gap-2 rounded-xl border border-dashed border-blue-300 bg-blue-50/60 p-3 text-xs text-blue-950">
          <div className="flex items-start gap-2">
            <IconClick className="mt-0.5 size-4 shrink-0 text-blue-600" aria-hidden="true" />
            <p className="leading-4">
              <strong>Klik daerah mana pun di peta</strong> untuk menjalankan simulasi langsung pada kontur ketinggian DEM &amp; kemiringan lereng wilayah tersebut.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] font-medium text-blue-800">Atau coba cepat:</span>
            {quickRegionExamples.map((ex) => (
              <button
                key={ex.regencyId}
                type="button"
                onClick={() => {
                  onScopeChange("regency");
                  onPickExample(ex.regencyId, ex.districtId);
                }}
                className="cursor-pointer rounded-lg border border-blue-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-blue-800 transition-colors hover:bg-blue-100"
              >
                {ex.label}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="mt-2.5 flex flex-col gap-2.5">
          {/* Active Region + Live Terrain Stats */}
          <div className="grid grid-cols-3 gap-2 rounded-xl border border-neutral-200 bg-neutral-50/90 p-2 sm:grid-cols-[minmax(0,1.2fr)_repeat(3,minmax(0,0.75fr))] sm:p-2.5">
            <div className="col-span-3 min-w-0 sm:col-span-1">
              <p className="truncate text-xs font-semibold text-neutral-900">{selectedRegion.title}</p>
              <p className="truncate text-[11px] text-neutral-600">
                {selectedRegion.subtitle}
                {selectedRegion.pointSample
                  ? ` · Titik ${selectedRegion.pointSample.demM.toFixed(0)} m dpl`
                  : ""}
              </p>
            </div>
            <div>
              <span className="block text-[10px] font-medium text-neutral-500">Elevasi DEM</span>
              <strong className="text-xs font-semibold text-neutral-900 tabular-nums">
                {Math.round(selectedRegion.raster.minDemM)} s.d. {Math.round(selectedRegion.raster.maxDemM)} m
              </strong>
            </div>
            <div>
              <span className="block text-[10px] font-medium text-neutral-500">Lereng Maks</span>
              <strong className="text-xs font-semibold text-neutral-900 tabular-nums">
                {selectedRegion.raster.maxSlopeDeg.toFixed(1)}°
              </strong>
            </div>
            <div>
              <span className="block text-[10px] font-medium text-neutral-500">
                {mode === "flood" ? "Estimasi Genangan" : "Zona Rawan Lereng"}
              </span>
              <strong
                className={`text-xs font-semibold tabular-nums ${
                  mode === "flood" ? "text-blue-700" : "text-orange-700"
                }`}
              >
                {affectedAreaText}
              </strong>
            </div>
          </div>

          {/* Scenario Controls */}
          {mode === "flood" ? (
            <div className="flex flex-col gap-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <label htmlFor="gis-sim-water" className="text-xs font-semibold text-neutral-800">
                  Kenaikan Muka Air Luapan:{" "}
                  <span className="text-blue-700 tabular-nums">
                    +{params.waterRiseM.toLocaleString("id-ID", { minimumFractionDigits: 1, maximumFractionDigits: 1 })} m
                  </span>
                </label>
                <div className="flex flex-wrap gap-1">
                  {floodPresets.map((preset) => (
                    <button
                      key={preset.value}
                      type="button"
                      aria-pressed={Math.abs(params.waterRiseM - preset.value) < 0.05}
                      onClick={() => onParamsChange({ waterRiseM: preset.value })}
                      className={`cursor-pointer rounded-lg border px-2 py-0.5 text-[11px] font-medium transition-colors ${
                        Math.abs(params.waterRiseM - preset.value) < 0.05
                          ? "border-blue-600 bg-blue-50 text-blue-800"
                          : "border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-100"
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>
              <input
                id="gis-sim-water"
                name="sim-water-rise"
                type="range"
                min={0.5}
                max={12.0}
                step={0.5}
                value={params.waterRiseM}
                onChange={(event) => onParamsChange({ waterRiseM: Number(event.target.value) })}
                className="h-2 w-full cursor-pointer accent-blue-600"
              />
              <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-neutral-600">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="inline-flex items-center gap-1">
                    <span className="size-2.5 rounded-xs bg-[#38BDF8]" aria-hidden="true" />
                    Dangkal (&lt;0,5 m)
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <span className="size-2.5 rounded-xs bg-[#2563EB]" aria-hidden="true" />
                    Sedang (0,5 s.d. 2 m)
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <span className="size-2.5 rounded-xs bg-[#1E3A8A]" aria-hidden="true" />
                    Dalam (&gt;2 m)
                  </span>
                </div>
                <span className="text-[10px] text-neutral-500">Klik daerah lain di peta untuk pindah lokasi</span>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <label htmlFor="gis-sim-rain" className="text-xs font-semibold text-neutral-800">
                  Hujan Pemicu Kejenuhan Tanah:{" "}
                  <span className="text-orange-700 tabular-nums">{params.triggerRainMmDay} mm/hari</span>
                </label>
                <div className="flex flex-wrap gap-1">
                  {slopeThresholds.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      aria-pressed={params.criticalSlopeDeg === opt.value}
                      onClick={() => onParamsChange({ criticalSlopeDeg: opt.value })}
                      className={`cursor-pointer rounded-lg border px-2 py-0.5 text-[11px] font-medium transition-colors ${
                        params.criticalSlopeDeg === opt.value
                          ? "border-orange-600 bg-orange-50 text-orange-800"
                          : "border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-100"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
              <input
                id="gis-sim-rain"
                name="sim-trigger-rain"
                type="range"
                min={40}
                max={220}
                step={10}
                value={params.triggerRainMmDay}
                onChange={(event) => onParamsChange({ triggerRainMmDay: Number(event.target.value) })}
                className="h-2 w-full cursor-pointer accent-orange-600"
              />
              <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-neutral-600">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="inline-flex items-center gap-1">
                    <span className="size-2.5 rounded-xs bg-[#FFD000]" aria-hidden="true" />
                    Waspada
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <span className="size-2.5 rounded-xs bg-[#FF6A00]" aria-hidden="true" />
                    Siaga
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <span className="size-2.5 rounded-xs bg-[#FF0000]" aria-hidden="true" />
                    Kritis + arah turun lereng
                  </span>
                </div>
                <span className="text-[10px] text-neutral-500">Parameter: Slope + Hujan + Tutupan Lahan + DEM</span>
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
