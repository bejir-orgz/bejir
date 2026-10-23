"use client";

import { IconAlertTriangle, IconCalendarWeek, IconSearch } from "@tabler/icons-react";
import { RegionFilterPopover as RainfallRegionFilter } from "@/components/shared/region-filter-popover";
import { Button } from "@/components/ui/button";
import { CategoryFilter } from "@/components/ui/category-filter";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { RainfallFilters, RainfallPageData } from "../types";

const monthNames = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];

export { RainfallRegionFilter };

export function RainfallFiltersBar({ filters, regions, legend, year, onChange }: { filters: RainfallFilters; regions: string[]; legend: RainfallPageData["legend"]; year: number; onChange: (filters: RainfallFilters) => void }) {
  return <div className="rainfall-filters flex gap-4 max-[900.01px]:flex-wrap max-[900.01px]:gap-2">
    <Popover><PopoverTrigger asChild><Button variant="outline" className="rainfall-filter" data-active={!!filters.month}><IconCalendarWeek className="size-6" /><span>{filters.month ? monthNames[Number(filters.month) - 1] : "Tanggal"}</span></Button></PopoverTrigger><PopoverContent align="start" className="w-64 space-y-3"><p className="text-sm font-medium">Bulan pada tabel · {year}</p>
      <Select value={filters.month || "all"} onValueChange={(value) => onChange({ ...filters, month: value === "all" ? "" : value })}><SelectTrigger className="w-full" aria-label="Pilih bulan"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">Semua bulan</SelectItem>{monthNames.map((month, index) => <SelectItem value={String(index + 1).padStart(2, "0")} key={month}>{month}</SelectItem>)}</SelectContent></Select>
    </PopoverContent></Popover>
    <RainfallRegionFilter regions={regions} value={filters.regionIds} onChange={(regionIds) => onChange({ ...filters, regionIds })} />
    <Popover><PopoverTrigger asChild><Button variant="outline" className="rainfall-filter" data-active={!!filters.classifications.length}><IconAlertTriangle className="size-6" /><span>{filters.classifications.length ? `${filters.classifications.length} klasifikasi` : "Klasifikasi"}</span></Button></PopoverTrigger><PopoverContent align="start" collisionPadding={16} className="w-[497px] max-w-[calc(100vw_-_32px)] rounded-2xl border-0 bg-transparent p-0"><CategoryFilter variant="klasifikasi" options={legend.map(({ label }) => ({ value: label, label }))} value={filters.classifications} onValueChange={(classifications) => onChange({ ...filters, classifications })} /></PopoverContent></Popover>
    <div className="rainfall-search relative flex-1 min-w-45 [&_>_svg]:absolute [&_>_svg]:top-[9px] [&_>_svg]:left-4 [&_>_svg]:text-[#a1a1a1] [&_input]:h-[42px] [&_input]:rounded-2xl [&_input]:pl-12 [&_input]:bg-[#fff] [&_input]:shadow-none [&_input::placeholder]:text-[#a1a1a1] max-[900.01px]:basis-[100%]"><IconSearch className="size-6" aria-hidden="true" /><Input aria-label="Cari Kota/Kabupaten" placeholder="Cari Kota/Kabupaten" value={filters.query} onChange={(event) => onChange({ ...filters, query: event.target.value })} /></div>
  </div>;
}
