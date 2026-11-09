"use client";

import { DropdownMenuContent, DropdownMenuRadioGroup, DropdownMenuRadioItem } from "@/components/ui/dropdown-menu";

export interface YearPickerProps {
  years: readonly number[];
  value: number;
  onValueChange: (year: number) => void;
}

/** Figma 296:4998. Available years belong to the caller's dataset. */
export function YearPicker({ years, value, onValueChange }: YearPickerProps) {
  const options = [...new Set(years)].sort((a, b) => b - a);
  return (
    <DropdownMenuContent align="end" collisionPadding={16} className="w-[115px] min-w-0 rounded-2xl border-neutral-300 bg-white px-4 py-2">
      <DropdownMenuRadioGroup aria-label="Pilih tahun" value={String(value)} onValueChange={(year) => onValueChange(Number(year))} className="flex flex-col gap-2">
        {options.map((year) => (
          <DropdownMenuRadioItem key={year} value={String(year)} className="min-h-5 cursor-pointer rounded-none p-0 text-sm leading-5 font-normal text-neutral-400 focus:bg-blue-50 focus:text-blue-500 data-[state=checked]:text-blue-500 [&>span]:hidden">
            {year}
          </DropdownMenuRadioItem>
        ))}
      </DropdownMenuRadioGroup>
    </DropdownMenuContent>
  );
}
