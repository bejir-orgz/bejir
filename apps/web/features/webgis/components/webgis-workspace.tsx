"use client";

import { useState, useReducer, useRef, useSyncExternalStore } from "react";
import { WebgisHeader } from "@/components/layout/webgis-header";
import { IconMap, IconLayoutNavbarCollapse, IconLayoutNavbarCollapseFilled, IconStackFront, IconStack3Filled, IconInfoCircle, IconInfoCircleFilled, IconCalendarWeek, IconCalendarWeekFilled } from "@tabler/icons-react";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { OverviewButton } from "@/components/ui/overview-button";
import { BejirAssistant } from "@/features/assistant/components/assistant";
import { InteractiveMap } from "@/features/map/components/interactive-map";
import { EvacuationLayer } from "@/features/evacuation/evacuation-layer";
import { useEvacuationSites } from "@/features/evacuation/use-evacuation-sites";
import { EvacuationRouting } from "@/features/evacuation/evacuation-routing";
import { BoundaryLayer } from "@/features/regions/boundary-layer";
import { useOverview } from "../use-overview";
import { ThematicLayers } from "@/features/geography/thematic-layers";
import type { WorkspaceFilters, WorkspaceProps } from "../types";
import { RegionSidebar } from "./region-sidebar";
import { OverviewPanel } from "./overview-panel";
import { OptionsSidebar } from "./options-sidebar";
import { TimelineSidebar } from "./timeline-sidebar";
import { initialPanelState, panelReducer, type LeftPanel } from "../panel-state";

const leftTools = [
  { id: "regions", label: "daerah", icon: IconMap, filledIcon: IconMap },
  { id: "layers", label: "layer", icon: IconStackFront, filledIcon: IconStack3Filled },
  { id: "legends", label: "legenda", icon: IconInfoCircle, filledIcon: IconInfoCircleFilled },
  { id: "timeline", label: "timeline", icon: IconCalendarWeek, filledIcon: IconCalendarWeekFilled },
] as const;

const narrowQuery = "(max-width: 999px)";
function subscribeToWidth(callback: () => void) {
  const media = window.matchMedia(narrowQuery);
  media.addEventListener("change", callback);
  return () => media.removeEventListener("change", callback);
}
const getNarrowSnapshot = () => window.matchMedia(narrowQuery).matches;
const getServerSnapshot = () => false;

