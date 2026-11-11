"use client";

import { IconCaretDown } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { YearPicker, type YearPickerProps } from "@/components/ui/year-picker";
import { cn } from "@/lib/utils";

/** Figma 296:4971. Shared controlled year filter for page headers. */
export function YearFilterButton({ years, value, onValueChange, disabled = false, className }: YearPickerProps & {
  disabled?: boolean;
  className?: string;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button disabled={disabled || !years.length} aria-label={`Pilih tahun, ${value}`} className={cn("h-10 w-[113px] gap-6 rounded-2xl bg-blue-500 px-4 py-2 text-white [&]:text-sm! [&]:leading-5! [&]:font-normal!", className)}>
          <span>{value}</span>
          <IconCaretDown className="size-6 fill-current" aria-hidden="true" />
        </Button>
      </DropdownMenuTrigger>
      <YearPicker years={years} value={value} onValueChange={onValueChange} />
    </DropdownMenu>
  );
}
