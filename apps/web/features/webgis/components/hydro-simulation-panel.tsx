"use client";

import {
  IconBuildingSkyscraper,
  IconPlayerPause,
  IconPlayerPlay,
  IconRefresh,
  IconRoute,
  IconX,
} from "@tabler/icons-react";
import { useReducedMotion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useRegionSelection } from "@/features/regions/region-selection";
import type { SelectedSimRegion } from "@/features/simulation/map-simulation-layer";
import {
  describeClickedPointSimulation,
  type SimulationMode,
  type SimulationParams,
  type SimulationScope,
  type SimulationStats,
} from "@/features/simulation/terrain-pack";

const floodPresets = [
  { label: "Ringan", value: 1.5 },
  { label: "Sedang", value: 3.5 },
  { label: "Ekstrem", value: 7.0 },
];

const slopeThresholds = [
  { label: "Sensitif", value: 14 },
  { label: "Normal", value: 18 },
  { label: "Kuat", value: 24 },
];

const quickRegionTemplates = [
  { label: "Kab. Bandung", match: "kabupaten bandung" },
  { label: "Kab. Bogor", match: "kabupaten bogor" },
];

function formatCompactPopulation(count: number): string {
  if (count >= 1_000_000) {
    return `~${(count / 1_000_000).toLocaleString("id-ID", { maximumFractionDigits: 2 })} jt jiwa`;
  }
  return `~${count.toLocaleString("id-ID")} jiwa`;
}

