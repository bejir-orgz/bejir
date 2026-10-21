"use client";

import { flexRender, type Table as TableInstance } from "@tanstack/react-table";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { IconChevronLeft, IconChevronRight } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

/** Feature containers own row data, sorting/filter state, and local or server pagination. */
export function DataTable<TData>({ table, caption, loading = false, error, className, captionClassName, footer }: {
  table: TableInstance<TData>;
  caption: string;
  loading?: boolean;
  error?: string;
  className?: string;
  captionClassName?: string;
  footer?: ReactNode;
}) {
  const columnCount = Math.max(1, table.getVisibleLeafColumns().length);
  const rows = table.getRowModel().rows;
  const message = loading ? "Memuat data…" : error || (!rows.length ? "Data tidak ditemukan." : "");

  return (
    <div className={cn("space-y-4", className)} aria-busy={loading}>
      <div data-slot="data-table-frame" className="overflow-hidden rounded-2xl border border-border">
        <Table>
          <TableCaption className={captionClassName}>{caption}</TableCaption>
          <TableHeader>{table.getHeaderGroups().map((group) => (
            <TableRow key={group.id}>{group.headers.map((header) => (
              <TableHead key={header.id} scope="col" colSpan={header.colSpan} aria-sort={header.column.getCanSort() ? header.column.getIsSorted() === "asc" ? "ascending" : header.column.getIsSorted() === "desc" ? "descending" : "none" : undefined}>
                {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
              </TableHead>
            ))}</TableRow>
          ))}</TableHeader>
          <TableBody>
            {message ? <TableRow><TableCell colSpan={columnCount} className="h-24 text-center" role={error ? "alert" : "status"}>{message}</TableCell></TableRow> : rows.map((row) => (
              <TableRow key={row.id} data-state={row.getIsSelected() ? "selected" : undefined}>
                {row.getVisibleCells().map((cell) => <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>)}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      {footer ?? <nav aria-label="Halaman tabel" className="flex items-center justify-end gap-2">
        <span className="text-xs text-muted-foreground">Halaman {table.getState().pagination.pageIndex + 1}{table.getPageCount() >= 0 ? ` dari ${Math.max(1, table.getPageCount())}` : ""}</span>
        <Button variant="outline" size="sm" disabled={loading || Boolean(error) || !table.getCanPreviousPage()} onClick={() => table.previousPage()}><IconChevronLeft className="size-4" aria-hidden="true" />Sebelumnya</Button>
        <Button variant="outline" size="sm" disabled={loading || Boolean(error) || !table.getCanNextPage()} onClick={() => table.nextPage()}>Berikutnya<IconChevronRight className="size-4" aria-hidden="true" /></Button>
      </nav>}
    </div>
  );
}
