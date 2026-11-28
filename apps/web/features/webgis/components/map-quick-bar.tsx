"use client";

import { IconAdjustmentsHorizontal } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { EVACUATION_CATEGORIES, type EvacuationCategoryId } from "@/features/evacuation/nearby-fallback";
import { toggleSelection } from "../region-tree";
import type { WorkspaceData, WorkspaceFilters } from "../types";

export function MapQuickBar({
  layers,
  selectedLayerIds,
  evacuationCategories,
  onEvacuationCategoriesChange,
  onChange,
}: {
  layers: WorkspaceData["layers"];
  selectedLayerIds: string[];
  evacuationCategories: readonly EvacuationCategoryId[];
  onEvacuationCategoriesChange: (categories: EvacuationCategoryId[]) => void;
  onChange: (patch: Partial<WorkspaceFilters>) => void;
}) {
  return (
    <div
      className="gis-quick-bar flex min-w-0 max-w-full"
      role="region"
      aria-label="Pilihan layer peta"
    >
      <div className="pointer-events-auto flex h-12 max-w-full items-center rounded-r-2xl border border-l-0 border-border bg-card pr-1 pl-5">
        <div className="flex min-w-0 items-center gap-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {layers.map((layer) => {
            const active = selectedLayerIds.includes(layer.id);
            return (
              <div key={layer.id} className="flex shrink-0 items-center gap-1">
                <Button
                  type="button"
                  size="sm"
                  variant={active ? "default" : "ghost"}
                  aria-pressed={active}
                  className="h-9 rounded-xl px-3 text-sm! font-medium!"
                  onClick={() => onChange({ layerIds: toggleSelection(selectedLayerIds, layer.id) })}
                >
                  {layer.label}
                </Button>
                {layer.id === "evacuation" && active && (
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button type="button" variant="ghost" size="icon-sm" title="Filter kategori titik evakuasi" aria-label="Filter kategori titik evakuasi">
                        <IconAdjustmentsHorizontal className="size-5" aria-hidden="true" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent align="start" className="flex flex-col gap-3 rounded-2xl" aria-labelledby="gis-evacuation-category-title">
                      <h2 id="gis-evacuation-category-title" className="text-sm font-medium">Kategori titik evakuasi</h2>
                      <div className="flex flex-wrap gap-2">
                        {EVACUATION_CATEGORIES.map(({ id, label }) => {
                          const selected = evacuationCategories.includes(id);
                          return (
                            <Button
                              key={id}
                              type="button"
                              size="sm"
                              variant={selected ? "default" : "outline"}
                              aria-pressed={selected}
                              onClick={() => onEvacuationCategoriesChange(
                                selected ? evacuationCategories.filter((category) => category !== id) : [...evacuationCategories, id],
                              )}
                            >
                              {label}
                            </Button>
                          );
                        })}
                      </div>
                    </PopoverContent>
                  </Popover>
                )}
              </div>
            );
          })}
        </div>
        {selectedLayerIds.length > 0 && (
          <Button
            type="button"
            variant="link"
            size="sm"
            className="ml-1 text-red-500 no-underline hover:text-red-600 hover:no-underline"
            aria-label="Reset pilihan layer"
            onClick={() => onChange({ layerIds: [] })}
          >
            Reset
          </Button>
        )}
        <p className="sr-only" aria-live="polite">
          {layers.reduce((count, layer) => count + (selectedLayerIds.includes(layer.id) ? layer.count : 0), 0)} layer aktif
        </p>
        <p className="sr-only">
          Titik evakuasi, parameter hujan, rata-rata elevasi, kerawanan, dan tutupan lahan dominan terhubung ke API. Data parameter ditampilkan per kecamatan. Jaringan sungai ditampilkan per area peta.
        </p>
      </div>
    </div>
  );
}
