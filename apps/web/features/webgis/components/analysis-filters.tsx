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
    <Popover><PopoverTrigger asChild><Button variant="outline" className="analysis-filter" data-active={!!filters.susceptibility.length}><IconAlertTriangle className="size-6" /><span>{filters.susceptibility.length ? `${filters.susceptibility.length} kerawanan` : "Kerawanan"}</span></Button></PopoverTrigger><PopoverContent align="start" collisionPadding={16} className="w-[497px] max-w-[calc(100vw_-_32px)] rounded-2xl border-0 bg-transparent p-0"><CategoryFilter variant="kerawanan" options={[...classes].reverse().map(({ label }) => ({ value: label, label }))} value={filters.susceptibility} onValueChange={(susceptibility) => onChange({ ...filters, susceptibility })} /></PopoverContent></Popover>
    <div className="analysis-search relative flex-1 min-w-45 [&_>_svg]:absolute [&_>_svg]:top-[9px] [&_>_svg]:left-4 [&_>_svg]:text-[#a1a1a1] [&_input]:h-[42px] [&_input]:rounded-2xl [&_input]:pl-12 [&_input]:bg-[#fff] [&_input]:shadow-none [&_input::placeholder]:text-[#a1a1a1] max-[700.01px]:basis-[100%]"><IconSearch className="size-6" aria-hidden="true" /><Input aria-label="Cari Kota/Kabupaten" placeholder="Cari Kota/Kabupaten" value={filters.query} onChange={(event) => onChange({ ...filters, query: event.target.value })} /></div>
  </div>;
}