export function WebgisWorkspace({ data, onFiltersChange }: WorkspaceProps) {
  const [filters, setFilters] = useState(data.initialFilters);
  const evacuationEnabled = filters.layerIds.includes("evacuation");
  const evacuation = useEvacuationSites(evacuationEnabled);
  const [routeStatus, setRouteStatus] = useState<{ message: string }>();
  const [regionStatus, setRegionStatus] = useState<{ message: string }>();
  const [thematicStatus, setThematicStatus] = useState<{ message: string; retry?: () => void }>();
  const narrow = useSyncExternalStore(subscribeToWidth, getNarrowSnapshot, getServerSnapshot);
  const [panels, dispatch] = useReducer(panelReducer, initialPanelState);
  const lastTrigger = useRef<HTMLButtonElement | null>(null);
  const overviewPanel = useRef<HTMLElement>(null);
  const leftOpen = panels.left !== null;
  const overviewOpen = panels.overview && (!narrow || !leftOpen);
  const overview = useOverview(data.overview, filters, overviewOpen);
  const OverviewIcon = overviewOpen ? IconLayoutNavbarCollapseFilled : IconLayoutNavbarCollapse;

  function updateFilters(patch: Partial<WorkspaceFilters>) {
    const next = { ...filters, ...patch };
    setFilters(next);
    onFiltersChange?.(next);
  }

  function toggleLeft(panel: LeftPanel, trigger: HTMLButtonElement) {
    lastTrigger.current = trigger;
    dispatch({ type: "toggle-left", panel, narrow });
  }

  return (
    <div className="webgis-screen [--gis-blue:var(--primary)] [--gis-border:var(--border)] [--gis-muted:#737373] [--gis-slide-duration:280ms] [--gis-slide-easing:cubic-bezier(.22,1,.36,1)] text-[#000] bg-[#fff] text-[14px] leading-[20px] h-dvh min-h-120 overflow-hidden [&_button:focus-visible]:[outline:2px_solid_var(--gis-blue)] [&_button:focus-visible]:[outline-offset:-2px]">
      <a className="skip-link fixed z-50 top-2 left-4 [transform:translateY(-150%)] rounded-lg bg-[#2563eb] text-[white] p-[8px_16px] [&:focus]:[transform:translateY(0)]" href="#gis-main">Lewati ke peta</a>
      <WebgisHeader dummy={data.source === "dummy"} mapCanvas />
      <main id="gis-main" className="gis-layout [--regions-width:264px] [--overview-width:456px] relative h-[calc(100%_-_64px)] isolate [&[data-left-open=false]]:[--regions-width:0px] [&[data-left-open=true]_.gis-left-toolbar_.gis-panel-toggle[aria-expanded=false]]:[opacity:0] [&[data-left-open=true]_.gis-left-toolbar_.gis-panel-toggle[aria-expanded=false]]:pointer-events-none [&[data-overview-open=true]_.gis-overview-trigger]:[transform:translateX(-100%)] [&[data-overview-open=true]_.gis-map-controls]:right-[calc(var(--overview-width)_+_16px)] min-[1000px]:[&[data-overview-open=true]_.gis-map_.leaflet-bottom.leaflet-right]:right-[var(--overview-width)]! min-[1000px]:max-[1199.01px]:[--overview-width:380px] max-[999.01px]:h-[calc(100%_-_112px)] max-[999.01px]:[--regions-width:0px] max-[999.01px]:[--overview-width:min(456px,calc(100%_-_56px))] max-[999.01px]:[&[data-left-open=true]_.gis-overview-toggle]:hidden max-[999.01px]:[&[data-overview-open=true]_.gis-left-toolbar]:hidden" data-left-open={leftOpen} data-overview-open={overviewOpen} onKeyDown={(event) => {
        if (event.key === "Escape" && !event.defaultPrevented && (leftOpen || overviewOpen)) {
          event.preventDefault();
          dispatch({ type: "close-all" });
          lastTrigger.current?.focus();
        }
      }}>
        <h1 className="sr-only">Map Interaktif Jawa Barat</h1>
        <InteractiveMap dataStatus={regionStatus ?? routeStatus ?? thematicStatus ?? evacuation.dataStatus}>{(map) => <><ThematicLayers map={map} layerIds={filters.layerIds} regionIds={filters.regionIds} onStatus={setThematicStatus} /><EvacuationLayer map={map} sites={evacuation.sites} enabled={evacuationEnabled} /><BoundaryLayer map={map} regionIds={filters.regionIds} onStatus={setRegionStatus} /><EvacuationRouting map={map} enabled={evacuationEnabled} onStatus={setRouteStatus} /></>}</InteractiveMap>
        <RegionSidebar hidden={panels.left !== "regions"} filters={filters} onChange={updateFilters} />
        <OptionsSidebar mode="layers" hidden={panels.left !== "layers"} data={data} filters={filters} onChange={updateFilters} />
        <OptionsSidebar mode="legends" hidden={panels.left !== "legends"} data={data} filters={filters} onChange={updateFilters} />
        <TimelineSidebar year={data.year} hidden={panels.left !== "timeline"} filters={filters} onChange={updateFilters} />
        <div className="gis-left-toolbar absolute top-4 left-0 flex flex-col gap-4 pointer-events-none [&_.gis-panel-toggle]:relative [&_.gis-panel-toggle]:z-1 [&_.gis-panel-toggle]:rounded-[0_16px_16px_0] [&_.gis-panel-toggle]:pointer-events-auto [&_.gis-panel-toggle]:[opacity:1] [&_.gis-panel-toggle]:[transform:translateX(0)] [&_.gis-panel-toggle]:[transition:transform_var(--gis-slide-duration)_var(--gis-slide-easing),opacity_120ms_ease] [&_.gis-panel-toggle[aria-expanded=true]]:z-3 [&_.gis-panel-toggle[aria-expanded=true]]:[transform:translateX(264px)] [&_.gis-panel-toggle[aria-expanded=true]]:bg-[white] max-[999.01px]:gap-2 motion-reduce:[&_.gis-panel-toggle]:[transition:none]" role="group" aria-label="Alat peta">{leftTools.map(({ id, label, icon, filledIcon }) => {
          const expanded = panels.left === id;
          const Icon = expanded ? filledIcon : icon;
          return (
          <Button key={id} variant="ghost" size="icon" className="gis-panel-toggle z-3 w-12 h-12 p-4 bg-[white] text-[var(--gis-blue)] max-[999.01px]:w-12 max-[999.01px]:h-12 max-[999.01px]:p-3 hover:bg-white dark:hover:bg-white hover:text-[var(--gis-blue)]" title={label} inert={leftOpen && panels.left !== id} aria-label={`${panels.left === id ? "Tutup" : "Buka"} panel ${label}`} aria-expanded={panels.left === id} aria-controls={`gis-${id}-panel`} onClick={(event) => toggleLeft(id, event.currentTarget)}><Icon className={`size-6 ${expanded && id === "regions" ? "[&>path:not(:first-of-type)]:stroke-white" : ""}`} {...(expanded && id === "regions" ? { fill: "currentColor" } : {})} stroke={2} aria-hidden="true" /></Button>
        );
        })}</div>
        <div className="gis-overview-trigger absolute z-3 top-4 right-0 w-[var(--overview-width)] h-12 pointer-events-none [transform:translateX(0)] [transition:transform_var(--gis-slide-duration)_var(--gis-slide-easing)] max-[999.01px]:h-14 motion-reduce:[transition:none]">
          <Button variant="ghost" size="icon" className="gis-panel-toggle z-3 w-12 h-12 p-4 bg-[white] text-[var(--gis-blue)] max-[999.01px]:w-14 max-[999.01px]:h-14 max-[999.01px]:p-3 gis-overview-toggle absolute top-0 right-0 rounded-[16px_0_0_16px] bg-[white] pointer-events-auto hover:bg-white dark:hover:bg-white hover:text-[var(--gis-blue)]" aria-label={overviewOpen ? "Tutup panel overview" : "Buka panel overview"} aria-expanded={overviewOpen} aria-controls="gis-overview-panel" onClick={(event) => { lastTrigger.current = event.currentTarget; dispatch({ type: "toggle-overview", narrow }); }}><OverviewIcon className={`size-6 ${overviewOpen ? "rotate-90" : "-rotate-90"}`} aria-hidden="true" /></Button>
        </div>
        <aside ref={overviewPanel} id="gis-overview-panel" hidden={!overviewOpen} className="gis-right [clip-path:inset(0_round_16px_0_0_16px)] [transform:translateX(0)] [transition:transform_var(--gis-slide-duration)_var(--gis-slide-easing),display_var(--gis-slide-duration)_allow-discrete] [&[hidden]]:hidden [&[hidden]]:[transform:translateX(100%)] starting:[&:not([hidden])]:[transform:translateX(100%)] absolute z-2 [inset:0_0_0_auto] w-[var(--overview-width)] border-0 rounded-[16px_0_0_16px] bg-[white] overflow-y-auto p-[16px_16px_28px] max-[999.01px]:bottom-6 max-[639.01px]:p-[15px_8px] [--sb-thumb-color:#8EC5FF] [--sb-size:5px] motion-reduce:[transition:none] [&:has(.gis-ai-tab[data-state=active])]:pb-4 [&:has(.gis-ai-tab[data-state=active])_>_.gis-tabs]:min-h-full [&:has(.gis-ai-tab[data-state=active])_>_.gis-tabs]:min-h-0 [&:has(.gis-ai-tab[data-state=active])_>_.gis-data-note]:hidden [&:has(.gis-ai-tab[data-state=active])_.gis-panel-tabs]:shrink-0 [&:has(.gis-ai-tab[data-state=active])_.gis-panel-tabs]:sticky [&:has(.gis-ai-tab[data-state=active])_.gis-panel-tabs]:top-0 [&:has(.gis-ai-tab[data-state=active])_.gis-panel-tabs]:z-10" aria-label="Ringkasan dan asisten">
          <Tabs defaultValue="overview" className="gis-tabs gap-4" onValueChange={() => overviewPanel.current?.scrollTo({ top: 0 })}>
            <OverviewButton className="gis-panel-tabs relative before:content-[''] before:absolute before:inset-x-0 before:top-[calc(-16px_-_1px)] before:h-4 before:bg-white before:pointer-events-none after:content-[''] after:absolute after:inset-x-0 after:top-[calc(100%_+_1px)] after:h-4 after:bg-white after:pointer-events-none" />
            <TabsContent value="overview"><OverviewPanel overview={overview} /></TabsContent>
            <TabsContent value="ai" className="gis-ai-tab [&[data-state=active]]:flex [&[data-state=active]]:min-h-0 [&[data-state=inactive]]:hidden" forceMount><BejirAssistant /></TabsContent>
          </Tabs>
          <p className="gis-data-note text-[var(--gis-muted)] text-[11px] leading-[16px] mt-4">Sumber backend. — menandakan data tidak tersedia. Filter waktu berlaku pada histori kejadian.</p>
        </aside>
      </main>
    </div>
  );
}
