"use client";

import { useState } from "react";
import { IconCalendarWeek } from "@tabler/icons-react";
import { id } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { getTimelineMonths } from "../timeline";
import type { WorkspaceFilters } from "../types";

export function TimelineSidebar({ year, filters, hidden, onChange }: {
  year: number;
  filters: WorkspaceFilters;
  hidden: boolean;
  onChange: (patch: Partial<WorkspaceFilters>) => void;
}) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const months = getTimelineMonths(year);
  const selectedDate = filters.date ? new Date(`${filters.date}T00:00:00`) : undefined;

  function selectDate(date: string) {
    onChange({ period: "custom", date });
    setPickerOpen(false);
  }

  return (
    <aside id="gis-timeline-panel" hidden={hidden} className="gis-left gis-timeline-sidebar" aria-label="Waktu">
      <h2>Waktu</h2>
      <Popover open={pickerOpen} onOpenChange={setPickerOpen}>
        <PopoverTrigger asChild><Button variant="outline" className="gis-time-picker"><IconCalendarWeek className="size-4" aria-hidden="true" />{filters.date || "Pilih waktu"}</Button></PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar mode="single" locale={id} selected={selectedDate} defaultMonth={selectedDate ?? new Date(year, 9, 1)} onSelect={(date) => { if (date) selectDate(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`); }} />
        </PopoverContent>
      </Popover>
      <div className="gis-timeline-months">{months.map((month) => (
        <section key={month.id} aria-label={`${month.label} ${month.id.slice(0, 4)}`}>
          <h3>{month.label}</h3>
          <div className="gis-day-grid">{month.dates.map((date, index) => (
            <Button key={date} variant="ghost" size="sm" aria-label={`Pilih ${index + 1} ${month.label} ${month.id.slice(0, 4)}`} aria-pressed={filters.date === date} className={filters.date === date ? "gis-day-selected" : ""} onClick={() => selectDate(date)}>{index + 1}</Button>
          ))}</div>
        </section>
      ))}</div>
      <p className="sr-only">Pilihan waktu hanya disimpan secara lokal dan tidak memfilter data nyata.</p>
    </aside>
  );
}
