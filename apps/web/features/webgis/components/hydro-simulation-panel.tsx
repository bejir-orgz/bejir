"use client";

import {
  IconBuildingSkyscraper,
  IconPlayerPause,
  IconPlayerPlay,
  IconRoute,
  IconX,
} from "@tabler/icons-react";
import { useReducedMotion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
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

const scenarioOptions = [
  { value: "flood", label: "Banjir (DEM)" },
  { value: "landslide", label: "Longsor (Lereng)" },
] as const;

const scopeOptions = [
  { value: "district", label: "Kecamatan" },
  { value: "regency", label: "Kabupaten/Kota" },
] as const;

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
    : "—";
  const affectedPct = stats
    ? stats.affectedPct.toLocaleString("id-ID", { maximumFractionDigits: 1 })
    : null;
  const affectedBuildings = stats ? `~${stats.affectedBuildings.toLocaleString("id-ID")} unit` : "—";
  const affectedPopulationText = stats ? formatCompactPopulation(stats.affectedPopulation) : null;

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
      aria-describedby="gis-sim-description"
      className={`gis-sim-panel @container absolute inset-x-3 bottom-4 z-4 mx-auto flex max-h-[72dvh] max-w-[580px] flex-col gap-4 overflow-y-auto overscroll-contain rounded-2xl border border-border bg-card p-4 text-card-foreground [--sb-size:5px] [--sb-thumb-color:#8EC5FF] transition-[opacity,right] duration-200 starting:opacity-0 motion-reduce:transition-none max-[999.01px]:bottom-3 ${
        overviewOpen
          ? "min-[1000px]:left-16 min-[1000px]:right-[calc(var(--overview-width)+58px)]"
          : "min-[1000px]:left-16 min-[1000px]:right-16 min-[1280px]:max-[1439.01px]:bottom-16"
      }`}
    >
      <header className="grid grid-cols-[1fr_auto] items-center gap-x-4 gap-y-1">
        <h2 id="gis-sim-title" className="text-xl font-medium">
          Simulasi Peta
        </h2>
        <div className="flex shrink-0 items-center gap-1">
          {!reduced && selectedRegion && (
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className="text-neutral-600"
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
              variant="link"
              size="sm"
              className="text-red-500 no-underline hover:text-red-600 hover:no-underline"
              aria-label="Reset daerah simulasi"
              onClick={onResetRegion}
            >
              Reset
            </Button>
          )}
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="text-neutral-600"
            aria-label="Tutup panel simulasi peta"
            onClick={onClose}
          >
            <IconX className="size-4" aria-hidden="true" />
          </Button>
        </div>
        <p id="gis-sim-description" className="col-span-full text-xs text-neutral-600">
          Model edukatif berbasis elevasi dan lereng. Hasil berupa estimasi.
        </p>
      </header>

      <div className="grid gap-3 @min-[450px]:grid-cols-2">
        <fieldset className="min-w-0">
          <legend className="mb-1.5 text-xs font-medium text-neutral-700">Jenis simulasi</legend>
          <div className="grid grid-cols-2 gap-1 rounded-xl border border-blue-200 bg-blue-50 p-1">
            {scenarioOptions.map(({ value, label }) => (
              <Button
                key={value}
                type="button"
                variant={mode === value ? "default" : "ghost"}
                size="sm"
                aria-pressed={mode === value}
                onClick={() => onModeChange(value)}
              >
                {label}
              </Button>
            ))}
          </div>
        </fieldset>
        <fieldset className="min-w-0">
          <legend className="mb-1.5 text-xs font-medium text-neutral-700">Cakupan wilayah</legend>
          <div className="grid grid-cols-2 gap-1 rounded-xl border border-blue-200 bg-blue-50 p-1">
            {scopeOptions.map(({ value, label }) => (
              <Button
                key={value}
                type="button"
                variant={scope === value ? "default" : "ghost"}
                size="sm"
                aria-pressed={scope === value}
                onClick={() => onScopeChange(value)}
              >
                {label}
              </Button>
            ))}
          </div>
        </fieldset>
      </div>

      {!selectedRegion ? (
        <div className="flex flex-col items-start gap-2 rounded-xl border border-border bg-muted/50 p-3">
          <p className="text-sm text-neutral-700">
            Pilih wilayah di peta untuk memulai simulasi.
          </p>
          {quickRegionExamples.length > 0 && (
            <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Contoh wilayah">
              <span className="text-xs text-neutral-600">Contoh</span>
              {quickRegionExamples.map((ex) => (
                <Button
                  key={ex.regencyId}
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    onScopeChange("regency");
                    onPickExample(ex.regencyId, ex.districtId);
                  }}
                >
                  {ex.label}
                </Button>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-4 border-t border-border pt-4">
          <div className="flex flex-col gap-2">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="min-w-0 basis-full @min-[500px]:basis-auto @min-[500px]:flex-1">
                <h3 className="text-base font-medium">{selectedRegion.title}</h3>
                <p className="text-xs text-neutral-600">{selectedRegion.subtitle}</p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {hasEvacOrigin && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={onFindSafeEvac}
                  >
                    <IconRoute className="size-4" aria-hidden="true" />
                    <span>Evakuasi Aman</span>
                  </Button>
                )}
                {canZoom3d && stats?.focusCenter && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (stats.focusCenter) onZoomClose3d(stats.focusCenter);
                    }}
                  >
                    <IconBuildingSkyscraper className="size-4" aria-hidden="true" />
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
              <p className="rounded-lg bg-accent px-3 py-2 text-xs text-accent-foreground" role="status">
                {safeEvacNote}
              </p>
            )}
          </div>

          <dl className="grid grid-cols-2 gap-2 tabular-nums @min-[480px]:grid-cols-3">
            <Card className="min-w-0 p-3">
              <dt className="text-xs text-neutral-600">
                {mode === "flood" ? "Estimasi genangan" : "Zona rawan lereng"}
              </dt>
              <dd className="mt-1 text-base font-medium">{stats ? `${affectedAreaKm2} km²` : affectedAreaKm2}</dd>
              {affectedPct !== null && <dd className="text-xs text-neutral-600">{affectedPct}% dari wilayah</dd>}
            </Card>

            <Card className="min-w-0 p-3">
              <dt className="text-xs text-neutral-600">Bangunan &amp; penduduk</dt>
              <dd className="mt-1 text-base font-medium">{affectedBuildings}</dd>
              {affectedPopulationText && <dd className="text-xs text-neutral-600">{affectedPopulationText}</dd>}
            </Card>

            <Card className="col-span-2 min-w-0 p-3 @min-[480px]:col-span-1">
              <dt className="text-xs text-neutral-600">Elevasi &amp; lereng maks.</dt>
              <dd className="mt-1 text-base font-medium">
                {Math.round(selectedRegion.raster.minDemM).toLocaleString("id-ID")} s.d.{" "}
                {Math.round(selectedRegion.raster.maxDemM).toLocaleString("id-ID")} m
              </dd>
              <dd className="text-xs text-neutral-600">
                {selectedRegion.raster.maxSlopeDeg.toLocaleString("id-ID", {
                  minimumFractionDigits: 1,
                  maximumFractionDigits: 1,
                })}°
              </dd>
            </Card>
          </dl>

          {mode === "flood" ? (
            <div className="flex flex-col gap-3 rounded-xl border border-border p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <label htmlFor="gis-sim-water" className="text-sm font-medium">
                  Kenaikan muka air:{" "}
                  <strong className="font-semibold text-neutral-900 tabular-nums">
                    +{params.waterRiseM.toLocaleString("id-ID", { minimumFractionDigits: 1, maximumFractionDigits: 1 })} m
                  </strong>
                </label>
                <div className="flex flex-wrap items-center gap-1" role="group" aria-label="Preset kenaikan muka air">
                  {floodPresets.map((preset) => {
                    const active = Math.abs(params.waterRiseM - preset.value) < 0.05;
                    return (
                      <Button
                        key={preset.value}
                        type="button"
                        size="sm"
                        variant={active ? "default" : "outline"}
                        aria-pressed={active}
                        onClick={() => onParamsChange({ waterRiseM: preset.value })}
                      >
                        {preset.label}
                      </Button>
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
                className="h-5 w-full cursor-pointer accent-primary"
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
            <div className="flex flex-col gap-3 rounded-xl border border-border p-3">
              <label htmlFor="gis-sim-rain" className="text-sm font-medium">
                Hujan pemicu:{" "}
                <strong className="font-semibold text-neutral-900 tabular-nums">
                  {params.triggerRainMmDay} mm/hari
                </strong>
              </label>
              <input
                id="gis-sim-rain"
                name="sim-trigger-rain"
                type="range"
                min={40}
                max={220}
                step={10}
                value={params.triggerRainMmDay}
                onChange={(event) => onParamsChange({ triggerRainMmDay: Number(event.target.value) })}
                className="h-5 w-full cursor-pointer accent-primary"
              />
              <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Ambang kemiringan lereng">
                <span className="text-xs text-neutral-600">Ambang lereng {params.criticalSlopeDeg}°</span>
                {slopeThresholds.map(({ label, value }) => (
                  <Button
                    key={value}
                    type="button"
                    size="sm"
                    variant={params.criticalSlopeDeg === value ? "default" : "outline"}
                    aria-pressed={params.criticalSlopeDeg === value}
                    onClick={() => onParamsChange({ criticalSlopeDeg: value })}
                  >
                    {label}
                  </Button>
                ))}
              </div>
              <div className="flex flex-wrap items-center gap-4 text-xs text-neutral-600">
                <span className="inline-flex items-center gap-1.5">
                  <span className="size-2.5 rounded-xs bg-status-medium" aria-hidden="true" />
                  Waspada
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="size-2.5 rounded-xs bg-status-high" aria-hidden="true" />
                  Siaga
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="size-2.5 rounded-xs bg-status-very-high" aria-hidden="true" />
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
