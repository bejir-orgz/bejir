"use client";

import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import type { WorkspaceData, WorkspaceFilters } from "../types";
import { toggleSelection } from "../region-tree";

export function OptionsSidebar({ mode, data, filters, hidden, onChange }: {
  mode: "layers";
  data: WorkspaceData;
  filters: WorkspaceFilters;
  hidden: boolean;
  onChange: (patch: Partial<WorkspaceFilters>) => void;
}) {
  const options = data.layers;
  const selected = filters.layerIds;
  const count = data.layers.reduce((sum, layer) => sum + (filters.layerIds.includes(layer.id) ? layer.count : 0), 0);
  const title = "Layer List";

  return (
    <aside id={`gis-${mode}-panel`} hidden={hidden} className="gis-left absolute z-2 [inset:0_auto_0_0] w-66 border-0 rounded-[0_16px_16px_0] bg-[white] overflow-y-auto [clip-path:inset(0_round_0_16px_16px_0)] [transform:translateX(0)] [transition:transform_var(--gis-slide-duration)_var(--gis-slide-easing),display_var(--gis-slide-duration)_allow-discrete] [&[hidden]]:hidden [&[hidden]]:[transform:translateX(-100%)] starting:[&:not([hidden])]:[transform:translateX(-100%)] [&_h1]:text-[24px] [&_h1]:leading-[32px] [&_h1]:font-medium [&_h2]:text-[24px] [&_h2]:leading-[32px] [&_h2]:font-medium [--sb-thumb-color:#8EC5FF] [--sb-size:4px] motion-reduce:[transition:none] gis-options-sidebar bottom-auto min-h-0 p-4 max-h-[calc(100%_-_24px)]" aria-label={title}>
      <h2>{title}</h2>
      <p className="gis-active-count text-[12px] leading-[16px]" aria-live="polite">{count} Layer aktif</p>
      <div className="gis-option-list flex flex-col gap-2 mt-2">{options.map((option) => (
        <Label key={option.id} className="gis-option-label flex items-center gap-2 min-h-6 text-[14px] leading-[20px] font-normal cursor-pointer">
          <Checkbox className="gis-checkbox w-[18px] h-[18px] m-[3px] [flex:0_0_18px] rounded-[2px] border-[#a1a1a1] shadow-none bg-[#fff] [&[data-state=checked]]:bg-[var(--gis-blue)] [&[data-state=checked]]:border-[var(--gis-blue)] [&[data-state=checked]]:text-[white] dark:bg-white" aria-label={`Layer ${option.label}`} checked={selected.includes(option.id)} onCheckedChange={() => onChange({ layerIds: toggleSelection(selected, option.id) })} />
          <span>{option.label}</span>
        </Label>
      ))}</div>
      <p className="sr-only">Titik evakuasi, parameter hujan, rata-rata elevasi, kerawanan, dan tutupan lahan dominan terhubung ke API. Data parameter ditampilkan per kecamatan. Jaringan sungai ditampilkan per area peta. Layer area kejadian banjir belum memiliki geometri pada API.</p>
    </aside>
  );
}
