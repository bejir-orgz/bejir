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
  return <Popover><PopoverTrigger asChild><Button variant={iconOnly ? "ghost" : "outline"} className={iconOnly ? "analysis-region-icon" : "analysis-filter"} aria-label="Filter daerah pada tabel" data-active={!!value}>
    {iconOnly ? <IconFilter2 className="size-6" /> : <><IconMap className="size-6" /><span>{value || "Daerah"}</span></>}
  </Button></PopoverTrigger><PopoverContent align="start" className="w-72 space-y-3"><p className="text-sm font-medium">Daerah pada tabel</p><Select value={value || "all"} onValueChange={(next) => onChange(next === "all" ? "" : next)}><SelectTrigger className="w-full" aria-label="Pilih kota atau kabupaten"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">Semua daerah</SelectItem>{regions.map((region) => <SelectItem key={region} value={region}>{region}</SelectItem>)}</SelectContent></Select></PopoverContent></Popover>;
}

export function AnalysisFiltersBar({ filters, regions, classes, onChange }: { filters: AnalysisFilters; regions: string[]; classes: AnalysisData["classes"]; onChange: (filters: AnalysisFilters) => void }) {
  return <div className="analysis-filters">
    <AnalysisRegionFilter regions={regions} value={filters.region} onChange={(region) => onChange({ ...filters, region })} />
    <Popover><PopoverTrigger asChild><Button variant="outline" className="analysis-filter" data-active={!!filters.susceptibility.length}><IconAlertTriangle className="size-6" /><span>{filters.susceptibility.length ? `${filters.susceptibility.length} kerawanan` : "Kerawanan"}</span></Button></PopoverTrigger><PopoverContent align="start" className="w-60 space-y-4"><p className="text-sm font-medium">Kerawanan pada tabel</p>{classes.map(({ label }) => <Label className="flex items-center gap-2" key={label}><Checkbox checked={filters.susceptibility.includes(label)} onCheckedChange={(checked) => onChange({ ...filters, susceptibility: checked === true ? [...filters.susceptibility, label] : filters.susceptibility.filter((item) => item !== label) })} />{label}</Label>)}</PopoverContent></Popover>
    <div className="analysis-search"><IconSearch className="size-6" aria-hidden="true" /><Input aria-label="Cari Kota/Kabupaten" placeholder="Cari Kota/Kabupaten" value={filters.query} onChange={(event) => onChange({ ...filters, query: event.target.value })} /></div>
  </div>;
}
