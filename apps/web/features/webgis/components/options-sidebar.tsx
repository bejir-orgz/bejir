"use client";

import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import {
  EVACUATION_CATEGORIES,
  type EvacuationCategoryId,
} from "@/features/evacuation/nearby-fallback";
import type { WorkspaceData, WorkspaceFilters } from "../types";
import { toggleSelection } from "../region-tree";

export function OptionsSidebar({
  mode,
  data,
  filters,
  hidden,
  evacuationCategories,
  onEvacuationCategoriesChange,
  onChange,
}: {
  mode: "layers";
  data: WorkspaceData;
  filters: WorkspaceFilters;
  hidden: boolean;
  evacuationCategories: readonly EvacuationCategoryId[];
  onEvacuationCategoriesChange: (next: EvacuationCategoryId[]) => void;
  onChange: (patch: Partial<WorkspaceFilters>) => void;
}) {
  const options = data.layers;
  const selected = filters.layerIds;
  const count = data.layers.reduce((sum, layer) => sum + (filters.layerIds.includes(layer.id) ? layer.count : 0), 0);
  const title = "Layer List";

  const toggleCategory = (catId: EvacuationCategoryId) => {
    const exists = evacuationCategories.includes(catId);
    const next = exists
      ? evacuationCategories.filter((id) => id !== catId)
      : [...evacuationCategories, catId];
    onEvacuationCategoriesChange(next);
  };

  return (
    <aside
      id={`gis-${mode}-panel`}
      data-hidden={!!hidden}
      aria-hidden={hidden}
      inert={hidden}
      className="gis-left absolute z-2 [inset:0_auto_0_0] w-[var(--sidebar-width)] border-0 rounded-[0_16px_16px_0] bg-[white] overflow-hidden flex flex-col [clip-path:inset(0_round_0_16px_16px_0)] [transform:translateX(0)] [transition:transform_var(--gis-slide-duration)_var(--gis-slide-easing),visibility_var(--gis-slide-duration)] [&[data-hidden=true]]:invisible [&[data-hidden=true]]:[transform:translateX(-100%)] starting:[&[data-hidden=false]]:[transform:translateX(-100%)] [&_h1]:text-[24px] [&_h1]:leading-[32px] [&_h1]:font-medium [&_h2]:text-[24px] [&_h2]:leading-[32px] [&_h2]:font-medium [--sb-thumb-color:#8EC5FF] [--sb-size:5px] motion-reduce:[transition:none] gis-options-sidebar bottom-auto min-h-0 py-4 pl-4 max-h-[calc(100%_-_24px)]"
      aria-label={title}
    >
      <div className="gis-sidebar-scroll min-h-0 overflow-y-auto pr-[calc(16px_-_var(--sb-size))] [scrollbar-gutter:stable]">
        <div className="flex items-center justify-between gap-4">
          <h2>{title}</h2>
          {selected.length > 0 && (
            <Button
              type="button"
              variant="link"
              size="sm"
              className="text-red-500 no-underline hover:text-red-600 hover:no-underline"
              aria-label="Reset pilihan layer"
              onClick={() => onChange({ layerIds: [] })}
            >
              Reset
            </Button>
          )}
        </div>
        <p className="gis-active-count text-[12px] leading-[16px]" aria-live="polite">
          {count} Layer aktif
        </p>
        <div className="gis-option-list flex flex-col gap-2 mt-2">
          {options.map((option) => {
            const isChecked = selected.includes(option.id);
            return (
              <div key={option.id} className="flex flex-col gap-1.5">
                <Label className="gis-option-label flex items-center gap-2 min-h-6 text-[14px] leading-[20px] font-normal cursor-pointer">
                  <Checkbox
                    className="gis-checkbox w-[18px] h-[18px] m-[3px] [flex:0_0_18px] rounded-[2px] border-[#a1a1a1] shadow-none bg-[#fff] [&[data-state=checked]]:bg-[var(--gis-blue)] [&[data-state=checked]]:border-[var(--gis-blue)] [&[data-state=checked]]:text-[white] dark:bg-white"
                    aria-label={`Layer ${option.label}`}
                    checked={isChecked}
                    onCheckedChange={() => onChange({ layerIds: toggleSelection(selected, option.id) })}
                  />
                  <span>{option.label}</span>
                </Label>
                {option.id === "evacuation" && isChecked && (
                  <div
                    className="ml-7 flex flex-wrap gap-1.5 pb-1"
                    role="group"
                    aria-label="Filter kategori titik evakuasi"
                  >
                    {EVACUATION_CATEGORIES.map((cat) => {
                      const active = evacuationCategories.includes(cat.id);
                      return (
                        <button
                          key={cat.id}
                          type="button"
                          aria-pressed={active}
                          onClick={() => toggleCategory(cat.id)}
                          className={`h-6 cursor-pointer rounded-md border px-2 text-xs font-medium transition-colors ${
                            active
                              ? "border-[var(--gis-blue)] bg-[var(--accent)] text-[var(--accent-foreground)]"
                              : "border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-100"
                          }`}
                        >
                          {cat.label}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
        <p className="sr-only">
          Titik evakuasi, parameter hujan, rata-rata elevasi, kerawanan, dan tutupan lahan dominan terhubung ke API. Data parameter ditampilkan per kecamatan. Jaringan sungai ditampilkan per area peta.
        </p>
      </div>
    </aside>
  );
}
