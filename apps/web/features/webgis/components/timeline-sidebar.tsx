"use client";

import { useState, useSyncExternalStore } from "react";
import { IconCalendarWeek } from "@tabler/icons-react";
import { id } from "date-fns/locale";
import { format } from "date-fns";
import type { DateRange } from "react-day-picker";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { getCurrentTimelinePeriod, getTimelineMonths } from "../timeline";
import type { WorkspaceFilters } from "../types";

function subscribeToMonthChange(callback: () => void) {
  const timer = window.setInterval(callback, 60_000);
  return () => window.clearInterval(timer);
}
const getServerPeriod = () => null;

export function TimelineSidebar({ year, filters, hidden, onChange }: {
  year: number;
  filters: WorkspaceFilters;
  hidden: boolean;
  onChange: (patch: Partial<WorkspaceFilters>) => void;
}) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const [draftRange, setDraftRange] = useState<DateRange>();
  const period = useSyncExternalStore(subscribeToMonthChange, getCurrentTimelinePeriod, getServerPeriod);
  const [currentYear, currentMonth] = period ? period.split("-").map(Number) : [year, 1];
  const months = getTimelineMonths(currentYear, currentMonth - 1);
  const selectedDate = filters.date ? new Date(`${filters.date}T00:00:00`) : undefined;
  const selectedEnd = filters.dateTo ? new Date(`${filters.dateTo}T00:00:00`) : undefined;
  const dateLabel = selectedDate
    ? `${format(selectedDate, "dd/MM/yyyy")}${selectedEnd && filters.dateTo !== filters.date ? ` – ${format(selectedEnd, "dd/MM/yyyy")}` : ""}`
    : "Pilih waktu";
  const isSelectedDate = (date: string) => !!filters.date && date >= filters.date && date <= (filters.dateTo || filters.date);

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
    <aside id="gis-timeline-panel" hidden={hidden} className="gis-left absolute z-2 [inset:0_auto_0_0] w-66 border-0 rounded-[0_16px_16px_0] bg-[white] overflow-y-auto [scrollbar-width:auto] [clip-path:inset(0_round_0_16px_16px_0)] [transform:translateX(0)] [transition:transform_var(--gis-slide-duration)_var(--gis-slide-easing),display_var(--gis-slide-duration)_allow-discrete] [&[hidden]]:hidden [&[hidden]]:[transform:translateX(-100%)] starting:[&:not([hidden])]:[transform:translateX(-100%)] [&_h1]:text-[24px] [&_h1]:leading-[32px] [&_h1]:font-medium [&_h2]:text-[24px] [&_h2]:leading-[32px] [&_h2]:font-medium [--sb-track-color:#fff] [--sb-thumb-color:#8EC5FF] [--sb-size:8px] [&::-webkit-scrollbar]:w-[var(--sb-size)] [&::-webkit-scrollbar-track]:bg-[var(--sb-track-color)] [&::-webkit-scrollbar-track]:rounded-2xl [&::-webkit-scrollbar-track]:my-0 [&::-webkit-scrollbar-thumb]:bg-[var(--sb-thumb-color)] [&::-webkit-scrollbar-thumb]:rounded-2xl [@supports_not_selector(::-webkit-scrollbar)]:[scrollbar-color:var(--sb-thumb-color)_var(--sb-track-color)] motion-reduce:[transition:none] gis-timeline-sidebar bottom-0 min-h-0 max-h-[none] p-4 pl-3 pr-5 [direction:rtl]" aria-label="Timeline">
      <div dir="ltr">
        <h2>Timeline</h2>
        <Popover open={pickerOpen} onOpenChange={(open) => {
          if (open) setDraftRange(selectedDate ? { from: selectedDate, to: selectedEnd } : undefined);
          setPickerOpen(open);
        }}>
          <PopoverTrigger asChild><Button variant="outline" className="gis-time-picker flex w-full h-[38px] justify-start gap-2 p-[8px_16px] mt-2 [border:1px_solid_#a1a1a1] rounded-2xl shadow-none text-[#737373] text-[14px] leading-[20px] font-normal"><IconCalendarWeek className="size-4" aria-hidden="true" /><span className="min-w-0 truncate">{dateLabel}</span></Button></PopoverTrigger>
          <PopoverContent sticky="always" collisionPadding={16} className="w-auto max-h-[min(calc(100dvh_-_32px),var(--radix-popover-content-available-height))] overflow-y-auto overscroll-contain rounded-lg p-0" align="start" aria-label="Pilih rentang tanggal Timeline">
            <Calendar mode="range" locale={id} selected={draftRange} defaultMonth={selectedDate ?? new Date(currentYear, currentMonth - 2, 1)} onSelect={setDraftRange} />
            <div className="flex items-center justify-between gap-4 border-t p-4">
              <Button variant="ghost" onClick={() => { setDraftRange(undefined); onChange({ period: "custom", date: "", dateTo: "" }); }}>Hapus tanggal</Button>
              <Button onClick={applyRange} disabled={!draftRange?.from}>Terapkan</Button>
            </div>
          </PopoverContent>
        </Popover>
        <div className="gis-timeline-months flex flex-col gap-4 mt-2 [&_h3]:text-[var(--gis-blue)] [&_h3]:text-[16px] [&_h3]:leading-[24px] [&_h3]:font-normal [&_h3]:mb-2">{months.map((month) => (
          <section key={month.id} aria-label={`${month.label} ${month.id.slice(0, 4)}`}>
            <h3>{month.label}</h3>
            <div className="gis-day-grid grid grid-cols-[repeat(7,minmax(0,1fr))] gap-[0_8px] [&_button]:h-7 [&_button]:p-[4px_0] [&_button]:rounded-lg [&_button]:text-[14px] [&_button]:leading-[20px] [&_button]:font-normal [&_.gis-day-selected]:bg-[var(--gis-blue)] [&_.gis-day-selected]:text-[white]">{month.dates.map((date, index) => (
              <Button key={date} variant="ghost" size="sm" aria-label={`Pilih ${index + 1} ${month.label} ${month.id.slice(0, 4)}`} aria-pressed={isSelectedDate(date)} className={isSelectedDate(date) ? "gis-day-selected" : ""} onClick={() => selectDate(date)}>{index + 1}</Button>
            ))}</div>
          </section>
        ))}</div>
        <p className="sr-only">Pilihan waktu hanya disimpan secara lokal dan tidak memfilter data nyata.</p>
      </div>
    </aside>
  );
}
