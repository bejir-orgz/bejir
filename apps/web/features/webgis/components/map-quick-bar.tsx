"use client";

import {
  IconAlertTriangle,
  IconChartBar,
  IconCloudRain,
  IconLayersIntersect,
  IconMap2,
  IconRoute,
} from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { toggleSelection } from "../region-tree";
import type { WorkspaceData, WorkspaceFilters } from "../types";

const quickLayerIcons: Record<string, { icon: typeof IconCloudRain; swatch: string }> = {
  susceptibility: { icon: IconChartBar, swatch: "#ff6a00" },
  rainfall: { icon: IconCloudRain, swatch: "#2563eb" },
  rivers: { icon: IconMap2, swatch: "#0284c7" },
  evacuation: { icon: IconRoute, swatch: "#16a34a" },
  dem: { icon: IconLayersIntersect, swatch: "#22c55e" },
  "land-cover": { icon: IconLayersIntersect, swatch: "#eab308" },
};

export function MapQuickBar({
  layers,
  selectedLayerIds,
  overviewOpen,
  simulationOpen,
  onToggleSimulation,
  onChange,
}: {
  layers: WorkspaceData["layers"];
  selectedLayerIds: string[];
  overviewOpen: boolean;
  simulationOpen: boolean;
  onToggleSimulation: () => void;
  onChange: (patch: Partial<WorkspaceFilters>) => void;
}) {
  return (
    <div
      className={`gis-quick-bar pointer-events-none absolute top-4 left-16 z-2 flex justify-center transition-[right] duration-280 ease-[var(--gis-slide-easing)] max-[999.01px]:top-3 max-[999.01px]:left-15 max-[999.01px]:right-16 ${
        overviewOpen ? "right-16 min-[1000px]:right-[calc(var(--overview-width)+16px)]" : "right-16"
      }`}
      role="region"
      aria-label="Pintasan layer peta dan simulasi edukatif"
    >
      <div className="pointer-events-auto flex max-w-full items-center gap-1.5 overflow-x-auto rounded-2xl border border-neutral-300 bg-white/95 p-1.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {layers.map((layer) => {
          const active = selectedLayerIds.includes(layer.id);
          const meta = quickLayerIcons[layer.id] ?? { icon: IconLayersIntersect, swatch: "#2563eb" };
          return (
            <Button
              key={layer.id}
              type="button"
              size="sm"
              variant={active ? "default" : "ghost"}
              aria-pressed={active}
              className={`h-8 shrink-0 gap-1.5 rounded-xl px-2.5 text-xs! font-medium! ${
                active
                  ? "bg-blue-600 text-white hover:bg-blue-700"
                  : "bg-transparent text-neutral-700 hover:bg-blue-50 hover:text-blue-700"
              }`}
              onClick={() => onChange({ layerIds: toggleSelection(selectedLayerIds, layer.id) })}
            >
              <span
                aria-hidden="true"
                className="size-2 shrink-0 rounded-full border border-black/15"
                style={{ backgroundColor: active ? "#ffffff" : meta.swatch }}
              />
              <span>{layer.label}</span>
            </Button>
          );
        })}

        <span className="mx-0.5 h-5 w-px shrink-0 bg-neutral-200" aria-hidden="true" />

        <Button
          type="button"
          size="sm"
          variant={simulationOpen ? "default" : "outline"}
          aria-expanded={simulationOpen}
          aria-controls="gis-hydro-simulation-panel"
          className={`h-8 shrink-0 gap-1.5 rounded-xl px-3 text-xs! font-semibold! ${
            simulationOpen
              ? "bg-indigo-600 border-indigo-600 text-white hover:bg-indigo-700"
              : "border-indigo-300 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 hover:text-indigo-800"
          }`}
          onClick={onToggleSimulation}
        >
          <IconAlertTriangle className="size-3.5" aria-hidden="true" />
          <span>Simulasi Peta</span>
        </Button>
      </div>
    </div>
  );
}
