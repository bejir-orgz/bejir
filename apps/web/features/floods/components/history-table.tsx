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
  return <Button variant="ghost" className="history-sort p-0 h-auto gap-2 text-[inherit] text-[14px] font-medium whitespace-normal text-left [&:hover]:text-[#155dfc] [&:hover]:bg-[transparent] leading-[1.3333333333]" onClick={column.getToggleSortingHandler()} aria-label={`Urutkan ${title}`}><span>{title}</span><IconSelector className="size-6" aria-hidden="true" /></Button>;
}
const columns: ColumnDef<FloodHistoryRow>[] = [
  { accessorKey: "date", header: ({ column }) => <SortHeader column={column} title="Tanggal" />, cell: ({ row }) => dateFormatter.format(new Date(`${row.original.date}T12:00:00`)) },
  { accessorKey: "region", header: "Kota/Kabupaten", enableSorting: false },
  { accessorKey: "district", header: "Lokasi", enableSorting: false, cell: ({ row }) => <div className="history-location flex flex-col whitespace-normal [&_small]:text-[12px] [&_small]:leading-[16px] [&_small]:text-[#a1a1a1]"><span>{row.original.district}</span><small>{row.original.village}</small></div> },
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
  return <DataTable table={table} caption="Histori banjir Jawa Barat — data dummy" captionClassName="sr-only" className="history-table [&_[data-slot=data-table-frame]]:border-0 [&_[data-slot=data-table-frame]]:rounded-none [&_table]:table-fixed [&_table]:min-w-292 [&_tr]:h-16 [&_tr]:border-0 [&_thead_tr]:[border-bottom:1px_solid_#d4d4d4] [&_th]:p-2 [&_th]:text-[14px] [&_th]:leading-[20px] [&_th]:font-medium [&_th]:text-left [&_td]:p-2 [&_td]:text-[14px] [&_td]:leading-[20px] [&_td]:font-normal [&_td]:text-left [&_th]:text-[#2b7fff] [&_th:nth-child(1)]:w-40 [&_th:nth-child(2)]:w-40 [&_th:nth-child(3)]:w-30 [&_th:nth-child(4)]:w-32 [&_th:nth-child(5)]:w-26 [&_th:nth-child(6)]:w-[186px] [&_th:nth-child(7)]:w-[186px] [&_th:nth-child(8)]:w-31 [&_th:last-child_.history-sort]:gap-1 [&_th:last-child_.history-sort]:whitespace-nowrap" footer={<div className="history-table-footer [border-top:1px_solid_#d4d4d4] pt-4 flex items-center justify-between gap-4 text-[14px] leading-[20px] [&_nav]:flex [&_nav]:items-center [&_nav]:gap-2 max-[700.01px]:flex-wrap max-[700.01px]:[&_nav]:gap-1">
    <span aria-live="polite">Menampilkan {table.getRowModel().rows.length} dari {rows.length}</span>
    <nav aria-label="Halaman histori banjir">
      <Button variant="ghost" className="history-page-arrow h-10 min-w-10 p-2 rounded-lg text-[#2b7fff] text-[14px] font-normal bg-[#dbeafe] max-[700.01px]:min-w-8 max-[700.01px]:w-8 max-[700.01px]:h-9 leading-[1.3333333333]" aria-label="Halaman sebelumnya" disabled={!table.getCanPreviousPage()} onClick={() => table.previousPage()}><IconChevronLeft className="size-6" /></Button>
      {pageItems.map((page, index) => page === "ellipsis" ? <span className="history-page-dots grid [place-items:center] w-8 text-[#2b7fff]" key={`dots-${index}`}><IconDots className="size-4" aria-label="Halaman lainnya" /></span> : <Button variant="ghost" className="history-page-number h-10 min-w-10 p-2 rounded-lg text-[#2b7fff] text-[14px] font-normal [&[aria-current=page]]:[border:1px_solid_#2b7fff] max-[700.01px]:min-w-8 max-[700.01px]:w-8 max-[700.01px]:h-9 leading-[1.3333333333]" key={page} aria-label={`Halaman ${page}`} aria-current={pageIndex + 1 === page ? "page" : undefined} onClick={() => table.setPageIndex(page - 1)}>{page}</Button>)}
      <Button variant="ghost" className="history-page-arrow h-10 min-w-10 p-2 rounded-lg text-[#2b7fff] text-[14px] font-normal bg-[#dbeafe] max-[700.01px]:min-w-8 max-[700.01px]:w-8 max-[700.01px]:h-9 leading-[1.3333333333]" aria-label="Halaman berikutnya" disabled={!table.getCanNextPage()} onClick={() => table.nextPage()}><IconChevronRight className="size-6" /></Button>
    </nav>
  </div>} />;
}
