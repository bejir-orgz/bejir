"use client";

import { IconAlertTriangle, IconSearch } from "@tabler/icons-react";
import { RegionFilterPopover as AnalysisRegionFilter } from "@/components/shared/region-filter-popover";
import { Button } from "@/components/ui/button";
import { CategoryFilter } from "@/components/ui/category-filter";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import type { AnalysisData, AnalysisFilters } from "../analysis-types";

export { AnalysisRegionFilter };

export function AnalysisFiltersBar({ filters, regions, classes, onChange }: { filters: AnalysisFilters; regions: string[]; classes: AnalysisData["classes"]; onChange: (filters: AnalysisFilters) => void }) {
  return <div className="analysis-filters flex gap-4 max-[700.01px]:flex-wrap max-[700.01px]:gap-2">
    <AnalysisRegionFilter regions={regions} value={filters.regionIds} onChange={(regionIds) => onChange({ ...filters, regionIds })} />
    <Popover><PopoverTrigger asChild><Button variant={!!filters.susceptibility.length ? "outline" : "filter"} className="analysis-filter rounded-2xl" data-active={!!filters.susceptibility.length}><IconAlertTriangle className="size-6" /><span>{filters.susceptibility.length ? `${filters.susceptibility.length} kerawanan` : "Kerawanan"}</span></Button></PopoverTrigger><PopoverContent align="start" collisionPadding={16} className="w-[497px] max-w-[calc(100vw_-_32px)] rounded-2xl border-0 bg-transparent p-0"><CategoryFilter variant="kerawanan" options={[...classes].reverse().map(({ label }) => ({ value: label, label }))} value={filters.susceptibility} onValueChange={(susceptibility) => onChange({ ...filters, susceptibility })} /></PopoverContent></Popover>
    <label className="analysis-search flex items-center gap-2 flex-1 min-w-45 h-10 rounded-2xl border border-neutral-300 focus-within:border-blue-500 bg-white px-4 text-neutral-400 transition-colors max-[700.01px]:basis-[100%] [&_input]:min-w-0 [&_input]:w-full [&_input]:h-5 [&_input]:p-0 [&_input]:border-0 [&_input]:outline-none [&_input]:shadow-none [&_input]:bg-transparent [&_input]:text-[14px] [&_input]:leading-5 [&_input]:text-neutral-400 [&_input::placeholder]:text-neutral-400 [&_input::placeholder]:opacity-100 [&_input]:focus:outline-none [&_input]:focus-visible:ring-0 [&_input]:focus-visible:border-0"><IconSearch className="size-4 shrink-0 text-neutral-400" aria-hidden="true" /><Input aria-label="Cari Kota/Kabupaten" placeholder="Cari Kota/Kabupaten" value={filters.query} onChange={(event) => onChange({ ...filters, query: event.target.value })} /></label>
  </div>;
}
