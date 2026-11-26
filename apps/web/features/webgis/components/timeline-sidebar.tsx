"use client";

import { useState, useSyncExternalStore } from "react";
import { IconCalendarWeek } from "@tabler/icons-react";
import { id } from "date-fns/locale";
import { format } from "date-fns";
import type { DateRange } from "react-day-picker";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { CalendarTimeline } from "@/components/ui/calendar-timeline";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { getCurrentTimelineDate, getTimelineMonths } from "../timeline";
import type { WorkspaceFilters } from "../types";

function subscribeToDateChange(callback: () => void) {
  const timer = window.setInterval(callback, 60_000);
  return () => window.clearInterval(timer);
}
const getServerPeriod = () => null;
const weekdays = [
  { short: "Min", name: "Minggu" },
  { short: "Sen", name: "Senin" },
  { short: "Sel", name: "Selasa" },
  { short: "Rab", name: "Rabu" },
  { short: "Kam", name: "Kamis" },
  { short: "Jum", name: "Jumat" },
  { short: "Sab", name: "Sabtu" },
];

export function TimelineSidebar({ year, filters, hidden, onChange }: {
  year: number;
  filters: WorkspaceFilters;
  hidden: boolean;
  onChange: (patch: Partial<WorkspaceFilters>) => void;
}) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const [draftRange, setDraftRange] = useState<DateRange>();
  const today = useSyncExternalStore(subscribeToDateChange, getCurrentTimelineDate, getServerPeriod);
  const [currentYear, currentMonth] = today ? today.split("-").map(Number) : [year, 1];
  const currentDate = today ? new Date(`${today}T00:00:00`) : undefined;
  const months = getTimelineMonths(currentYear, currentMonth - 1);
  const selectedDate = filters.date ? new Date(`${filters.date}T00:00:00`) : undefined;
  const selectedEnd = filters.dateTo ? new Date(`${filters.dateTo}T00:00:00`) : undefined;
  const displayedRange = pickerOpen ? draftRange : { from: selectedDate, to: selectedEnd };
  const displayedFrom = displayedRange?.from ? format(displayedRange.from, "yyyy-MM-dd") : "";
  const displayedTo = displayedRange?.to ? format(displayedRange.to, "yyyy-MM-dd") : displayedFrom;
  const dateLabel = displayedRange?.from
    ? `${format(displayedRange.from, "dd/MM/yyyy")}${displayedRange.to && displayedTo !== displayedFrom ? ` – ${format(displayedRange.to, "dd/MM/yyyy")}` : ""}`
    : "Pilih waktu";
  const isSelectedDate = (date: string) => !!displayedFrom && date >= displayedFrom && date <= displayedTo;

  function selectDate(date: string) {
    onChange({ period: "custom", date, dateTo: "" });
    setPickerOpen(false);
  }

  function applyRange() {
    if (!draftRange?.from) return;
    onChange({ period: "custom", date: format(draftRange.from, "yyyy-MM-dd"), dateTo: format(draftRange.to ?? draftRange.from, "yyyy-MM-dd") });
    setPickerOpen(false);
  }

  return (
    <aside id="gis-timeline-panel" data-hidden={!!hidden} aria-hidden={hidden} inert={hidden} className="gis-left absolute z-2 [inset:0_auto_0_0] w-[var(--sidebar-width)] border-0 rounded-[0_16px_16px_0] bg-[white] overflow-hidden flex flex-col [clip-path:inset(0_round_0_16px_16px_0)] [transform:translateX(0)] [transition:transform_var(--gis-slide-duration)_var(--gis-slide-easing),visibility_var(--gis-slide-duration)] [&[data-hidden=true]]:invisible [&[data-hidden=true]]:[transform:translateX(-100%)] starting:[&[data-hidden=false]]:[transform:translateX(-100%)] [&_h1]:text-[24px] [&_h1]:leading-[32px] [&_h1]:font-medium [&_h2]:text-[24px] [&_h2]:leading-[32px] [&_h2]:font-medium [--sb-thumb-color:#8EC5FF] [--sb-size:5px] motion-reduce:[transition:none] gis-timeline-sidebar bottom-0 min-h-0 max-h-[none] py-4 pr-4" aria-label="Timeline">
      <div className="gis-sidebar-scroll min-h-0 overflow-y-auto pl-[calc(16px_-_var(--sb-size))] [scrollbar-gutter:stable] [direction:rtl]">
      <div dir="ltr">
        <div className="flex items-center justify-between gap-4">
          <h2>Timeline</h2>
          {!!(filters.date || filters.dateTo || (pickerOpen && draftRange?.from)) && <Button type="button" variant="link" size="sm" className="text-red-500 no-underline hover:text-red-600 hover:no-underline" aria-label="Reset pilihan timeline" onClick={() => { setDraftRange(undefined); setPickerOpen(false); onChange({ period: "today", date: "", dateTo: "" }); }}>Reset</Button>}
        </div>
        <Popover open={pickerOpen} onOpenChange={(open) => {
          if (open) setDraftRange(selectedDate ? { from: selectedDate, to: selectedEnd } : undefined);
          setPickerOpen(open);
        }}>
          <PopoverTrigger asChild><Button variant={displayedFrom ? "outline" : "filter"} className="gis-time-picker mt-2 w-full justify-start rounded-2xl" data-active={!!displayedFrom}><IconCalendarWeek className="size-4" aria-hidden="true" /><span className="min-w-0 truncate" aria-live="polite" title={dateLabel}>{dateLabel}</span></Button></PopoverTrigger>
          <PopoverContent sticky="always" collisionPadding={16} className="w-auto max-h-[min(calc(100dvh-32px),var(--radix-popover-content-available-height))] overflow-y-auto overscroll-contain rounded-2xl p-0" align="start" aria-label="Pilih rentang tanggal Timeline">
            <CalendarTimeline captionLayout="dropdown" reverseYears className="rounded-none border-0" mode="range" locale={id} selected={draftRange} today={currentDate} endMonth={currentDate} hidden={currentDate ? { after: currentDate } : undefined} disabled={currentDate ? { after: currentDate } : undefined} showOutsideDays={false} defaultMonth={selectedDate ?? new Date(currentYear, currentMonth - 1, 1)} onSelect={setDraftRange} />
            <div className="flex items-center justify-between gap-4 p-4 pt-0">
              <Button variant="outline" className="flex-1 w-full" onClick={() => { setDraftRange(undefined); onChange({ period: "custom", date: "", dateTo: "" }); }}>Hapus tanggal</Button>
              <Button className="flex-1 w-full" onClick={applyRange} disabled={!draftRange?.from}>Terapkan</Button>
            </div>
          </PopoverContent>
        </Popover>
        <div className="gis-timeline-months flex flex-col gap-4 mt-4 [&_h3]:text-[var(--gis-blue)] [&_h3]:text-[16px] [&_h3]:leading-[24px] [&_h3]:font-normal [&_h3]:mb-2">{months.map((month) => (
          <section key={month.id} aria-label={`${month.label} ${month.id.slice(0, 4)}`}>
            <h3>{month.label} {month.id.slice(0, 4)}</h3>
            <div className="gis-day-grid grid grid-cols-[repeat(7,minmax(0,1fr))] gap-x-0 gap-y-2">
              {weekdays.map((day) => <abbr key={day.name} title={day.name} className="flex h-8 items-center justify-center text-[0.8rem] font-normal text-neutral-500 no-underline">{day.short}</abbr>)}
              {Array.from({ length: month.firstWeekday }, (_, index) => <span key={`empty-${index}`} aria-hidden="true" />)}
              {month.dates.filter((date) => !today || date <= today).map((date, index) => {
                const selected = isSelectedDate(date);
                const rangeStart = selected && date === displayedFrom;
                const rangeEnd = selected && date === displayedTo;
                const weekday = (month.firstWeekday + index) % 7;
                return <div key={date} className={cn(
                  "relative flex h-8 justify-center",
                  selected && !rangeStart && !rangeEnd && "bg-blue-100",
                  rangeStart && !rangeEnd && "before:absolute before:inset-y-0 before:right-0 before:w-1/2 before:bg-blue-100",
                  rangeEnd && !rangeStart && "before:absolute before:inset-y-0 before:left-0 before:w-1/2 before:bg-blue-100",
                  selected && (rangeStart || weekday === 0 || index === 0) && "rounded-l-lg",
                  selected && (rangeEnd || weekday === 6 || date === today || index === month.dates.length - 1) && "rounded-r-lg"
                )}>
                  <Button variant="ghost" size="icon-sm" aria-label={`Pilih ${index + 1} ${month.label} ${month.id.slice(0, 4)}`} aria-current={date === today ? "date" : undefined} aria-pressed={selected} data-selected={selected} data-today={date === today} data-range-start={rangeStart} data-range-end={rangeEnd} className={cn(
                    "relative z-1 size-8 rounded-lg border-0 p-0 text-sm! leading-5! font-normal! shadow-none focus-visible:ring-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500",
                    rangeStart || rangeEnd
                      ? "bg-blue-500! text-white! hover:bg-blue-500! hover:text-white!"
                      : selected
                        ? "bg-transparent! text-black! hover:bg-blue-200!"
                        : "bg-transparent text-black hover:bg-blue-50",
                    date === today && !selected && (displayedFrom
                      ? "border border-blue-500 text-blue-500!"
                      : "bg-blue-500! text-white! hover:bg-blue-500! hover:text-white!")
                  )} onClick={() => selectDate(date)}>{index + 1}</Button>
                </div>;
              })}</div>
          </section>
        ))}</div>
        <p className="sr-only">Tanpa pilihan tanggal, ringkasan histori memakai tahun berjalan. Parameter spasial tidak memiliki filter waktu.</p>
      </div>
      </div>
    </aside>
  );
}
