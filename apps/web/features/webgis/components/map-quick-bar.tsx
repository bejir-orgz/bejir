"use client";

import { IconRipple } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { toggleSelection } from "../region-tree";
import type { WorkspaceData, WorkspaceFilters } from "../types";

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
      aria-label="Pintasan layer peta dan simulasi"
    >
      <div className="pointer-events-auto flex max-w-full items-center rounded-2xl border border-neutral-200 bg-white p-1">
        <div className="flex min-w-0 items-center gap-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {layers.map((layer) => {
            const active = selectedLayerIds.includes(layer.id);
            return (
              <Button
                key={layer.id}
                type="button"
                size="sm"
                variant="ghost"
                aria-pressed={active}
                className={`h-8 shrink-0 rounded-xl px-3 text-xs! font-medium! transition-colors ${
                  active
                    ? "bg-[var(--gis-blue)] text-white hover:bg-[#1d6ef0] hover:text-white"
                    : "bg-transparent text-neutral-700 hover:bg-neutral-100 hover:text-neutral-900"
                }`}
                onClick={() => onChange({ layerIds: toggleSelection(selectedLayerIds, layer.id) })}
              >
                <span>{layer.label}</span>
              </Button>
            );
          })}
        </div>

        <span className="mx-1 h-4 w-px shrink-0 bg-neutral-200" aria-hidden="true" />

        <Button
          type="button"
          size="sm"
          variant={simulationOpen ? "default" : "ghost"}
          aria-expanded={simulationOpen}
          aria-controls="gis-hydro-simulation-panel"
          className={`h-8 shrink-0 gap-1.5 rounded-xl px-3 text-xs! font-medium! transition-colors ${
            simulationOpen ? "" : "bg-muted text-foreground"
          }`}
          onClick={onToggleSimulation}
        >
          <IconRipple className="size-3.5" aria-hidden="true" />
          <span>Simulasi</span>
        </Button>
      </div>
    </div>
  );
}
