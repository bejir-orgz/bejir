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
import "./workspace.css";

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
    <div className="webgis-screen">
      <a className="skip-link" href="#gis-main">Lewati ke peta</a>
      <WebgisHeader dummy={data.source === "dummy"} mapCanvas />
      <main id="gis-main" className="gis-layout" data-left-open={leftOpen} data-overview-open={overviewOpen} onKeyDown={(event) => {
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
        <div className="gis-left-toolbar" role="group" aria-label="Alat peta">{leftTools.map(({ id, label, icon: Icon }) => (
          <Button key={id} variant="ghost" size="icon" className="gis-panel-toggle" title={label} inert={leftOpen && panels.left !== id} aria-label={`${panels.left === id ? "Tutup" : "Buka"} panel ${label}`} aria-expanded={panels.left === id} aria-controls={`gis-${id}-panel`} onClick={(event) => toggleLeft(id, event.currentTarget)}><Icon className="size-10" stroke={2} aria-hidden="true" /></Button>
        ))}</div>
        <div className="gis-overview-trigger">
          <Button variant="ghost" size="icon" className="gis-panel-toggle gis-overview-toggle" aria-label={overviewOpen ? "Tutup panel overview" : "Buka panel overview"} aria-expanded={overviewOpen} aria-controls="gis-overview-panel" onClick={(event) => { lastTrigger.current = event.currentTarget; dispatch({ type: "toggle-overview", narrow }); }}><IconLayoutNavbarCollapse className={`size-10 ${overviewOpen ? "rotate-90" : "-rotate-90"}`} aria-hidden="true" /></Button>
        </div>
        <aside id="gis-overview-panel" hidden={!overviewOpen} className="gis-right" aria-label="Ringkasan dan asisten">
          <Tabs defaultValue="overview" className="gis-tabs">
            <TabsList className="gis-panel-tabs" aria-label="Panel informasi">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="ai"><IconBrandGithubCopilot className="size-4" aria-hidden="true" />AI</TabsTrigger>
            </TabsList>
            <TabsContent value="overview"><OverviewPanel overview={data.overview} /></TabsContent>
            <TabsContent value="ai" className="gis-ai-tab" forceMount><DemoAssistant /></TabsContent>
          </Tabs>
          <p className="gis-data-note">{data.source === "dummy" ? `Contoh tampilan ${data.year}. Pilihan daerah hanya demonstrasi; statistik dan analisis ini adalah dummy.` : "Informasi disediakan oleh backend."}</p>
        </aside>
      </main>
    </div>
  );
}
