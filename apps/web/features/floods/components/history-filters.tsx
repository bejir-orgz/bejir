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
  return <Popover><PopoverTrigger asChild><Button variant={iconOnly ? "ghost" : "outline"} className={iconOnly ? "history-region-icon w-6 h-8 p-0 text-[#2b7fff] rounded-sm [&[data-active=true]]:bg-[#dbeafe]" : "history-filter h-[42px] rounded-2xl p-[8px_16px] gap-2 text-[14px] font-normal text-[#a1a1a1] bg-[#fff] shadow-none [&[data-active=true]]:text-[#2b7fff] [&[data-active=true]]:border-[#2b7fff] max-[700.01px]:px-3 leading-[1.3333333333] dark:bg-white hover:bg-white dark:hover:bg-white hover:text-[#a1a1a1] [&[data-active=true]:hover]:text-[#2b7fff]"} aria-label="Filter daerah pada tabel" data-active={!!value}>
    {iconOnly ? <IconFilter2 className="size-6" /> : <><IconMap className="size-6" /><span>{value || "Daerah"}</span></>}
  </Button></PopoverTrigger><PopoverContent align="start" className="w-72 space-y-3">
    <p className="text-sm font-medium">Daerah pada tabel</p>
    <Select value={value || "all"} onValueChange={(next) => onChange(next === "all" ? "" : next)}><SelectTrigger className="w-full" aria-label="Pilih kota atau kabupaten"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">Semua daerah</SelectItem>{regions.map((region) => <SelectItem key={region} value={region}>{region}</SelectItem>)}</SelectContent></Select>
  </PopoverContent></Popover>;
}

export function HistoryFiltersBar({ filters, regions, year, onChange }: { filters: HistoryFilters; regions: string[]; year: number; onChange: (filters: HistoryFilters) => void }) {
  const range = filters.from ? { from: new Date(`${filters.from}T12:00:00`), to: filters.to ? new Date(`${filters.to}T12:00:00`) : undefined } : undefined;
  const dateLabel = filters.from ? `${filters.from.slice(8)}/${filters.from.slice(5, 7)}${filters.to ? ` – ${filters.to.slice(8)}/${filters.to.slice(5, 7)}` : ""}` : "Tanggal";
  return <div className="history-filters flex gap-4 max-[900.01px]:flex-wrap max-[900.01px]:gap-2">
    <Popover><PopoverTrigger asChild><Button variant="outline" className="history-filter h-[42px] rounded-2xl p-[8px_16px] gap-2 text-[14px] font-normal text-[#a1a1a1] bg-[#fff] shadow-none [&[data-active=true]]:text-[#2b7fff] [&[data-active=true]]:border-[#2b7fff] max-[700.01px]:px-3 leading-[1.3333333333] dark:bg-white hover:bg-white dark:hover:bg-white hover:text-[#a1a1a1] [&[data-active=true]:hover]:text-[#2b7fff]" data-active={!!filters.from}><IconCalendarWeek className="size-6" /><span>{dateLabel}</span></Button></PopoverTrigger><PopoverContent sticky="always" collisionPadding={16} align="start" className="w-auto max-h-[min(calc(100dvh_-_32px),var(--radix-popover-content-available-height))] overflow-y-auto overscroll-contain rounded-lg p-0">
      <Calendar mode="range" locale={id} defaultMonth={new Date(year, 8, 1)} startMonth={new Date(year, 0, 1)} endMonth={new Date(year, 11, 31)} selected={range} onSelect={(next) => onChange({ ...filters, from: next?.from ? localDateString(next.from) : "", to: next?.to ? localDateString(next.to) : "" })} />
      <Button variant="ghost" size="sm" className="m-2" onClick={() => onChange({ ...filters, from: "", to: "" })}>Hapus tanggal</Button>
    </PopoverContent></Popover>
    <RegionFilter regions={regions} value={filters.region} onChange={(region) => onChange({ ...filters, region })} />
    <Popover><PopoverTrigger asChild><Button variant="outline" className="history-filter h-[42px] rounded-2xl p-[8px_16px] gap-2 text-[14px] font-normal text-[#a1a1a1] bg-[#fff] shadow-none [&[data-active=true]]:text-[#2b7fff] [&[data-active=true]]:border-[#2b7fff] max-[700.01px]:px-3 leading-[1.3333333333] dark:bg-white hover:bg-white dark:hover:bg-white hover:text-[#a1a1a1] [&[data-active=true]:hover]:text-[#2b7fff]" data-active={!!filters.severities.length}><IconAlertTriangle className="size-6" /><span>{filters.severities.length ? `${filters.severities.length} keparahan` : "Keparahan"}</span></Button></PopoverTrigger><PopoverContent align="start" className="w-52 space-y-4"><p className="text-sm font-medium">Keparahan pada tabel</p>{(["Rendah", "Sedang", "Tinggi"] as FloodSeverity[]).map((severity) => <Label key={severity} className="flex items-center gap-2"><Checkbox checked={filters.severities.includes(severity)} onCheckedChange={(checked) => onChange({ ...filters, severities: checked === true ? [...filters.severities, severity] : filters.severities.filter((item) => item !== severity) })} />{severity}</Label>)}</PopoverContent></Popover>
    <div className="history-search relative flex-1 min-w-45 [&_>_svg]:absolute [&_>_svg]:top-[9px] [&_>_svg]:left-4 [&_>_svg]:text-[#a1a1a1] [&_input]:h-[42px] [&_input]:rounded-2xl [&_input]:pl-12 [&_input]:bg-[#fff] [&_input]:shadow-none [&_input::placeholder]:text-[#a1a1a1] max-[900.01px]:basis-[100%]"><IconSearch className="size-6" aria-hidden="true" /><Input aria-label="Cari Kota/Kabupaten" placeholder="Cari Kota/Kabupaten" value={filters.query} onChange={(event) => onChange({ ...filters, query: event.target.value })} /></div>
  </div>;
}
