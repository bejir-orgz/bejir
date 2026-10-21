"use client";

import { Button } from "@/components/ui/button";
import { useState } from "react";
import { IconChevronDown, IconCloudRain, IconLayersIntersect, IconMapPin, IconMountain, IconRoute } from "@tabler/icons-react";

const layers = [
  { id: "terrain", label: "Bentang alam", icon: IconMountain },
  { id: "rainfall", label: "Curah hujan", icon: IconCloudRain },
] as const;

// Decorative schematic: not geographic data or an analysis result.
export function GisPreview({ compact = false }: { compact?: boolean }) {
  const [layer, setLayer] = useState<"terrain" | "rainfall">("terrain");
  const rainfall = layer === "rainfall";
  const gridId = compact ? "grid-compact" : "grid";
  const terrainId = compact ? "terrain-compact" : "terrain";

  return (
    <div className={`gis-preview relative isolate overflow-hidden rounded-[24px] border border-white bg-[#e8eef5] ${compact ? "min-h-[380px]" : "min-h-[480px] sm:min-h-[540px]"}`}>
      <svg viewBox="0 0 640 600" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 size-full" aria-hidden="true">
        <defs>
          <pattern id={gridId} width="48" height="48" patternUnits="userSpaceOnUse"><path d="M 48 0 L 0 0 0 48" fill="none" stroke="#d5deeb" strokeWidth=".7" /></pattern>
          <linearGradient id={terrainId} x1="0" y1="0" x2="1" y2="1"><stop stopColor="#d1dce9" /><stop offset="1" stopColor="#f3f6fb" /></linearGradient>
        </defs>
        <rect width="640" height="600" fill={`url(#${gridId})`} />
        <path d="M-30 250 Q90 120 240 190 T480 170 T690 260 L680 610 L-20 610Z" fill={`url(#${terrainId})`} />
        {Array.from({ length: 10 }, (_, index) => <path key={index} d={`M-60 ${250 + index * 22} Q70 ${95 + index * 27} 230 ${200 + index * 22} T470 ${180 + index * 29} T710 ${260 + index * 20}`} fill="none" stroke="#b7c7d9" strokeWidth="1" opacity=".65" />)}
        <path d="M80-10 Q200 90 220 185 T360 310 T430 450 T590 610" stroke="#ffffff" strokeWidth="15" fill="none" />
        <path d="M80-10 Q200 90 220 185 T360 310 T430 450 T590 610" stroke="#7aade5" strokeWidth="7" fill="none" />
        <path d="M-10 385 Q135 280 255 355 T490 335 T650 310 M130 610 Q180 410 360 310 T560-20" stroke="#fff" strokeWidth="5" fill="none" />
        <path d="M80 210 L250 110 L405 215 L540 160 M120 480 L250 355 L400 520 L540 440" stroke="#94a7bf" strokeWidth="1.5" strokeDasharray="5 6" fill="none" />
        {rainfall ? <g fill="#60a5fa" opacity=".25"><ellipse cx="235" cy="240" rx="140" ry="90" /><ellipse cx="420" cy="370" rx="150" ry="100" /><ellipse cx="500" cy="140" rx="120" ry="80" /></g> : <g fill="#a8bfc0" opacity=".25"><path d="M30 280L120 170L270 225L230 310Z" /><path d="M390 440L510 350L615 440L540 545Z" /></g>}
        <circle cx="355" cy="307" r="47" fill="#2563eb" opacity=".09" /><circle cx="355" cy="307" r="29" fill="#2563eb" opacity=".12" />
        <circle cx="355" cy="307" r="8" fill="#2563eb" stroke="white" strokeWidth="4" />
        <circle cx="220" cy="190" r="5" fill="#6366f1" stroke="white" strokeWidth="3" /><circle cx="437" cy="450" r="5" fill="#6366f1" stroke="white" strokeWidth="3" />
      </svg>
      <div className="absolute inset-x-4 top-4 flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 rounded-xl border border-white/80 bg-white/95 p-2 shadow-sm"><span className="flex size-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600"><IconMapPin size={17} aria-hidden="true" /></span><span className="pr-2 text-xs font-medium text-neutral-700">Jawa Barat</span><IconChevronDown size={14} className="text-neutral-500" aria-hidden="true" /></div>
        <span className="rounded-lg bg-white/90 p-2 text-[10px] font-medium tracking-wide text-neutral-500">ILUSTRASI</span>
      </div>
      <div className="absolute left-4 top-24 flex flex-col gap-2 rounded-2xl border border-white/80 bg-white/95 p-2 shadow-sm" role="group" aria-label="Layer ilustrasi">
        {layers.map(({ id, label, icon: Icon }) => <Button variant="ghost" size="icon" key={id} type="button" aria-label={label} aria-pressed={layer === id} title={label} onClick={() => setLayer(id)} className={`flex size-10 items-center justify-center rounded-xl outline-none transition-colors focus-visible:ring-2 focus-visible:ring-blue-600 ${layer === id ? "bg-blue-600 text-white" : "text-neutral-500 hover:bg-blue-50"}`}><Icon size={20} stroke={1.7} aria-hidden="true" /></Button>)}
      </div>
      <div className="absolute left-[53%] top-[46%] flex -translate-x-1/2 items-center gap-2 rounded-xl border border-neutral-100 bg-white p-2 shadow-lg"><span className="size-2 rounded-full bg-blue-600" /><span className="whitespace-nowrap text-[11px] font-medium text-neutral-700">Eksplorasi wilayah</span></div>
      <div className="absolute right-4 bottom-24 flex size-10 items-center justify-center rounded-full border border-white bg-white/90 text-neutral-500 shadow-sm"><IconRoute size={20} stroke={1.6} aria-hidden="true" /></div>
      <div className="absolute inset-x-4 bottom-4 rounded-2xl border border-white/80 bg-white/95 p-4 shadow-sm">
        <div className="flex items-center justify-between gap-2"><span className="flex items-center gap-2 text-xs font-semibold text-neutral-800"><IconLayersIntersect size={16} className="text-blue-600" aria-hidden="true" />{rainfall ? "Ilustrasi layer curah hujan" : "Ilustrasi layer bentang alam"}</span><span className="hidden text-[10px] text-neutral-500 sm:block">PRATINJAU KONSEP</span></div>
        <p className="mt-2 text-[11px] leading-relaxed text-neutral-500" aria-live="polite">Skema visual untuk mengenal WebGIS. Bukan peta geografis atau data pengamatan.</p>
      </div>
    </div>
  );
}
