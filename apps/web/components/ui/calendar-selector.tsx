"use client";

import type { ChangeEvent } from "react";
import type { DropdownProps } from "react-day-picker";
import { IconChevronDown } from "@tabler/icons-react";
import { Button } from "./button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuTrigger } from "./dropdown-menu";

interface CalendarSelectorProps {
  options: readonly { value: number; label: string; disabled?: boolean }[];
  value: number;
  onValueChange: (value: number) => void;
  disabled?: boolean;
  "aria-label"?: string;
}

/** Shared month/year selector inheriting the shadcn trigger and menu radii. */
export function CalendarSelector({ options, value, onValueChange, disabled, "aria-label": ariaLabel }: CalendarSelectorProps) {
  return <DropdownMenu>
    <DropdownMenuTrigger asChild>
      <Button variant="filter" size="sm" disabled={disabled} aria-label={ariaLabel} className="gap-1 px-2 text-black [&]:text-sm! [&]:font-normal!">
        {options.find((option) => option.value === value)?.label}<IconChevronDown className="size-4" aria-hidden="true" />
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="start" collisionPadding={16} className="w-[var(--radix-dropdown-menu-trigger-width)] min-w-0 border-neutral-300 bg-white px-2 py-2">
      <DropdownMenuRadioGroup aria-label={ariaLabel} value={String(value)} className="flex flex-col gap-2" onValueChange={(next) => onValueChange(Number(next))}>
        {options.map((option) => <DropdownMenuRadioItem key={option.value} value={String(option.value)} disabled={option.disabled} className="min-h-5 cursor-pointer rounded-none p-0 text-sm leading-5 font-normal text-neutral-400 focus:bg-blue-50 focus:text-blue-500 data-[state=checked]:text-blue-500 [&>span]:hidden">{option.label}</DropdownMenuRadioItem>)}
      </DropdownMenuRadioGroup>
    </DropdownMenuContent>
  </DropdownMenu>;
}

/** DayPicker navigation consumes only target.value from the native select event. */
export function CalendarDropdown({ options = [], value, onChange, disabled, "aria-label": ariaLabel }: DropdownProps) {
  return <CalendarSelector options={options} value={Number(value)} disabled={disabled} aria-label={ariaLabel} onValueChange={(next) => onChange?.({ target: { value: String(next) }, currentTarget: { value: String(next) } } as ChangeEvent<HTMLSelectElement>)} />;
}
