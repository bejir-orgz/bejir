"use client";

import { IconAlertTriangle, IconCalendarWeek, IconSearch } from "@tabler/icons-react";
import { id } from "date-fns/locale";
import { RegionFilterPopover as RegionFilter } from "@/components/shared/region-filter-popover";
import { Button } from "@/components/ui/button";
import { CalendarBase } from "@/components/ui/calendar-base";
import { CategoryFilter } from "@/components/ui/category-filter";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { localDateString } from "../history";
import type { FloodHistoryRow, HistoryFilters } from "../types";

export { RegionFilter };

export function HistoryFiltersBar({ filters, regions, districtRows, year, years, onYearChange, onChange }: { filters: HistoryFilters; regions: string[]; districtRows: readonly FloodHistoryRow[]; year: number; years: readonly number[]; onYearChange: (year: number) => void; onChange: (filters: HistoryFilters) => void }) {
  const floodTypeOptions = [...new Set(districtRows.flatMap((row) => row.floodType ? [row.floodType] : []))].sort((a, b) => a.localeCompare(b, "id-ID")).map((value) => ({ value, label: value }));
  const range = filters.from ? { from: new Date(`${filters.from}T12:00:00`), to: filters.to ? new Date(`${filters.to}T12:00:00`) : undefined } : undefined;
  const dateLabel = filters.from ? `${filters.from.slice(8)}/${filters.from.slice(5, 7)}${filters.to ? ` – ${filters.to.slice(8)}/${filters.to.slice(5, 7)}` : ""}` : "Tanggal";

  return (
    <div className="history-filters flex gap-4 max-[900.01px]:flex-wrap max-[900.01px]:gap-2">
      <Popover>
        <PopoverTrigger asChild>
          <Button variant={!!filters.from ? "outline" : "filter"} className="history-filter rounded-2xl" data-active={!!filters.from}>
            <IconCalendarWeek className="size-6" />
            <span>{dateLabel}</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent
          sticky="always"
          collisionPadding={16}
          align="start"
          className="w-auto max-h-[min(calc(100dvh-32px),var(--radix-popover-content-available-height))] overflow-y-auto overscroll-contain rounded-2xl p-0"
        >
          <CalendarBase
            captionLayout="dropdown"
            reverseYears
            className="rounded-none border-0"
            mode="range"
            locale={id}
            defaultMonth={range?.from ?? new Date(year, 8, 1)}
            onMonthChange={(month) => {
              if (month.getFullYear() !== year) onYearChange(month.getFullYear());
            }}
            startMonth={new Date(Math.min(...years), 0, 1)}
            endMonth={new Date(Math.max(...years), 11, 31)}
            selected={range}
            onSelect={(next) => onChange({ ...filters, from: next?.from ? localDateString(next.from) : "", to: next?.to ? localDateString(next.to) : "" })}
          />
          <div className="p-4 pt-0">
            <Button variant="outline" className="w-full" onClick={() => onChange({ ...filters, from: "", to: "" })}>
              Hapus tanggal
            </Button>
          </div>
        </PopoverContent>
      </Popover>

      <RegionFilter regions={regions} districtRows={districtRows} value={filters.regionIds} onChange={(regionIds) => onChange({ ...filters, regionIds })} />

      <Popover>
        <PopoverTrigger asChild>
          <Button variant={!!filters.floodTypes.length ? "outline" : "filter"} className="history-filter rounded-2xl" data-active={!!filters.floodTypes.length}>
            <IconAlertTriangle className="size-6" />
            <span>{filters.floodTypes.length ? `${filters.floodTypes.length} jenis` : "Jenis Banjir"}</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent
          align="start"
          collisionPadding={16}
          className="w-auto max-w-[calc(100vw-32px)] rounded-2xl border-0 bg-transparent p-0"
        >
          <CategoryFilter
            variant="jenis-banjir"
            options={floodTypeOptions}
            value={filters.floodTypes}
            onValueChange={(floodTypes) => onChange({ ...filters, floodTypes })}
          />
        </PopoverContent>
      </Popover>

      <label className="history-search flex items-center gap-2 flex-1 min-w-45 h-10 rounded-2xl border border-neutral-300 focus-within:border-blue-500 bg-white px-4 text-neutral-600 transition-colors max-[900.01px]:basis-[100%] [&_input]:min-w-0 [&_input]:w-full [&_input]:h-5 [&_input]:p-0 [&_input]:border-0 [&_input]:outline-none [&_input]:shadow-none [&_input]:bg-transparent [&_input]:text-[14px] [&_input]:leading-5 [&_input]:text-neutral-900 [&_input::placeholder]:text-neutral-500 [&_input::placeholder]:opacity-100 [&_input]:focus:outline-none [&_input]:focus-visible:ring-0 [&_input]:focus-visible:border-0">
        <IconSearch className="size-4 shrink-0 text-neutral-500" aria-hidden="true" />
        <Input id="history-region-query" name="history-region-query" aria-label="Cari Kota/Kabupaten" placeholder="Cari Kota/Kabupaten" value={filters.query} onChange={(event) => onChange({ ...filters, query: event.target.value })} />
      </label>
    </div>
  );
}