export function HydroSimulationPanel({
  open,
  overviewOpen,
  mode,
  scope,
  params,
  paused,
  selectedRegion,
  stats,
  safeEvacNote,
  canZoom3d,
  onModeChange,
  onScopeChange,
  onParamsChange,
  onTogglePause,
  onZoomClose3d,
  onFindSafeEvac,
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
  safeEvacNote: string | null;
  canZoom3d: boolean;
  onModeChange: (mode: SimulationMode) => void;
  onScopeChange: (scope: SimulationScope) => void;
  onParamsChange: (patch: Partial<SimulationParams>) => void;
  onTogglePause: () => void;
  onZoomClose3d: (center: { lat: number; lng: number }) => void;
  onFindSafeEvac: () => void;
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

  const affectedAreaKm2 = stats
    ? stats.affectedAreaKm2.toLocaleString("id-ID", { maximumFractionDigits: 1 })
    : "0";
  const affectedPct = stats
    ? stats.affectedPct.toLocaleString("id-ID", { maximumFractionDigits: 1 })
    : "0";
  const affectedBuildings = stats ? stats.affectedBuildings.toLocaleString("id-ID") : "0";
  const affectedPopulationText = stats ? formatCompactPopulation(stats.affectedPopulation) : "~0 jiwa";

  const pointAssessment =
    selectedRegion && selectedRegion.pointSample
      ? describeClickedPointSimulation(selectedRegion.pointSample, selectedRegion.raster.p10DemM, mode, params)
      : null;

  const hasEvacOrigin = Boolean(selectedRegion?.clickedPoint || stats?.focusCenter);

  return (
    <section
      id="gis-hydro-simulation-panel"
      role="dialog"
      aria-modal="false"
      aria-labelledby="gis-sim-title"
      className={`gis-sim-panel absolute bottom-4 left-3 right-3 z-4 mx-auto max-h-[72dvh] overflow-y-auto w-[min(580px,calc(100vw-24px))] rounded-2xl border border-neutral-300 bg-white p-3.5 text-neutral-900 transition-[opacity,transform,right] duration-200 ease-[var(--ease-out-strong)] starting:scale-97 starting:opacity-0 max-[999.01px]:bottom-3 max-[999.01px]:p-3 ${
        overviewOpen
          ? "min-[1000px]:left-16 min-[1000px]:right-[calc(var(--overview-width)+58px)]"
          : "min-[1000px]:left-16 min-[1000px]:right-16"
      }`}
    >
      {/* Header: Noun title + quiet educational scope + uniform utility controls */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 id="gis-sim-title" className="text-[15px] leading-5 font-semibold text-neutral-900">
            Simulasi Peta
          </h2>
          <p className="mt-0.5 text-xs leading-4 text-neutral-600">
            Model edukatif berbasis DEM dan lereng, bukan kondisi bencana aktual.
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-1">
          {!reduced && selectedRegion && (
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className="h-7 w-7 rounded-lg text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900"
              aria-pressed={paused}
              aria-label={paused ? "Putar animasi simulasi" : "Jeda animasi simulasi"}
              title={paused ? "Putar animasi" : "Jeda animasi"}
              onClick={onTogglePause}
            >
              {paused ? (
                <IconPlayerPlay className="size-4" aria-hidden="true" />
              ) : (
                <IconPlayerPause className="size-4" aria-hidden="true" />
              )}
            </Button>
          )}
          {selectedRegion && (
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className="h-7 w-7 rounded-lg text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900"
              aria-label="Reset daerah simulasi"
              title="Reset wilayah"
              onClick={onResetRegion}
            >
              <IconRefresh className="size-4" aria-hidden="true" />
            </Button>
          )}
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="h-7 w-7 rounded-lg text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900"
            aria-label="Tutup panel simulasi peta"
            onClick={onClose}
          >
            <IconX className="size-4" aria-hidden="true" />
          </Button>
        </div>
      </div>

      {/* Mode & Scope: compact natural-width segmented controls on one row */}
      <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2 border-b border-neutral-200 pb-2.5">
        <div
          className="inline-flex items-center rounded-lg bg-neutral-100 p-0.5"
          role="tablist"
          aria-label="Pilih skenario simulasi"
        >
          <button
            type="button"
            role="tab"
            aria-selected={mode === "flood"}
            className={`inline-flex h-7 cursor-pointer items-center gap-1.5 rounded-md px-3 text-xs font-medium transition-colors ${
              mode === "flood"
                ? "bg-white text-neutral-900 shadow-2xs"
                : "text-neutral-600 hover:text-neutral-900"
            }`}
            onClick={() => onModeChange("flood")}
          >
            <span
              aria-hidden="true"
              className={`size-1.5 rounded-full ${mode === "flood" ? "bg-[var(--gis-blue)]" : "bg-neutral-400"}`}
            />
            Banjir (DEM)
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mode === "landslide"}
            className={`inline-flex h-7 cursor-pointer items-center gap-1.5 rounded-md px-3 text-xs font-medium transition-colors ${
              mode === "landslide"
                ? "bg-white text-neutral-900 shadow-2xs"
                : "text-neutral-600 hover:text-neutral-900"
            }`}
            onClick={() => onModeChange("landslide")}
          >
            <span
              aria-hidden="true"
              className={`size-1.5 rounded-full ${mode === "landslide" ? "bg-[#ea580c]" : "bg-neutral-400"}`}
            />
            Longsor (Lereng)
          </button>
        </div>

        <div
          className="inline-flex items-center rounded-lg bg-neutral-100 p-0.5"
          role="group"
          aria-label="Cakupan wilayah"
        >
          <button
            type="button"
            aria-pressed={scope === "district"}
            onClick={() => onScopeChange("district")}
            className={`h-7 cursor-pointer rounded-md px-2.5 text-xs font-medium transition-colors ${
              scope === "district"
                ? "bg-white text-neutral-900 shadow-2xs"
                : "text-neutral-600 hover:text-neutral-900"
            }`}
          >
            Kecamatan
          </button>
          <button
            type="button"
            aria-pressed={scope === "regency"}
            onClick={() => onScopeChange("regency")}
            className={`h-7 cursor-pointer rounded-md px-2.5 text-xs font-medium transition-colors ${
              scope === "regency"
                ? "bg-white text-neutral-900 shadow-2xs"
                : "text-neutral-600 hover:text-neutral-900"
            }`}
          >
            Kabupaten
          </button>
        </div>
      </div>

      {/* Body: Quiet empty prompt OR hairline-divided metrics + single parameter control */}
      {!selectedRegion ? (
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2.5">
          <p className="text-xs leading-5 text-neutral-700">
            Klik wilayah mana pun pada peta untuk memulai simulasi.
          </p>
          {quickRegionExamples.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-xs text-neutral-600">Contoh:</span>
              {quickRegionExamples.map((ex) => (
                <button
                  key={ex.regencyId}
                  type="button"
                  onClick={() => {
                    onScopeChange("regency");
                    onPickExample(ex.regencyId, ex.districtId);
                  }}
                  className="h-7 cursor-pointer rounded-lg border border-neutral-200 bg-neutral-50 px-2.5 text-xs font-medium text-neutral-800 transition-colors hover:bg-neutral-100"
                >
                  {ex.label}
                </button>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="mt-2.5 flex flex-col gap-2.5">
          {/* Active region identity + compact actions, with full-width status lines below so they never wrap narrowly */}
          <div className="flex flex-col gap-1">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-neutral-900">{selectedRegion.title}</p>
                <p className="truncate text-xs text-neutral-600">{selectedRegion.subtitle}</p>
              </div>

              <div className="flex shrink-0 items-center gap-1.5">
                {hasEvacOrigin && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-7 gap-1.5 rounded-lg border-neutral-300 bg-white px-2.5 text-xs font-medium text-neutral-800 hover:bg-neutral-100"
                    onClick={onFindSafeEvac}
                  >
                    <IconRoute className="size-3.5 text-neutral-600" aria-hidden="true" />
                    <span>Evakuasi Aman</span>
                  </Button>
                )}
                {canZoom3d && stats?.focusCenter && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-7 gap-1.5 rounded-lg border-neutral-300 bg-white px-2.5 text-xs font-medium text-neutral-800 hover:bg-neutral-100"
                    onClick={() => {
                      if (stats.focusCenter) onZoomClose3d(stats.focusCenter);
                    }}
                  >
                    <IconBuildingSkyscraper className="size-3.5 text-neutral-600" aria-hidden="true" />
                    <span>Lihat Dekat 3D</span>
                  </Button>
                )}
              </div>
            </div>

            {pointAssessment && (
              <p
                className={`text-xs leading-4 font-medium ${
                  pointAssessment.status === "hazard"
                    ? mode === "flood"
                      ? "text-[var(--accent-foreground)]"
                      : "text-[#c2410c]"
                    : "text-[#15803d]"
                }`}
              >
                {pointAssessment.summary}
              </p>
            )}
            {safeEvacNote && (
              <p className="text-xs leading-4 font-medium text-[#15803d]" role="status">
                {safeEvacNote}
              </p>
            )}
          </div>

          {/* One flat container split by 1px hairlines (3 balanced columns, >=12px labels, tabular figures) */}
          <div className="grid grid-cols-3 divide-x divide-neutral-200 border-y border-neutral-200 py-2 max-[520px]:grid-cols-1 max-[520px]:divide-x-0 max-[520px]:divide-y">
            <div className="pr-3 max-[520px]:pb-2 max-[520px]:pr-0">
              <span className="block text-xs text-neutral-600">
                {mode === "flood" ? "Estimasi genangan" : "Zona rawan lereng"}
              </span>
              <div className="mt-0.5 flex items-baseline gap-1.5 tabular-nums">
                <strong
                  className={`text-[15px] font-semibold ${
                    mode === "flood" ? "text-[var(--accent-foreground)]" : "text-[#c2410c]"
                  }`}
                >
                  {affectedAreaKm2} km²
                </strong>
                <span className="text-xs text-neutral-600">({affectedPct}%)</span>
              </div>
            </div>

            <div className="px-3 max-[520px]:px-0 max-[520px]:py-2">
              <span className="block text-xs text-neutral-600">Bangunan &amp; penduduk</span>
              <div className="mt-0.5 flex items-baseline gap-1 tabular-nums">
                <strong className="text-[15px] font-semibold text-neutral-900">~{affectedBuildings}</strong>
                <span className="text-xs text-neutral-600">unit</span>
              </div>
              <span className="block text-xs text-neutral-600 tabular-nums">{affectedPopulationText}</span>
            </div>

            <div className="pl-3 max-[520px]:pl-0 max-[520px]:pt-2">
              <span className="block text-xs text-neutral-600">Elevasi &amp; lereng maks</span>
              <div className="mt-0.5 flex items-baseline gap-1.5 tabular-nums">
                <strong className="text-[15px] font-semibold text-neutral-900">
                  {Math.round(selectedRegion.raster.minDemM).toLocaleString("id-ID")} s.d.{" "}
                  {Math.round(selectedRegion.raster.maxDemM).toLocaleString("id-ID")} m
                </strong>
                <span className="text-xs text-neutral-600">
                  {selectedRegion.raster.maxSlopeDeg.toLocaleString("id-ID", {
                    minimumFractionDigits: 1,
                    maximumFractionDigits: 1,
                  })}°
                </span>
              </div>
            </div>
          </div>

          {/* Scenario Slider + Quiet Presets + Data Legend */}
          {mode === "flood" ? (
            <div className="flex flex-col gap-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <label htmlFor="gis-sim-water" className="text-xs font-medium text-neutral-800">
                  Kenaikan muka air:{" "}
                  <strong className="font-semibold text-neutral-900 tabular-nums">
                    +{params.waterRiseM.toLocaleString("id-ID", { minimumFractionDigits: 1, maximumFractionDigits: 1 })} m
                  </strong>
                </label>
                <div className="inline-flex items-center gap-1">
                  {floodPresets.map((preset) => {
                    const active = Math.abs(params.waterRiseM - preset.value) < 0.05;
                    return (
                      <button
                        key={preset.value}
                        type="button"
                        aria-pressed={active}
                        onClick={() => onParamsChange({ waterRiseM: preset.value })}
                        className={`h-6 cursor-pointer rounded-md px-2 text-xs font-medium transition-colors ${
                          active
                            ? "bg-neutral-900 text-white"
                            : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200/80"
                        }`}
                      >
                        {preset.label}
                      </button>
                    );
                  })}
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
                className="h-1.5 w-full cursor-pointer accent-[var(--gis-blue)]"
              />
              <div className="flex flex-wrap items-center gap-4 text-xs text-neutral-600">
                <span className="inline-flex items-center gap-1.5">
                  <span className="size-2.5 rounded-xs bg-[#38BDF8]" aria-hidden="true" />
                  Dangkal (&lt;0,5 m)
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="size-2.5 rounded-xs bg-[#2563EB]" aria-hidden="true" />
                  Sedang (0,5 s.d. 2 m)
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="size-2.5 rounded-xs bg-[#1E3A8A]" aria-hidden="true" />
                  Dalam (&gt;2 m)
                </span>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <label htmlFor="gis-sim-rain" className="text-xs font-medium text-neutral-800">
                  Hujan pemicu:{" "}
                  <strong className="font-semibold text-neutral-900 tabular-nums">
                    {params.triggerRainMmDay} mm/hari
                  </strong>
                </label>
                <div className="inline-flex items-center gap-1">
                  {slopeThresholds.map((opt) => {
                    const active = params.criticalSlopeDeg === opt.value;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        aria-pressed={active}
                        onClick={() => onParamsChange({ criticalSlopeDeg: opt.value })}
                        className={`h-6 cursor-pointer rounded-md px-2 text-xs font-medium transition-colors ${
                          active
                            ? "bg-neutral-900 text-white"
                            : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200/80"
                        }`}
                      >
                        {opt.label}
                      </button>
                    );
                  })}
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
                className="h-1.5 w-full cursor-pointer accent-[#ea580c]"
              />
              <div className="flex flex-wrap items-center gap-4 text-xs text-neutral-600">
                <span className="inline-flex items-center gap-1.5">
                  <span className="size-2.5 rounded-xs bg-[#FFD000]" aria-hidden="true" />
                  Waspada
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="size-2.5 rounded-xs bg-[#FF6A00]" aria-hidden="true" />
                  Siaga
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="size-2.5 rounded-xs bg-[#FF0000]" aria-hidden="true" />
                  Kritis
                </span>
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
