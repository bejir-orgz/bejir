"use client";

import type { Column } from "@tanstack/react-table";
import { useCallback } from "react";
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
  const nextSorting = column.getNextSortingOrder();
  const SortIcon = sorting === "asc" ? IconSortAscending : sorting === "desc" ? IconSortDescending : IconSelector;
  const CursorIcon = nextSorting === "desc" ? IconSortDescending : IconSortAscending;
  // Reuse the installed Tabler SVG for the browser cursor without storing icon assets.
  const cursorRef = useCallback((icon: SVGSVGElement | null) => {
    const button = icon?.parentElement;
    if (!icon || !button) return;
    if (!nextSorting) {
      button.style.cursor = "pointer";
      return;
    }
    const cursor = icon.cloneNode(true) as SVGSVGElement;
    cursor.removeAttribute("class");
    cursor.setAttribute("stroke", "#ffffff");
    // Draw a slightly wider black copy behind the white Tabler strokes.
    for (const path of Array.from(cursor.children)) {
      const outline = path.cloneNode(true) as SVGElement;
      outline.setAttribute("stroke", "#000000");
      outline.setAttribute("stroke-width", "3.5");
      cursor.insertBefore(outline, cursor.firstChild);
    }
    button.style.cursor = `url("data:image/svg+xml,${encodeURIComponent(cursor.outerHTML)}") 12 12, pointer`;
  }, [nextSorting]);
  return (
    <Button
      variant="ghost"
      className={cn("h-auto gap-2 whitespace-normal p-0 text-left text-inherit hover:bg-transparent hover:text-inherit", className)}
      aria-label={`Urutkan ${title}`}
      onClick={column.getToggleSortingHandler()}
    >
      <span>{title}</span>
      <SortIcon data-sort-direction={sorting || "none"} className={cn("size-6", sorting ? "text-blue-500" : "text-neutral-300")} aria-hidden="true" />
      <CursorIcon ref={cursorRef} className="hidden" aria-hidden="true" />
    </Button>
  );
}
