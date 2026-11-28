"use client";

import { useCallback, useEffect, useMemo, useState, useReducer, useRef, useSyncExternalStore, type CSSProperties } from "react";
import { useRegionSelection } from "@/features/regions/region-selection";
import { WebgisHeader } from "@/components/layout/webgis-header";
import { IconMap, IconLayoutNavbarCollapse, IconLayoutNavbarCollapseFilled, IconCalendarWeek, IconCalendarWeekFilled, IconListDetails, IconListDetailsFilled, IconRipple, IconStackFront, IconStack3Filled } from "@tabler/icons-react";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { OverviewButton } from "@/components/ui/overview-button";
import dynamic from "next/dynamic";
import { InteractiveMap } from "@/features/map/components/interactive-map";
import { supportsWebGL } from "@/features/map/three-d/webgl-support";
import { EvacuationLayer } from "@/features/evacuation/evacuation-layer";
import {
  ALL_EVACUATION_CATEGORIES,
  filterEvacuationSitesByCategories,
  type EvacuationCategoryId,
} from "@/features/evacuation/nearby-fallback";
import { useEvacuationSites } from "@/features/evacuation/use-evacuation-sites";
import { EvacuationRouting } from "@/features/evacuation/evacuation-routing";
import { BoundaryLayer } from "@/features/regions/boundary-layer";
import { useOverview } from "../use-overview";
import { RiverLayer } from "@/features/rivers/river-layer";
import { useRiverMode } from "@/features/rivers/use-river-mode";
import { ThematicLayers } from "@/features/geography/thematic-layers";
import { MapSimulationLayer, type SelectedSimRegion } from "@/features/simulation/map-simulation-layer";
import type { SimulationMode, SimulationParams, SimulationScope, SimulationStats } from "@/features/simulation/terrain-pack";
import type { WorkspaceFilters, WorkspaceProps } from "../types";
import { RegionSidebar } from "./region-sidebar";
import { OverviewPanel } from "./overview-panel";
import { LegendSidebar } from "./legend-sidebar";
import { TimelineSidebar } from "./timeline-sidebar";
import { MapQuickBar } from "./map-quick-bar";
import { HydroSimulationPanel } from "./hydro-simulation-panel";
import { initialPanelState, panelReducer, type LeftPanel } from "../panel-state";
import { clampPeriodToToday, formatTimelinePeriodSummary } from "../timeline";

const BejirAssistant = dynamic(() => import("@/features/assistant/components/assistant").then((module) => module.BejirAssistant));
const MapLibreWorkspaceMap = dynamic(
  () => import("@/features/map/three-d/maplibre-workspace-map").then((module) => module.MapLibreWorkspaceMap),
  { ssr: false },
);

const leftTools = [
  { id: "regions", label: "Daerah", icon: IconMap, filledIcon: IconMap },
  { id: "timeline", label: "Timeline", icon: IconCalendarWeek, filledIcon: IconCalendarWeekFilled },
  { id: "legends", label: "Legenda", icon: IconListDetails, filledIcon: IconListDetailsFilled },
] as const;

const floatingToolClassName = "pointer-events-auto rounded-2xl px-3 text-sm! max-[539px]:w-12 max-[539px]:p-0 max-[359px]:w-10";

const narrowQuery = "(max-width: 999px)";
function subscribeToWidth(callback: () => void) {
  const media = window.matchMedia(narrowQuery);
  media.addEventListener("change", callback);
  return () => media.removeEventListener("change", callback);
}
const getNarrowSnapshot = () => window.matchMedia(narrowQuery).matches;
const getServerSnapshot = () => false;

const subscribeNoop = () => () => {};
const getWebGLSnapshot = () => supportsWebGL();
const getWebGLServerSnapshot = () => null;

function parseInitialSimTarget(regionIds: string[]): {
  regencyId: number;
  districtId: number | null;
  point: null;
} | null {
  const positive = regionIds.find((id) => !id.startsWith("!"));
  if (!positive) return null;
  const parts = positive.split("/").map(Number);
  if (!Number.isSafeInteger(parts[0]) || parts[0] < 1) return null;
  const districtId = parts.length >= 2 && Number.isSafeInteger(parts[1]) && parts[1] >= 1 ? parts[1] : null;
  return { regencyId: parts[0], districtId, point: null };
}

