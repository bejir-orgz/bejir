"use client";

import { IconChevronLeft, IconChevronRight } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { CalendarSelector } from "@/components/ui/calendar-selector";
import { cn } from "@/lib/utils";

export const calendarMonths = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];

/** Month-resolution calendar using the same shadcn controls and frame as CalendarBase. */
export function CalendarMonth({ year, years, month, onYearChange, onMonthChange }: {
  year: number;
  years: readonly number[];
  month: string;
  onYearChange: (year: number) => void;
  onMonthChange: (month: string) => void;
}) {
  const availableYears = [...new Set(years)].sort((a, b) => a - b);
  const index = availableYears.indexOf(year);
  const navClassName = "border border-blue-500 bg-blue-100 text-blue-500 hover:bg-blue-200";
  return (
    <section aria-label="Kalender bulan" className="flex w-[274px] max-w-full flex-col gap-4 rounded-2xl border border-neutral-300 bg-white p-3 text-black">
      <div className="flex h-8 items-center justify-between gap-2">
        <Button variant="ghost" size="icon-sm" className={navClassName} aria-label="Tahun sebelumnya" disabled={index <= 0} onClick={() => onYearChange(availableYears[index - 1])}><IconChevronLeft className="size-4" aria-hidden="true" /></Button>
        <CalendarSelector options={[...availableYears].reverse().map((value) => ({ value, label: String(value) }))} value={year} onValueChange={onYearChange} aria-label={`Pilih tahun kalender, ${year}`} />
        <Button variant="ghost" size="icon-sm" className={navClassName} aria-label="Tahun berikutnya" disabled={index < 0 || index === availableYears.length - 1} onClick={() => onYearChange(availableYears[index + 1])}><IconChevronRight className="size-4" aria-hidden="true" /></Button>
      </div>
      <div className="grid grid-cols-3 gap-2" role="group" aria-label={`Pilih bulan pada ${year}`}>
        {calendarMonths.map((label, index) => {
          const value = String(index + 1).padStart(2, "0");
          return <Button key={value} variant={month === value ? "default" : "ghost"} size="sm" aria-label={`Pilih ${label} ${year}`} aria-pressed={month === value} className={cn("px-1 [&]:text-sm! [&]:font-normal!", month !== value && "text-black")} onClick={() => onMonthChange(value)}>{label}</Button>;
        })}
      </div>
      <Button variant="outline" className="w-full" onClick={() => onMonthChange("")}>Hapus bulan</Button>
    </section>
  );
}
