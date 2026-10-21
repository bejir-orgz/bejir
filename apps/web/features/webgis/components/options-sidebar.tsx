"use client";

import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import type { WorkspaceData, WorkspaceFilters } from "../types";
import { toggleSelection } from "../region-tree";

export function OptionsSidebar({ mode, data, filters, hidden, onChange }: {
  mode: "layers" | "legends";
  data: WorkspaceData;
  filters: WorkspaceFilters;
  hidden: boolean;
  onChange: (patch: Partial<WorkspaceFilters>) => void;
}) {
  const layers = mode === "layers";
  const options = layers ? data.layers : data.legends;
  const selected = layers ? filters.layerIds : filters.legendIds;
  const count = data.layers.reduce((sum, layer) => sum + (filters.layerIds.includes(layer.id) ? layer.count : 0), 0);
  const title = layers ? "Layer List" : "Legenda";

  return (
    <aside id={`gis-${mode}-panel`} hidden={hidden} className="gis-left gis-options-sidebar" aria-label={title}>
      <h2>{title}</h2>
      {layers ? <p className="gis-active-count" aria-live="polite">{count} Layer aktif</p> : null}
      <div className="gis-option-list">{options.map((option) => (
        <Label key={option.id} className="gis-option-label">
          <Checkbox className="gis-checkbox" aria-label={`${layers ? "Layer" : "Legenda"} ${option.label}`} checked={selected.includes(option.id)} onCheckedChange={() => onChange({ [layers ? "layerIds" : "legendIds"]: toggleSelection(selected, option.id) })} />
          <span>{option.label}</span>
        </Label>
      ))}</div>
      <p className="sr-only">Pilihan dummy, tanpa layer atau data tematik yang terhubung.</p>
    </aside>
  );
}