export function WebgisWorkspace({ data, onFiltersChange }: WorkspaceProps) {
  const { mapRegionIds, dataRegionIds, setMapRegionIds } = useRegionSelection();
  const [localFilters, setFilters] = useState(data.initialFilters);
  const [sidebarWidth, setSidebarWidth] = useState(264);
  const [aiOpened, setAiOpened] = useState(false);

  const webglAvailable = useSyncExternalStore(subscribeNoop, getWebGLSnapshot, getWebGLServerSnapshot);
  const [useClassicMap, setUseClassicMap] = useState(false);

  // On-map interactive DEM/slope/building simulation state.
  const [simulationOpen, setSimulationOpen] = useState(false);
  const [layersOpen, setLayersOpen] = useState(false);
  const [simMode, setSimMode] = useState<SimulationMode>("flood");
  const [simScope, setSimScope] = useState<SimulationScope>("district");
  const [simPaused, setSimPaused] = useState(false);
  const [simParams, setSimParams] = useState<SimulationParams>({
    waterRiseM: 3.5,
    triggerRainMmDay: 140,
    criticalSlopeDeg: 18,
  });
  const [simTarget, setSimTarget] = useState<{
    regencyId: number;
    districtId: number | null;
    point: { lat: number; lng: number } | null;
  } | null>(null);
  const [simRegion, setSimRegion] = useState<SelectedSimRegion | null>(null);
  const [simStats, setSimStats] = useState<SimulationStats | null>(null);
  const [focusRequest, setFocusRequest] = useState<{ lat: number; lng: number; nonce: number } | null>(null);
  const [safeEvacRequestNonce, setSafeEvacRequestNonce] = useState(0);
  const [safeEvacNote, setSafeEvacNote] = useState<string | null>(null);
  const [evacuationCategories, setEvacuationCategories] = useState<EvacuationCategoryId[]>([
    ...ALL_EVACUATION_CATEGORIES,
  ]);

  const filters = { ...localFilters, regionIds: mapRegionIds };
  const riversEnabled = filters.layerIds.includes("rivers");
  const riverMode = useRiverMode(riversEnabled);
  useEffect(() => {
    if (data.initialFilters.regionIds.length) setMapRegionIds(data.initialFilters.regionIds);
  }, [data.initialFilters.regionIds, setMapRegionIds]);
  const evacuationEnabled = filters.layerIds.includes("evacuation");
  const evacuation = useEvacuationSites(evacuationEnabled);
  const filteredEvacuationSites = useMemo(
    () => filterEvacuationSitesByCategories(evacuation.sites, evacuationCategories),
    [evacuation.sites, evacuationCategories],
  );
  const [routeStatus, setRouteStatus] = useState<{ message: string }>();
  const [regionStatus, setRegionStatus] = useState<{ message: string }>();
  const [riverStatus, setRiverStatus] = useState<{ message: string; retry?: () => void }>();
  const [thematicStatus, setThematicStatus] = useState<{ message: string; retry?: () => void }>();
  const [simStatus, setSimStatus] = useState<{ message: string; retry?: () => void }>();
  const narrow = useSyncExternalStore(subscribeToWidth, getNarrowSnapshot, getServerSnapshot);
  const [panels, dispatch] = useReducer(panelReducer, data.initialFilters.regionIds.length ? { left: null, overview: true } : initialPanelState);
  const lastTrigger = useRef<HTMLButtonElement | null>(null);
  const overviewPanel = useRef<HTMLDivElement>(null);
  const leftOpen = !simulationOpen && panels.left !== null;
  const overviewOpen = panels.overview && (!narrow || !leftOpen);
  const overview = useOverview(data.overview, { ...filters, regionIds: dataRegionIds }, overviewOpen);
  const OverviewIcon = overviewOpen ? IconLayoutNavbarCollapseFilled : IconLayoutNavbarCollapse;

  function updateFilters(patch: Partial<WorkspaceFilters>) {
    const next = { ...filters, ...patch };
    setFilters(next);
    if (patch.regionIds) {
      setMapRegionIds(patch.regionIds);
      const query = new URLSearchParams();
      for (const id of patch.regionIds) query.append("region", id);
      window.history.replaceState(null, "", query.size ? `/map?${query}` : "/map");
    }
    onFiltersChange?.(next);
  }

  function toggleLeft(panel: LeftPanel, trigger: HTMLButtonElement) {
    lastTrigger.current = trigger;
    if (panels.left !== panel) setSimulationOpen(false);
    dispatch({ type: "toggle-left", panel, narrow });
  }

  function toggleSimulation() {
    const next = !simulationOpen;
    if (next && panels.left !== null) {
      dispatch({ type: "toggle-left", panel: panels.left, narrow });
    }
    setSimulationOpen(next);
    if (next && !simTarget) {
      const initial = parseInitialSimTarget(mapRegionIds);
      if (initial) {
        setSimScope(initial.districtId !== null ? "district" : "regency");
        setSimTarget(initial);
      }
    }
  }

  const handleSelectSimTarget = useCallback(
    (target: { regencyId: number; districtId: number | null; point: { lat: number; lng: number } | null }) => {
      setSimTarget(target);
    },
    [],
  );

  const handlePickSimExample = useCallback((regencyId: number, districtId: number | null) => {
    setSimTarget({ regencyId, districtId, point: null });
  }, []);

  const handleZoomClose3d = useCallback(
    (center: { lat: number; lng: number }) => {
      if (webglAvailable) setUseClassicMap(false);
      setFocusRequest({ lat: center.lat, lng: center.lng, nonce: Date.now() });
    },
    [webglAvailable],
  );

  function handleFindSafeEvac() {
    if (!filters.layerIds.includes("evacuation")) {
      updateFilters({ layerIds: [...filters.layerIds, "evacuation"] });
    }
    setSafeEvacRequestNonce((prev) => prev + 1);
  }

  const activeDataStatus = simStatus ?? regionStatus ?? routeStatus ?? riverStatus ??
    (riversEnabled && !riverMode ? { message: "Memuat jaringan sungai…" } : undefined) ??
    thematicStatus ?? evacuation.dataStatus;
  const rawTimePeriod = filters.date
    ? { from: filters.date, to: filters.dateTo || filters.date }
    : overview.period;
  const activeTimePeriod = clampPeriodToToday(rawTimePeriod);
  const activeTimeLabel = formatTimelinePeriodSummary(activeTimePeriod) || `Tahun ${data.year}`;

  return (
    <div className="webgis-screen flex flex-col [&_>_.gis-header]:shrink-0 [--gis-blue:var(--primary)] [--gis-border:var(--border)] [--gis-muted:#737373] [--gis-slide-duration:280ms] [--gis-slide-easing:cubic-bezier(.22,1,.36,1)] text-[#000] bg-[#fff] text-[14px] leading-[20px] h-dvh min-h-120 overflow-hidden [&_button:focus-visible]:[outline:2px_solid_var(--gis-blue)] [&_button:focus-visible]:[outline-offset:-2px]">
      <a className="skip-link fixed z-50 top-2 left-4 [transform:translateY(-150%)] rounded-lg bg-[#2563eb] text-[white] p-[8px_16px] [&:focus]:[transform:translateY(0)]" href="#gis-main">Lewati ke peta</a>
      <WebgisHeader mapCanvas onRegionSelect={(region) => {
        updateFilters({ regionIds: [region.id] });
        dispatch({ type: "show-overview" });
      }} />
      <main id="gis-main" style={{ "--sidebar-width": `min(${sidebarWidth}px, 480px, calc(100vw - 32px))` } as CSSProperties} className="gis-layout [--regions-width:var(--sidebar-width)] [--overview-width:456px] relative flex-1 min-h-0 isolate [&[data-left-open=false]]:[--regions-width:0px] [&[data-overview-open=true]_.gis-overview-trigger]:[transform:translateX(calc(-100%_+_1px))] [&[data-overview-open=true]_.gis-map-settings]:right-[calc(var(--overview-width)_+_16px)] [&[data-overview-open=true]_.gis-map-status]:right-[calc(var(--overview-width)_+_64px)] max-[999.01px]:[&[data-overview-open=true]_.gis-3d-switcher]:hidden min-[1000px]:max-[1199.01px]:[--overview-width:380px] max-[999.01px]:[--regions-width:0px] max-[999.01px]:[--overview-width:min(456px,calc(100%_-_56px))] max-[999.01px]:[&[data-left-open=true]_.gis-overview-toggle]:hidden max-[999.01px]:[&[data-overview-open=true]_.gis-left-toolbar]:hidden" data-left-open={leftOpen} data-overview-open={overviewOpen} onKeyDown={(event) => {
        if (event.key === "Escape" && !event.defaultPrevented && (simulationOpen || layersOpen || leftOpen || overviewOpen)) {
          event.preventDefault();
          if (simulationOpen) {
            setSimulationOpen(false);
            return;
          }
          if (layersOpen) {
            setLayersOpen(false);
            return;
          }
          dispatch({ type: "close-all" });
          lastTrigger.current?.focus();
        }
      }}>
        <h1 className="sr-only">Map Interaktif Jawa Barat</h1>
        {webglAvailable === false || useClassicMap ? (
          <InteractiveMap
            dataStatus={activeDataStatus}
            onRetryWebGL={webglAvailable ? () => setUseClassicMap(false) : undefined}
          >
            {(map) => (
              <>
                <RiverLayer map={map} mode={riverMode} regionIds={filters.regionIds} onStatus={setRiverStatus} />
                <ThematicLayers map={map} layerIds={filters.layerIds} regionIds={filters.regionIds} onStatus={setThematicStatus} />
                <MapSimulationLayer
                  map={map}
                  enabled={simulationOpen}
                  mode={simMode}
                  scope={simScope}
                  params={simParams}
                  paused={simPaused}
                  selectedTarget={simTarget}
                  evacuationSites={filteredEvacuationSites}
                  safeEvacRequestNonce={safeEvacRequestNonce}
                  onSafeEvacNoteChange={setSafeEvacNote}
                  onSelectTarget={handleSelectSimTarget}
                  onRegionResolved={setSimRegion}
                  onStatsChange={setSimStats}
                  onStatus={setSimStatus}
                />
                <EvacuationLayer map={map} sites={filteredEvacuationSites} enabled={evacuationEnabled} />
                <BoundaryLayer map={map} regionIds={filters.regionIds} onStatus={setRegionStatus} />
                <EvacuationRouting map={map} enabled={evacuationEnabled && !simulationOpen} onStatus={setRouteStatus} />
              </>
            )}
          </InteractiveMap>
        ) : webglAvailable && (
          <MapLibreWorkspaceMap
            riverMode={riverMode}
            onClassicFallback={() => setUseClassicMap(true)}
            layerIds={filters.layerIds}
            regionIds={filters.regionIds}
            evacuationSites={filteredEvacuationSites}
            evacuationEnabled={evacuationEnabled}
            simulationOpen={simulationOpen}
            simMode={simMode}
            simScope={simScope}
            simParams={simParams}
            simPaused={simPaused}
            simTarget={simTarget}
            focusRequest={focusRequest}
            safeEvacRequestNonce={safeEvacRequestNonce}
            onSafeEvacNoteChange={setSafeEvacNote}
            dataStatus={activeDataStatus}
            onSelectSimTarget={handleSelectSimTarget}
            onSimRegionResolved={setSimRegion}
            onSimStatsChange={setSimStats}
            onThematicStatus={setThematicStatus}
            onRegionStatus={setRegionStatus}
            onRiverStatus={setRiverStatus}
            onRouteStatus={setRouteStatus}
            onSimStatus={setSimStatus}
          />
        )}
        <HydroSimulationPanel
          open={simulationOpen}
          mode={simMode}
          scope={simScope}
          params={simParams}
          paused={simPaused}
          selectedRegion={simRegion}
          stats={simStats}
          safeEvacNote={safeEvacNote}
          canZoom3d={webglAvailable === true}
          onModeChange={(nextMode) => {
            setSimMode(nextMode);
            setSafeEvacNote(null);
          }}
          onScopeChange={(nextScope) => {
            setSimScope(nextScope);
            setSafeEvacNote(null);
          }}
          onParamsChange={(patch) => setSimParams((prev) => ({ ...prev, ...patch }))}
          onTogglePause={() => setSimPaused((prev) => !prev)}
          onZoomClose3d={handleZoomClose3d}
          onFindSafeEvac={handleFindSafeEvac}
          onPickExample={(regencyId, districtId) => {
            setSafeEvacNote(null);
            setSafeEvacRequestNonce(0);
            handlePickSimExample(regencyId, districtId);
          }}
          onResetRegion={() => {
            setSimTarget(null);
            setSimRegion(null);
            setSimStats(null);
            setFocusRequest(null);
            setSafeEvacRequestNonce(0);
            setSafeEvacNote(null);
          }}
        />
        <div
          className={`gis-left-toolbar pointer-events-none absolute top-4 left-4 z-3 flex flex-wrap items-center gap-2 ${
            overviewOpen ? "right-[calc(var(--overview-width)_+_56px)]" : "right-16"
          }`}
          role="group"
          aria-label="Alat peta"
        >
          {leftTools.map(({ id, label, icon, filledIcon }) => {
            const expanded = panels.left === id;
            const Icon = expanded ? filledIcon : icon;
            return (
              <Button
                key={id}
                type="button"
                variant={expanded ? "default" : "outline"}
                size="lg"
                className={`${floatingToolClassName} ${expanded ? "border border-primary" : "bg-white"}`}
                title={label}
                aria-label={`${expanded ? "Tutup" : "Buka"} panel ${label}`}
                aria-expanded={expanded}
                aria-controls={`gis-${id}-panel`}
                onClick={(event) => toggleLeft(id, event.currentTarget)}
              >
                <Icon className={`size-6 ${expanded && id === "regions" ? "[&>path:not(:first-of-type)]:stroke-primary" : ""}`} {...(expanded && id === "regions" ? { fill: "currentColor" } : {})} stroke={2} aria-hidden="true" />
                <span className="max-[539px]:sr-only">{label}</span>
              </Button>
            );
          })}
          <Button
            type="button"
            variant={simulationOpen ? "default" : "outline"}
            size="lg"
            className={`${floatingToolClassName} ${simulationOpen ? "border border-primary" : "bg-white"}`}
            title="Simulasi"
            aria-expanded={simulationOpen}
            aria-controls="gis-hydro-simulation-panel"
            onClick={toggleSimulation}
          >
            <IconRipple className="size-6" aria-hidden="true" />
            <span className="max-[539px]:sr-only">Simulasi</span>
          </Button>
          <div className={`flex min-w-0 flex-1 items-center ${layersOpen ? "min-w-[min(224px,100%)]" : ""}`}>
            <Button
              type="button"
              variant={layersOpen ? "default" : "outline"}
              size="lg"
              className={`${floatingToolClassName} relative z-1 ${layersOpen ? "border border-primary" : "bg-white"}`}
              title="Layer"
              aria-expanded={layersOpen}
              aria-controls="gis-layers-panel"
              onClick={() => setLayersOpen((prev) => !prev)}
            >
              {layersOpen ? <IconStack3Filled className="size-6" aria-hidden="true" /> : <IconStackFront className="size-6" aria-hidden="true" />}
              <span className="max-[539px]:sr-only">Layer</span>
            </Button>
            <div
              id="gis-layers-panel"
              hidden={!layersOpen}
              inert={!layersOpen}
              className="-ml-4 min-w-0 flex-1 [transform:translateX(0)] [transition:transform_var(--gis-slide-duration)_var(--gis-slide-easing),opacity_var(--gis-slide-duration)_var(--gis-slide-easing),display_var(--gis-slide-duration)_allow-discrete] [&[hidden]]:hidden [&[hidden]]:opacity-0 [&[hidden]]:[transform:translateX(-8px)] starting:[&:not([hidden])]:opacity-0 starting:[&:not([hidden])]:[transform:translateX(-8px)] motion-reduce:[transition:none]"
            >
              <MapQuickBar
                layers={data.layers}
                selectedLayerIds={filters.layerIds}
                evacuationCategories={evacuationCategories}
                onEvacuationCategoriesChange={setEvacuationCategories}
                onChange={updateFilters}
              />
            </div>
          </div>
        </div>
        <div className="pointer-events-none absolute inset-x-4 top-18 bottom-[62px] z-2 [&_.gis-left]:pointer-events-auto [&_.gis-left]:rounded-2xl [&_.gis-left]:border [&_.gis-left]:border-border">
          <RegionSidebar onWidthChange={setSidebarWidth} hidden={simulationOpen || panels.left !== "regions"} filters={filters} onChange={updateFilters} />
          <TimelineSidebar year={data.year} hidden={simulationOpen || panels.left !== "timeline"} filters={filters} onChange={updateFilters} />
          <LegendSidebar layers={data.layers} hidden={simulationOpen || panels.left !== "legends"} />
        </div>
        <div className="gis-overview-trigger absolute z-3 top-4 right-0 w-[var(--overview-width)] h-12 pointer-events-none [transform:translateX(0)] [transition:transform_var(--gis-slide-duration)_var(--gis-slide-easing)] motion-reduce:[transition:none]">
          <Button variant="ghost" size="icon" className="gis-panel-toggle origin-right z-3 w-12 h-12 p-4 bg-[white] text-[var(--gis-blue)] gis-overview-toggle absolute top-0 right-0 rounded-[16px_0_0_16px] bg-[white] pointer-events-auto hover:bg-white dark:hover:bg-white hover:text-[var(--gis-blue)] focus-visible:ring-0" aria-label={overviewOpen ? "Tutup panel overview" : "Buka panel overview"} aria-expanded={overviewOpen} aria-controls="gis-overview-panel" onClick={(event) => { lastTrigger.current = event.currentTarget; dispatch({ type: "toggle-overview", narrow }); }}><OverviewIcon className={`size-6 ${overviewOpen ? "rotate-90" : "-rotate-90"}`} aria-hidden="true" /></Button>
        </div>
        <aside id="gis-overview-panel" hidden={!overviewOpen} className="gis-right [clip-path:inset(0_round_16px_0_0_16px)] [transform:translateX(0)] [transition:transform_var(--gis-slide-duration)_var(--gis-slide-easing),display_var(--gis-slide-duration)_allow-discrete] [&[hidden]]:hidden [&[hidden]]:[transform:translateX(100%)] starting:[&:not([hidden])]:[transform:translateX(100%)] absolute z-2 [inset:0_0_0_auto] w-[var(--overview-width)] border-0 rounded-[16px_0_0_16px] bg-[white] overflow-hidden py-4 pl-4 max-[999.01px]:bottom-6 [--sb-thumb-color:#8EC5FF] [--sb-size:5px] motion-reduce:[transition:none] [&:has(.gis-ai-tab[data-state=active])]:pb-4 [&:has(.gis-ai-tab[data-state=active])_.gis-overview-scroll_>_.gis-tabs]:min-h-full [&:has(.gis-ai-tab[data-state=active])_.gis-overview-scroll_>_.gis-tabs]:min-h-0 [&:has(.gis-ai-tab[data-state=active])_.gis-overview-scroll_>_.gis-data-note]:hidden [&:has(.gis-ai-tab[data-state=active])_.gis-panel-tabs]:shrink-0 [&:has(.gis-ai-tab[data-state=active])_.gis-panel-tabs]:sticky [&:has(.gis-ai-tab[data-state=active])_.gis-panel-tabs]:top-0 [&:has(.gis-ai-tab[data-state=active])_.gis-panel-tabs]:z-10" aria-label="Ringkasan dan asisten">
          <div ref={overviewPanel} className="gis-overview-scroll h-full overflow-y-auto pr-[calc(16px_-_var(--sb-size))] [scrollbar-gutter:stable]">
          <Tabs defaultValue="overview" className="gis-tabs gap-4" onValueChange={(value) => { if (value === "ai") setAiOpened(true); overviewPanel.current?.scrollTo({ top: 0 }); }}>
            <OverviewButton className="gis-panel-tabs relative before:content-[''] before:absolute before:inset-x-0 before:top-[calc(-16px_-_1px)] before:h-4 before:bg-white before:pointer-events-none after:content-[''] after:absolute after:inset-x-0 after:top-[calc(100%_+_1px)] after:h-4 after:bg-white after:pointer-events-none" />
            <TabsContent value="overview" className="flex flex-col gap-4">
              <div className="flex shrink-0 items-center gap-2 rounded-2xl border border-blue-500 bg-transparent px-3 py-1.5 text-xs text-blue-500" aria-label="Keterangan waktu aktif">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  className="size-7 shrink-0 rounded-md text-blue-500 hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-50"
                  aria-label="Atur tanggal di Timeline"
                  title="Atur tanggal di Timeline"
                  onClick={() => dispatch({ type: "open-left", panel: "timeline", narrow })}
                >
                  <IconCalendarWeek className="size-5" aria-hidden="true" />
                </Button>
                <button
                  type="button"
                  onClick={() => {
                    if (activeTimePeriod.from) {
                      updateFilters({
                        period: "custom",
                        date: activeTimePeriod.from,
                        dateTo: activeTimePeriod.to || activeTimePeriod.from,
                      });
                    }
                    dispatch({ type: "open-left", panel: "timeline", narrow });
                  }}
                  className="min-w-0 flex-1 cursor-pointer text-left font-medium text-blue-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
                >
                  {activeTimeLabel}
                </button>
              </div>
              <OverviewPanel overview={overview} />
            </TabsContent>
            <TabsContent value="ai" className="gis-ai-tab [&[data-state=active]]:flex [&[data-state=active]]:min-h-0 [&[data-state=inactive]]:hidden" forceMount>{aiOpened && <BejirAssistant defaultLayerIds={filters.layerIds} />}</TabsContent>
          </Tabs>
          </div>
        </aside>
      </main>
    </div>
  );
}
