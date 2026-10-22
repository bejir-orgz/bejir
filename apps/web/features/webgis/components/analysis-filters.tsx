"use client";

import { IconAlertTriangle, IconFilter2, IconMap, IconSearch } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { AnalysisData, AnalysisFilters } from "../analysis-types";

export function AnalysisRegionFilter({ regions, value, onChange, iconOnly = false }: { regions: string[]; value: string; onChange: (value: string) => void; iconOnly?: boolean }) {
  return <Popover><PopoverTrigger asChild><Button variant={iconOnly ? "ghost" : "outline"} className={iconOnly ? "analysis-region-icon w-6 h-8 p-0 text-[#737373] rounded-sm [&[data-active=true]]:text-[#2b7fff] [&[data-active=true]]:bg-[#dbeafe]" : "analysis-filter h-[42px] rounded-2xl p-[8px_16px] gap-2 text-[14px] font-normal text-[#a1a1a1] bg-[#fff] shadow-none [&[data-active=true]]:text-[#2b7fff] [&[data-active=true]]:border-[#2b7fff] max-[700.01px]:px-3 leading-[1.3333333333] dark:bg-white hover:bg-white dark:hover:bg-white hover:text-[#a1a1a1] [&[data-active=true]:hover]:text-[#2b7fff]"} aria-label="Filter daerah pada tabel" data-active={!!value}>
    {iconOnly ? <IconFilter2 className="size-6" /> : <><IconMap className="size-6" /><span>{value || "Daerah"}</span></>}
  </Button></PopoverTrigger><PopoverContent align="start" className="w-72 space-y-3"><p className="text-sm font-medium">Daerah pada tabel</p><Select value={value || "all"} onValueChange={(next) => onChange(next === "all" ? "" : next)}><SelectTrigger className="w-full" aria-label="Pilih kota atau kabupaten"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">Semua daerah</SelectItem>{regions.map((region) => <SelectItem key={region} value={region}>{region}</SelectItem>)}</SelectContent></Select></PopoverContent></Popover>;
}

export function AnalysisFiltersBar({ filters, regions, classes, onChange }: { filters: AnalysisFilters; regions: string[]; classes: AnalysisData["classes"]; onChange: (filters: AnalysisFilters) => void }) {
  return <div className="analysis-filters flex gap-4 max-[700.01px]:flex-wrap max-[700.01px]:gap-2">
    <AnalysisRegionFilter regions={regions} value={filters.region} onChange={(region) => onChange({ ...filters, region })} />
    <Popover><PopoverTrigger asChild><Button variant="outline" className="analysis-filter h-[42px] rounded-2xl p-[8px_16px] gap-2 text-[14px] font-normal text-[#a1a1a1] bg-[#fff] shadow-none [&[data-active=true]]:text-[#2b7fff] [&[data-active=true]]:border-[#2b7fff] max-[700.01px]:px-3 leading-[1.3333333333] dark:bg-white hover:bg-white dark:hover:bg-white hover:text-[#a1a1a1] [&[data-active=true]:hover]:text-[#2b7fff]" data-active={!!filters.susceptibility.length}><IconAlertTriangle className="size-6" /><span>{filters.susceptibility.length ? `${filters.susceptibility.length} kerawanan` : "Kerawanan"}</span></Button></PopoverTrigger><PopoverContent align="start" className="w-60 space-y-4"><p className="text-sm font-medium">Kerawanan pada tabel</p>{classes.map(({ label }) => <Label className="flex items-center gap-2" key={label}><Checkbox checked={filters.susceptibility.includes(label)} onCheckedChange={(checked) => onChange({ ...filters, susceptibility: checked === true ? [...filters.susceptibility, label] : filters.susceptibility.filter((item) => item !== label) })} />{label}</Label>)}</PopoverContent></Popover>
    <div className="analysis-search relative flex-1 min-w-45 [&_>_svg]:absolute [&_>_svg]:top-[9px] [&_>_svg]:left-4 [&_>_svg]:text-[#a1a1a1] [&_input]:h-[42px] [&_input]:rounded-2xl [&_input]:pl-12 [&_input]:bg-[#fff] [&_input]:shadow-none [&_input::placeholder]:text-[#a1a1a1] max-[700.01px]:basis-[100%]"><IconSearch className="size-6" aria-hidden="true" /><Input aria-label="Cari Kota/Kabupaten" placeholder="Cari Kota/Kabupaten" value={filters.query} onChange={(event) => onChange({ ...filters, query: event.target.value })} /></div>
  </div>;
}
