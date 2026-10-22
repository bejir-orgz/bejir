"use client";

import { useState, useReducer, useRef, useSyncExternalStore } from "react";
import { WebgisHeader } from "@/components/layout/webgis-header";
import { IconMap, IconLayoutNavbarCollapse, IconBrandGithubCopilot, IconStackFront, IconList, IconCalendarWeek } from "@tabler/icons-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { DemoAssistant } from "@/features/assistant/components/demo-assistant";
import { InteractiveMap } from "@/features/map/components/interactive-map";
import type { WorkspaceFilters, WorkspaceProps } from "../types";
import { RegionSidebar } from "./region-sidebar";
import { OverviewPanel } from "./overview-panel";
import { OptionsSidebar } from "./options-sidebar";
import { TimelineSidebar } from "./timeline-sidebar";
import { initialPanelState, panelReducer, type LeftPanel } from "../panel-state";

const leftTools = [
  { id: "regions", label: "daerah", icon: IconMap },
  { id: "layers", label: "layer", icon: IconStackFront },
  { id: "legends", label: "legenda", icon: IconList },
  { id: "timeline", label: "timeline", icon: IconCalendarWeek },
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
  const narrow = useSyncExternalStore(subscribeToWidth, getNarrowSnapshot, getServerSnapshot);
  const [panels, dispatch] = useReducer(panelReducer, initialPanelState);
  const lastTrigger = useRef<HTMLButtonElement | null>(null);
  const overviewPanel = useRef<HTMLElement>(null);
  const leftOpen = panels.left !== null;
  const overviewOpen = panels.overview && (!narrow || !leftOpen);

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
      <main id="gis-main" className="gis-layout [--regions-width:264px] [--overview-width:456px] relative h-[calc(100%_-_64px)] isolate [&[data-left-open=false]]:[--regions-width:0px] [&[data-left-open=true]_.gis-left-toolbar_.gis-panel-toggle[aria-expanded=false]]:[opacity:0] [&[data-left-open=true]_.gis-left-toolbar_.gis-panel-toggle[aria-expanded=false]]:pointer-events-none [&[data-overview-open=true]_.gis-overview-trigger]:[transform:translateX(-100%)] min-[1000px]:[&[data-overview-open=true]_.gis-map_.leaflet-bottom.leaflet-right]:right-[var(--overview-width)]! min-[1000px]:max-[1199.01px]:[--overview-width:380px] max-[999.01px]:h-[calc(100%_-_112px)] max-[999.01px]:[--regions-width:0px] max-[999.01px]:[--overview-width:min(456px,calc(100%_-_56px))] max-[999.01px]:[&[data-left-open=true]_.gis-overview-toggle]:hidden max-[999.01px]:[&[data-overview-open=true]_.gis-left-toolbar]:hidden" data-left-open={leftOpen} data-overview-open={overviewOpen} onKeyDown={(event) => {
        if (event.key === "Escape" && !event.defaultPrevented && (leftOpen || overviewOpen)) {
          event.preventDefault();
          dispatch({ type: "close-all" });
          lastTrigger.current?.focus();
        }
      }}>
        <h1 className="sr-only">Map Interaktif Jawa Barat</h1>
        <InteractiveMap />
        <RegionSidebar hidden={panels.left !== "regions"} data={data} filters={filters} onChange={updateFilters} />
        <OptionsSidebar mode="layers" hidden={panels.left !== "layers"} data={data} filters={filters} onChange={updateFilters} />
        <OptionsSidebar mode="legends" hidden={panels.left !== "legends"} data={data} filters={filters} onChange={updateFilters} />
        <TimelineSidebar year={data.year} hidden={panels.left !== "timeline"} filters={filters} onChange={updateFilters} />
        <div className="gis-left-toolbar absolute top-4 left-0 flex flex-col gap-4 pointer-events-none [&_.gis-panel-toggle]:relative [&_.gis-panel-toggle]:z-1 [&_.gis-panel-toggle]:rounded-[0_16px_16px_0] [&_.gis-panel-toggle]:pointer-events-auto [&_.gis-panel-toggle]:[opacity:1] [&_.gis-panel-toggle]:[transform:translateX(0)] [&_.gis-panel-toggle]:[transition:transform_var(--gis-slide-duration)_var(--gis-slide-easing),opacity_120ms_ease] [&_.gis-panel-toggle[aria-expanded=true]]:z-3 [&_.gis-panel-toggle[aria-expanded=true]]:[transform:translateX(264px)] [&_.gis-panel-toggle[aria-expanded=true]]:bg-[white] max-[999.01px]:gap-2 motion-reduce:[&_.gis-panel-toggle]:[transition:none]" role="group" aria-label="Alat peta">{leftTools.map(({ id, label, icon: Icon }) => (
          <Button key={id} variant="ghost" size="icon" className="gis-panel-toggle z-3 w-18 h-18 p-4 bg-[white] text-[var(--gis-blue)] max-[999.01px]:w-14 max-[999.01px]:h-14 max-[999.01px]:p-3 max-[999.01px]:[&_svg]:w-8 max-[999.01px]:[&_svg]:h-8 hover:bg-white dark:hover:bg-white hover:text-[var(--gis-blue)]" title={label} inert={leftOpen && panels.left !== id} aria-label={`${panels.left === id ? "Tutup" : "Buka"} panel ${label}`} aria-expanded={panels.left === id} aria-controls={`gis-${id}-panel`} onClick={(event) => toggleLeft(id, event.currentTarget)}><Icon className="size-10" stroke={2} aria-hidden="true" /></Button>
        ))}</div>
        <div className="gis-overview-trigger absolute z-3 top-4 right-0 w-[var(--overview-width)] h-18 pointer-events-none [transform:translateX(0)] [transition:transform_var(--gis-slide-duration)_var(--gis-slide-easing)] max-[999.01px]:h-14 motion-reduce:[transition:none]">
          <Button variant="ghost" size="icon" className="gis-panel-toggle z-3 w-18 h-18 p-4 bg-[white] text-[var(--gis-blue)] max-[999.01px]:w-14 max-[999.01px]:h-14 max-[999.01px]:p-3 max-[999.01px]:[&_svg]:w-8 max-[999.01px]:[&_svg]:h-8 gis-overview-toggle absolute top-0 right-0 rounded-[16px_0_0_16px] bg-[white] pointer-events-auto hover:bg-white dark:hover:bg-white hover:text-[var(--gis-blue)]" aria-label={overviewOpen ? "Tutup panel overview" : "Buka panel overview"} aria-expanded={overviewOpen} aria-controls="gis-overview-panel" onClick={(event) => { lastTrigger.current = event.currentTarget; dispatch({ type: "toggle-overview", narrow }); }}><IconLayoutNavbarCollapse className={`size-10 ${overviewOpen ? "rotate-90" : "-rotate-90"}`} aria-hidden="true" /></Button>
        </div>
        <aside ref={overviewPanel} id="gis-overview-panel" hidden={!overviewOpen} className="gis-right [clip-path:inset(0_round_16px_0_0_16px)] [scrollbar-gutter:stable] [transform:translateX(0)] [transition:transform_var(--gis-slide-duration)_var(--gis-slide-easing),display_var(--gis-slide-duration)_allow-discrete] [&[hidden]]:hidden [&[hidden]]:[transform:translateX(100%)] starting:[&:not([hidden])]:[transform:translateX(100%)] absolute z-2 [inset:0_0_0_auto] w-[var(--overview-width)] border-0 rounded-[16px_0_0_16px] bg-[white] overflow-y-auto p-[16px_16px_28px] max-[999.01px]:bottom-6 max-[639.01px]:p-[15px_8px] [--sb-track-color:#fff] [--sb-thumb-color:#8EC5FF] [--sb-size:8px] [scrollbar-width:auto] [&::-webkit-scrollbar]:w-[var(--sb-size)] [&::-webkit-scrollbar-track]:bg-[var(--sb-track-color)] [&::-webkit-scrollbar-track]:rounded-2xl [&::-webkit-scrollbar-track]:my-0 [&::-webkit-scrollbar-thumb]:bg-[var(--sb-thumb-color)] [&::-webkit-scrollbar-thumb]:rounded-2xl [@supports_not_selector(::-webkit-scrollbar)]:[scrollbar-color:var(--sb-thumb-color)_var(--sb-track-color)] motion-reduce:[transition:none] [&:has(.gis-ai-tab[data-state=active])]:pb-4 [&:has(.gis-ai-tab[data-state=active])_>_.gis-tabs]:min-h-full [&:has(.gis-ai-tab[data-state=active])_>_.gis-tabs]:min-h-0 [&:has(.gis-ai-tab[data-state=active])_>_.gis-data-note]:hidden [&:has(.gis-ai-tab[data-state=active])_.gis-panel-tabs]:shrink-0 [&:has(.gis-ai-tab[data-state=active])_.gis-panel-tabs]:sticky [&:has(.gis-ai-tab[data-state=active])_.gis-panel-tabs]:top-0 [&:has(.gis-ai-tab[data-state=active])_.gis-panel-tabs]:z-10" aria-label="Ringkasan dan asisten">
          <Tabs defaultValue="overview" className="gis-tabs gap-4" onValueChange={() => overviewPanel.current?.scrollTo({ top: 0 })}>
            <TabsList className="gis-panel-tabs relative before:content-[''] before:absolute before:inset-x-0 before:-top-4 before:h-4 before:bg-white after:content-[''] after:absolute after:inset-x-0 after:top-full after:h-4 after:bg-white flex w-full gap-2 p-2 h-12 mb-0 [border:1px_solid_var(--gis-blue)] rounded-2xl bg-[#dbeafe] [&_button]:flex-1 [&_button]:h-8 [&_button]:p-2 [&_button]:text-[#737373] [&_button]:text-[12px] [&_button]:font-semibold [&_button]:leading-[16px] [&_button]:rounded-lg [&_[data-state=active]]:text-[#fafafa] [&_[data-state=active]]:bg-[var(--gis-blue)] h-12!" aria-label="Panel informasi">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="ai"><IconBrandGithubCopilot className="size-4" aria-hidden="true" />AI</TabsTrigger>
            </TabsList>
            <TabsContent value="overview"><OverviewPanel overview={data.overview} /></TabsContent>
            <TabsContent value="ai" className="gis-ai-tab [&[data-state=active]]:flex [&[data-state=active]]:min-h-0 [&[data-state=inactive]]:hidden" forceMount><DemoAssistant /></TabsContent>
          </Tabs>
          <p className="gis-data-note text-[var(--gis-muted)] text-[11px] leading-[16px] mt-4">{data.source === "dummy" ? `Contoh tampilan ${data.year}. Pilihan daerah hanya demonstrasi; statistik dan analisis ini adalah dummy.` : "Informasi disediakan oleh backend."}</p>
        </aside>
      </main>
    </div>
  );
}
