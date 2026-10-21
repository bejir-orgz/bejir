"use client";

import { useState } from "react";
import { getCoreRowModel, getPaginationRowModel, getSortedRowModel, useReactTable, type Column, type ColumnDef, type SortingState } from "@tanstack/react-table";
import { IconChevronLeft, IconChevronRight, IconDots, IconSelector } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/shared/data-table";
import { getPageItems as historyPageItems } from "@/lib/pagination";
import type { FloodHistoryRow } from "../types";

const dateFormatter = new Intl.DateTimeFormat("id-ID", { day: "2-digit", month: "short", year: "numeric" });
const areaFormatter = new Intl.NumberFormat("id-ID", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function SortHeader({ column, title }: { column: Column<FloodHistoryRow>; title: string }) {
  return <Button variant="ghost" className="history-sort" onClick={column.getToggleSortingHandler()} aria-label={`Urutkan ${title}`}><span>{title}</span><IconSelector className="size-6" aria-hidden="true" /></Button>;
}
const columns: ColumnDef<FloodHistoryRow>[] = [
  { accessorKey: "date", header: ({ column }) => <SortHeader column={column} title="Tanggal" />, cell: ({ row }) => dateFormatter.format(new Date(`${row.original.date}T12:00:00`)) },
  { accessorKey: "region", header: "Kota/Kabupaten", enableSorting: false },
  { accessorKey: "district", header: "Lokasi", enableSorting: false, cell: ({ row }) => <div className="history-location"><span>{row.original.district}</span><small>{row.original.village}</small></div> },
  { accessorKey: "severity", header: ({ column }) => <SortHeader column={column} title="Keparahan" />, sortingFn: (a, b) => ["Rendah", "Sedang", "Tinggi"].indexOf(a.original.severity) - ["Rendah", "Sedang", "Tinggi"].indexOf(b.original.severity) },
  { accessorKey: "areaKm2", header: ({ column }) => <SortHeader column={column} title="Area" />, cell: ({ row }) => `${areaFormatter.format(row.original.areaKm2)} km²` },
  { accessorKey: "deaths", header: ({ column }) => <SortHeader column={column} title="Korban Meninggal" /> },
  { accessorKey: "missing", header: ({ column }) => <SortHeader column={column} title="Korban Menghilang" /> },
  { id: "total", accessorFn: (row) => row.deaths + row.missing, header: ({ column }) => <SortHeader column={column} title="Total Korban" /> },
];

export function HistoryTable({ rows }: { rows: FloodHistoryRow[] }) {
  const [sorting, setSorting] = useState<SortingState>([]);
  // TanStack owns table pagination and resets it when the filtered row collection changes.
  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({ data: rows, columns, state: { sorting }, onSortingChange: setSorting, getCoreRowModel: getCoreRowModel(), getSortedRowModel: getSortedRowModel(), getPaginationRowModel: getPaginationRowModel(), initialState: { pagination: { pageSize: 10 } }, getRowId: (row) => row.id });
  const { pageIndex } = table.getState().pagination;
  const pageItems = historyPageItems(table.getPageCount(), pageIndex);
  return <DataTable table={table} caption="Histori banjir Jawa Barat — data dummy" captionClassName="sr-only" className="history-table" footer={<div className="history-table-footer">
    <span aria-live="polite">Menampilkan {table.getRowModel().rows.length} dari {rows.length}</span>
    <nav aria-label="Halaman histori banjir">
      <Button variant="ghost" className="history-page-arrow" aria-label="Halaman sebelumnya" disabled={!table.getCanPreviousPage()} onClick={() => table.previousPage()}><IconChevronLeft className="size-6" /></Button>
      {pageItems.map((page, index) => page === "ellipsis" ? <span className="history-page-dots" key={`dots-${index}`}><IconDots className="size-4" aria-label="Halaman lainnya" /></span> : <Button variant="ghost" className="history-page-number" key={page} aria-label={`Halaman ${page}`} aria-current={pageIndex + 1 === page ? "page" : undefined} onClick={() => table.setPageIndex(page - 1)}>{page}</Button>)}
      <Button variant="ghost" className="history-page-arrow" aria-label="Halaman berikutnya" disabled={!table.getCanNextPage()} onClick={() => table.nextPage()}><IconChevronRight className="size-6" /></Button>
    </nav>
  </div>} />;
}
