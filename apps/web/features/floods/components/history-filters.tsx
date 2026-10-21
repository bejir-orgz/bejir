"use client";

import { IconAlertTriangle, IconCalendarWeek, IconFilter2, IconMap, IconSearch } from "@tabler/icons-react";
import { id } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { localDateString } from "../history";
import type { FloodSeverity, HistoryFilters } from "../types";

export function RegionFilter({ regions, value, onChange, iconOnly = false }: { regions: string[]; value: string; onChange: (value: string) => void; iconOnly?: boolean }) {
  return <Popover><PopoverTrigger asChild><Button variant={iconOnly ? "ghost" : "outline"} className={iconOnly ? "history-region-icon" : "history-filter"} aria-label="Filter daerah pada tabel" data-active={!!value}>
    {iconOnly ? <IconFilter2 className="size-6" /> : <><IconMap className="size-6" /><span>{value || "Daerah"}</span></>}
  </Button></PopoverTrigger><PopoverContent align="start" className="w-72 space-y-3">
    <p className="text-sm font-medium">Daerah pada tabel</p>
    <Select value={value || "all"} onValueChange={(next) => onChange(next === "all" ? "" : next)}><SelectTrigger className="w-full" aria-label="Pilih kota atau kabupaten"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">Semua daerah</SelectItem>{regions.map((region) => <SelectItem key={region} value={region}>{region}</SelectItem>)}</SelectContent></Select>
  </PopoverContent></Popover>;
}

export function HistoryFiltersBar({ filters, regions, year, onChange }: { filters: HistoryFilters; regions: string[]; year: number; onChange: (filters: HistoryFilters) => void }) {
  const range = filters.from ? { from: new Date(`${filters.from}T12:00:00`), to: filters.to ? new Date(`${filters.to}T12:00:00`) : undefined } : undefined;
  const dateLabel = filters.from ? `${filters.from.slice(8)}/${filters.from.slice(5, 7)}${filters.to ? ` – ${filters.to.slice(8)}/${filters.to.slice(5, 7)}` : ""}` : "Tanggal";
  return <div className="history-filters">
    <Popover><PopoverTrigger asChild><Button variant="outline" className="history-filter" data-active={!!filters.from}><IconCalendarWeek className="size-6" /><span>{dateLabel}</span></Button></PopoverTrigger><PopoverContent align="start" className="w-auto p-0">
      <Calendar mode="range" locale={id} defaultMonth={new Date(year, 8, 1)} startMonth={new Date(year, 0, 1)} endMonth={new Date(year, 11, 31)} selected={range} onSelect={(next) => onChange({ ...filters, from: next?.from ? localDateString(next.from) : "", to: next?.to ? localDateString(next.to) : "" })} />
      <Button variant="ghost" size="sm" className="m-2" onClick={() => onChange({ ...filters, from: "", to: "" })}>Hapus tanggal</Button>
    </PopoverContent></Popover>
    <RegionFilter regions={regions} value={filters.region} onChange={(region) => onChange({ ...filters, region })} />
    <Popover><PopoverTrigger asChild><Button variant="outline" className="history-filter" data-active={!!filters.severities.length}><IconAlertTriangle className="size-6" /><span>{filters.severities.length ? `${filters.severities.length} keparahan` : "Keparahan"}</span></Button></PopoverTrigger><PopoverContent align="start" className="w-52 space-y-4"><p className="text-sm font-medium">Keparahan pada tabel</p>{(["Rendah", "Sedang", "Tinggi"] as FloodSeverity[]).map((severity) => <Label key={severity} className="flex items-center gap-2"><Checkbox checked={filters.severities.includes(severity)} onCheckedChange={(checked) => onChange({ ...filters, severities: checked === true ? [...filters.severities, severity] : filters.severities.filter((item) => item !== severity) })} />{severity}</Label>)}</PopoverContent></Popover>
    <div className="history-search"><IconSearch className="size-6" aria-hidden="true" /><Input aria-label="Cari Kota/Kabupaten" placeholder="Cari Kota/Kabupaten" value={filters.query} onChange={(event) => onChange({ ...filters, query: event.target.value })} /></div>
  </div>;
}
