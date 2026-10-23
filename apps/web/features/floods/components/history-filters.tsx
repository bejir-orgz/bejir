"use client";

import { IconAlertTriangle, IconCalendarWeek, IconSearch } from "@tabler/icons-react";
import { id } from "date-fns/locale";
import { RegionFilterPopover as RegionFilter } from "@/components/shared/region-filter-popover";
import { Button } from "@/components/ui/button";
import { CalendarFilter } from "@/components/ui/calendar-filter";
import { CategoryFilter, type CategoryFilterOption } from "@/components/ui/category-filter";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { localDateString } from "../history";
import type { FloodHistoryRow, FloodSeverity, HistoryFilters } from "../types";

const severityOptions: readonly CategoryFilterOption<FloodSeverity>[] = [
  { value: "Rendah", label: "Rendah" },
  { value: "Sedang", label: "Sedang" },
  { value: "Tinggi", label: "Tinggi" },
];

export { RegionFilter };

export function HistoryFiltersBar({ filters, regions, districtRows, year, onChange }: { filters: HistoryFilters; regions: string[]; districtRows: readonly FloodHistoryRow[]; year: number; onChange: (filters: HistoryFilters) => void }) {
  const range = filters.from ? { from: new Date(`${filters.from}T12:00:00`), to: filters.to ? new Date(`${filters.to}T12:00:00`) : undefined } : undefined;
  const dateLabel = filters.from ? `${filters.from.slice(8)}/${filters.from.slice(5, 7)}${filters.to ? ` – ${filters.to.slice(8)}/${filters.to.slice(5, 7)}` : ""}` : "Tanggal";

  return (
    <div className="history-filters flex gap-4 max-[900.01px]:flex-wrap max-[900.01px]:gap-2">
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" className="history-filter" data-active={!!filters.from}>
            <IconCalendarWeek className="size-6" />
            <span>{dateLabel}</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent
          sticky="always"
          collisionPadding={16}
          align="start"
          className="w-auto max-h-[min(calc(100dvh-32px),var(--radix-popover-content-available-height))] overflow-y-auto overscroll-contain rounded-lg p-0"
        >
          <CalendarFilter
            className="rounded-none border-0"
            mode="range"
            locale={id}
            defaultMonth={new Date(year, 8, 1)}
            startMonth={new Date(year, 0, 1)}
            endMonth={new Date(year, 11, 31)}
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
          <Button variant="outline" className="history-filter" data-active={!!filters.severities.length}>
            <IconAlertTriangle className="size-6" />
            <span>{filters.severities.length ? `${filters.severities.length} keparahan` : "Keparahan"}</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent
          align="start"
          collisionPadding={16}
          className="w-auto max-w-[calc(100vw-32px)] rounded-2xl border-0 bg-transparent p-0"
        >
          <CategoryFilter
            variant="keparahan"
            options={severityOptions}
            value={filters.severities}
            onValueChange={(severities) => onChange({ ...filters, severities })}
          />
        </PopoverContent>
      </Popover>

      <div className="history-search relative flex-1 min-w-45 [&_>_svg]:absolute [&_>_svg]:top-[9px] [&_>_svg]:left-4 [&_>_svg]:text-[#a1a1a1] [&_input]:h-[42px] [&_input]:rounded-2xl [&_input]:pl-12 [&_input]:bg-[#fff] [&_input]:shadow-none [&_input::placeholder]:text-[#a1a1a1] max-[900.01px]:basis-[100%]">
        <IconSearch className="size-6" aria-hidden="true" />
        <Input aria-label="Cari Kota/Kabupaten" placeholder="Cari Kota/Kabupaten" value={filters.query} onChange={(event) => onChange({ ...filters, query: event.target.value })} />
      </div>
    </div>
  );
}
