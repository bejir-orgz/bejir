import { classColors, classLabels } from "@/features/geography/aggregation";
import { landCoverColors } from "@/features/geography/land-cover-colors";
import type { WorkspaceData } from "../types";

const relativeLabels = ["Minimum", "25% rentang", "50% rentang", "75% rentang", "Maksimum"];

export function LegendSidebar({ layers, hidden }: { layers: WorkspaceData["layers"]; hidden: boolean }) {
  const legends = layers.filter((layer) => ["rainfall", "evacuation", "rivers", "dem", "susceptibility", "land-cover"].includes(layer.id));
  return (
    <aside id="gis-legends-panel" hidden={hidden} aria-label="Legenda peta" className="gis-left gis-legend-sidebar absolute z-2 [inset:0_auto_0_0] w-[var(--sidebar-width)] rounded-[0_16px_16px_0] bg-white py-4 pr-4 overflow-hidden flex flex-col text-[14px] leading-5 [clip-path:inset(0_round_0_16px_16px_0)] [transform:translateX(0)] [transition:transform_var(--gis-slide-duration)_var(--gis-slide-easing),display_var(--gis-slide-duration)_allow-discrete] [&[hidden]]:hidden [&[hidden]]:[transform:translateX(-100%)] starting:[&:not([hidden])]:[transform:translateX(-100%)] [--sb-thumb-color:#8EC5FF] [--sb-size:5px] motion-reduce:[transition:none]">
      <div className="gis-sidebar-scroll min-h-0 overflow-y-auto pl-[calc(16px_-_var(--sb-size))] [scrollbar-gutter:stable] [direction:rtl]">
      <div dir="ltr">
        <h2 className="text-[24px] leading-8 font-medium">Legenda</h2>
          <div className="mt-4 flex min-w-0 flex-col gap-6">
            {legends.map((layer) => (
              <section key={layer.id} className="flex min-w-0 flex-col gap-2" aria-label={layer.label}>
                <h3 className="text-left text-[14px] leading-5 font-medium text-[var(--gis-blue)]">{layer.label}</h3>
                {layer.id === "rivers" || layer.id === "evacuation" ?
                  <div className="grid grid-cols-[36px_minmax(0,1fr)] items-center gap-3">
                    {layer.id === "rivers" ? <><span aria-hidden="true" className="h-0.5 w-full bg-[#0284c7]" /><span>Segmen sungai</span></>
                      : <><span aria-hidden="true" className="size-2.5 justify-self-center rounded-full border border-[#2563eb] bg-white" /><span>Titik evakuasi</span></>}
                  </div>
                  : layer.id === "land-cover" ? <ul className="m-0 flex list-none flex-col gap-2 p-0">
                    {Object.entries(landCoverColors).map(([label, color]) => <li key={label} className="grid grid-cols-[36px_minmax(0,1fr)] items-center gap-3"><span aria-hidden="true" className="h-2 w-full rounded-sm" style={{ backgroundColor: color }} /><span>{label}</span></li>)}
                  </ul> : <>
                    {layer.id !== "susceptibility" && <p className="text-[12px] leading-4 text-neutral-500">Sampel skala relatif wilayah yang ditampilkan.</p>}
                    <ul className="m-0 flex list-none flex-col gap-2 p-0">
                      {relativeLabels.map((label, index) => {
                        const fraction = index / (relativeLabels.length - 1);
                        const color = layer.id === "susceptibility" ? classColors[index] : layer.id === "dem"
                          ? `hsl(${120 - fraction * 100} 45% ${80 - fraction * 45}%)`
                          : `hsl(215 80% ${92 - fraction * 57}%)`;
                        return <li key={label} className="grid grid-cols-[36px_minmax(0,1fr)] items-center gap-3"><span aria-hidden="true" className="h-2 w-full rounded-sm" style={{ backgroundColor: color }} /><span>{layer.id === "susceptibility" ? classLabels[index] : label}</span></li>;
                      })}
                    </ul>
                  </>}
              </section>
            ))}
          </div>
      </div>
      </div>
    </aside>
  );
}
