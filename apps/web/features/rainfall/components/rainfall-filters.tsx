"use client";

import { IconAlertTriangle, IconCalendarWeek, IconFilter2, IconMap, IconSearch } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { RainfallFilters, RainfallPageData } from "../types";

const monthNames = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];

export function RainfallRegionFilter({ regions, value, onChange, iconOnly = false }: { regions: string[]; value: string; onChange: (region: string) => void; iconOnly?: boolean }) {
  return <Popover><PopoverTrigger asChild><Button variant={iconOnly ? "ghost" : "outline"} className={iconOnly ? "rainfall-region-icon" : "rainfall-filter"} aria-label="Filter daerah pada tabel" data-active={!!value}>
    {iconOnly ? <IconFilter2 className="size-6" /> : <><IconMap className="size-6" /><span>{value || "Daerah"}</span></>}
  </Button></PopoverTrigger><PopoverContent align="start" className="w-72 space-y-3"><p className="text-sm font-medium">Daerah pada tabel</p>
    <Select value={value || "all"} onValueChange={(next) => onChange(next === "all" ? "" : next)}><SelectTrigger aria-label="Pilih kota atau kabupaten" className="w-full"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">Semua daerah</SelectItem>{regions.map((region) => <SelectItem key={region} value={region}>{region}</SelectItem>)}</SelectContent></Select>
  </PopoverContent></Popover>;
}

export function RainfallFiltersBar({ filters, regions, legend, year, onChange }: { filters: RainfallFilters; regions: string[]; legend: RainfallPageData["legend"]; year: number; onChange: (filters: RainfallFilters) => void }) {
  return <div className="rainfall-filters">
    <Popover><PopoverTrigger asChild><Button variant="outline" className="rainfall-filter" data-active={!!filters.month}><IconCalendarWeek className="size-6" /><span>{filters.month ? monthNames[Number(filters.month) - 1] : "Tanggal"}</span></Button></PopoverTrigger><PopoverContent align="start" className="w-64 space-y-3"><p className="text-sm font-medium">Bulan pada tabel · {year}</p>
      <Select value={filters.month || "all"} onValueChange={(value) => onChange({ ...filters, month: value === "all" ? "" : value })}><SelectTrigger className="w-full" aria-label="Pilih bulan"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">Semua bulan</SelectItem>{monthNames.map((month, index) => <SelectItem value={String(index + 1).padStart(2, "0")} key={month}>{month}</SelectItem>)}</SelectContent></Select>
    </PopoverContent></Popover>
    <RainfallRegionFilter regions={regions} value={filters.region} onChange={(region) => onChange({ ...filters, region })} />
    <Popover><PopoverTrigger asChild><Button variant="outline" className="rainfall-filter" data-active={!!filters.classifications.length}><IconAlertTriangle className="size-6" /><span>{filters.classifications.length ? `${filters.classifications.length} klasifikasi` : "Klasifikasi"}</span></Button></PopoverTrigger><PopoverContent align="start" className="w-60 space-y-4"><p className="text-sm font-medium">Klasifikasi pada tabel</p>{legend.map(({ label }) => <Label className="flex items-center gap-2" key={label}><Checkbox checked={filters.classifications.includes(label)} onCheckedChange={(checked) => onChange({ ...filters, classifications: checked === true ? [...filters.classifications, label] : filters.classifications.filter((item) => item !== label) })} />{label}</Label>)}</PopoverContent></Popover>
    <div className="rainfall-search"><IconSearch className="size-6" aria-hidden="true" /><Input aria-label="Cari Kota/Kabupaten" placeholder="Cari Kota/Kabupaten" value={filters.query} onChange={(event) => onChange({ ...filters, query: event.target.value })} /></div>
  </div>;
}
