"use client";

import type { Column } from "@tanstack/react-table";
import { IconSelector, IconSortAscending, IconSortDescending } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/** Sorting state belongs to the table; the icon reflects its current direction. */
export function TableSortHeader<TData>({ column, title, className }: {
  column: Column<TData>;
  title: string;
  className?: string;
}) {
  const sorting = column.getIsSorted();
  const SortIcon = sorting === "asc" ? IconSortAscending : sorting === "desc" ? IconSortDescending : IconSelector;
  return (
    <Button
      variant="ghost"
      className={cn("h-auto gap-2 whitespace-normal p-0 text-left text-inherit hover:bg-transparent hover:text-inherit", className)}
      aria-label={`Urutkan ${title}`}
      onClick={column.getToggleSortingHandler()}
    >
      <span>{title}</span>
      <SortIcon data-sort-direction={sorting || "none"} className={cn("size-6", sorting ? "text-blue-500" : "text-neutral-300")} aria-hidden="true" />
    </Button>
  );
}
