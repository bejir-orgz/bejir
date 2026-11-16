import { classColors } from "@/features/geography/aggregation";
import type { WorkspaceData } from "../types";

export function LegendBar({ layers }: { layers: WorkspaceData["layers"] }) {
  const legends = layers.filter((layer) => ["rainfall", "evacuation", "rivers", "dem", "susceptibility"].includes(layer.id));
  return (
    <aside aria-label="Legenda peta" className="gis-legend-bar absolute z-1 bottom-6 left-16 right-16 rounded-2xl border border-[var(--gis-border)] bg-white px-4 py-3 max-h-40 overflow-auto text-[12px] leading-4 min-[1000px]:[[data-overview-open=true]_&]:right-[calc(var(--overview-width)_+_16px)] min-[1000px]:[[data-left-open=true]_&]:left-[calc(var(--regions-width)_+_16px)] max-[999px]:left-4 max-[999px]:right-16 max-[999px]:max-h-32 [--sb-thumb-color:#8EC5FF] [--sb-size:4px]">
      <div className="flex items-start gap-4">
        <h2 className="shrink-0 text-[14px] leading-5 font-medium">Legenda</h2>
          <div className="flex min-w-0 flex-wrap gap-x-6 gap-y-3">
            {legends.map((layer) => (
              <div key={layer.id} className="flex flex-wrap items-center gap-2">
                <span className="font-medium">{layer.label}</span>
                {layer.id === "rivers" ? <span className="flex items-center gap-2"><span className="h-0.5 w-6 bg-[#0284c7]" />Segmen sungai</span>
                  : layer.id === "evacuation" ? <span className="flex items-center gap-2"><span className="size-2.5 rounded-full border border-[#2563eb] bg-white" />Titik evakuasi</span>
                    : <span className="flex items-center gap-2"><span>{layer.id === "susceptibility" ? "Sangat Rendah" : "Rendah"}</span><span className="h-3 w-20 rounded-sm" style={{ background: layer.id === "susceptibility" ? `linear-gradient(to right, ${classColors.join(", ")})` : layer.id === "dem" ? "linear-gradient(to right, hsl(120 45% 80%), hsl(70 45% 57.5%), hsl(20 45% 35%))" : "linear-gradient(to right, hsl(215 80% 92%), hsl(215 80% 35%))" }} /><span>{layer.id === "susceptibility" ? "Sangat Tinggi" : "Tinggi"}</span></span>}
              </div>
            ))}
          </div>
      </div>
    </aside>
  );
}
