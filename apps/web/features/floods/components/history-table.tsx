"use client";

import { useState } from "react";
import { getCoreRowModel, getPaginationRowModel, getSortedRowModel, useReactTable, type ColumnDef, type SortingState } from "@tanstack/react-table";
import { IconChevronLeft, IconChevronRight, IconDots } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { TableSortHeader as SortHeader } from "@/components/shared/table-sort-header";
import { DataTable } from "@/components/shared/data-table";
import { getPageItems as historyPageItems } from "@/lib/pagination";
import type { FloodHistoryRow } from "../types";

const dateFormatter = new Intl.DateTimeFormat("id-ID", { day: "2-digit", month: "short", year: "numeric" });
const countFormatter = new Intl.NumberFormat("id-ID");

const columns: ColumnDef<FloodHistoryRow>[] = [
  { accessorKey: "date", header: ({ column }) => <SortHeader column={column} title="Tanggal" />, cell: ({ row }) => row.original.date ? dateFormatter.format(new Date(`${row.original.date}T12:00:00`)) : "—" },
  { accessorKey: "region", header: ({ column }) => <SortHeader column={column} title="Kota/Kabupaten" /> },
  { accessorKey: "floodType", header: ({ column }) => <SortHeader column={column} title="Jenis Banjir" />, cell: ({ row }) => row.original.floodType ?? "—" },
  { accessorKey: "housesFlooded", header: ({ column }) => <SortHeader column={column} title="Rumah Terpendam" />, cell: ({ row }) => row.original.housesFlooded === null ? "—" : `${countFormatter.format(row.original.housesFlooded)} unit` },
  { accessorKey: "deaths", header: ({ column }) => <SortHeader column={column} title="Korban Meninggal" />, cell: ({ row }) => row.original.deaths ?? "—" },
  { accessorKey: "missing", header: ({ column }) => <SortHeader column={column} title="Korban Menghilang" />, cell: ({ row }) => row.original.missing ?? "—" },
  { id: "total", accessorFn: (row) => row.deaths === null || row.missing === null ? null : row.deaths + row.missing, cell: ({ getValue }) => getValue<number | null>() ?? "—", header: ({ column }) => <SortHeader column={column} title="Total Korban" className="gap-1 whitespace-nowrap" /> },
];

export function HistoryTable({ rows }: { rows: FloodHistoryRow[] }) {
  const [sorting, setSorting] = useState<SortingState>([]);
  // TanStack owns table pagination and resets it when the filtered row collection changes.
  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({ data: rows, columns, sortDescFirst: false, enableMultiSort: false, state: { sorting }, onSortingChange: setSorting, getCoreRowModel: getCoreRowModel(), getSortedRowModel: getSortedRowModel(), getPaginationRowModel: getPaginationRowModel(), initialState: { pagination: { pageSize: 10 } }, getRowId: (row) => row.id });
  const { pageIndex } = table.getState().pagination;
  const pageItems = historyPageItems(table.getPageCount(), pageIndex);
  return <DataTable table={table} caption="Histori banjir Jawa Barat" captionClassName="sr-only" className="history-table [&_[data-slot=data-table-frame]]:border-0 [&_[data-slot=data-table-frame]]:rounded-none [&_[data-slot=data-table-frame]]:-mx-4 [&_[data-slot=data-table-frame]]:w-[calc(100%+32px)] [&_th:first-child]:pl-4 [&_th:last-child]:pr-4 [&_td:first-child]:pl-4 [&_td:last-child]:pr-4 [&_table]:table-auto [&_table]:min-w-292 [&_tr]:h-16 [&_tr]:border-0 [&_thead_tr]:[border-bottom:1px_solid_#d4d4d4] [&_th]:p-2 [&_th]:text-[14px] [&_th]:leading-[20px] [&_th]:font-medium [&_th]:text-left [&_td]:p-2 [&_td]:text-[14px] [&_td]:leading-[20px] [&_td]:font-normal [&_td]:text-left [&_th]:text-[#2b7fff] [&_th:last-child]:text-right [&_td:last-child]:text-right [&_th:last-child_button]:ml-auto [&_th:last-child_.history-sort]:gap-1 [&_th:last-child_.history-sort]:whitespace-nowrap" footer={<div className="history-table-footer -mx-4 w-[calc(100%+32px)] border-t border-neutral-300 px-4 pt-4 flex items-center justify-between gap-4 text-[14px] leading-[20px] [&_nav]:flex [&_nav]:items-center [&_nav]:gap-2 max-[700.01px]:flex-wrap max-[700.01px]:[&_nav]:gap-1">
    <span aria-live="polite">Menampilkan {table.getRowModel().rows.length} dari {rows.length}</span>
    <nav aria-label="Halaman histori banjir">
      <Button variant="ghost" className="history-page-arrow h-10 min-w-10 p-2 rounded-[10px] text-[#2b7fff] text-[14px] font-normal bg-[#dbeafe] max-[700.01px]:min-w-8 max-[700.01px]:w-8 max-[700.01px]:h-8 max-[700.01px]:rounded-lg leading-[1.3333333333]" aria-label="Halaman sebelumnya" disabled={!table.getCanPreviousPage()} onClick={() => table.previousPage()}><IconChevronLeft className="size-6" /></Button>
      {pageItems.map((page, index) => page === "ellipsis" ? <span className="history-page-dots grid [place-items:center] w-8 text-[#2b7fff]" key={`dots-${index}`}><IconDots className="size-4" aria-label="Halaman lainnya" /></span> : <Button variant="ghost" className="history-page-number h-10 min-w-10 p-2 rounded-[10px] text-[#2b7fff] text-[14px] font-normal [&[aria-current=page]]:[border:1px_solid_#2b7fff] max-[700.01px]:min-w-8 max-[700.01px]:w-8 max-[700.01px]:h-8 max-[700.01px]:rounded-lg leading-[1.3333333333]" key={page} aria-label={`Halaman ${page}`} aria-current={pageIndex + 1 === page ? "page" : undefined} onClick={() => table.setPageIndex(page - 1)}>{page}</Button>)}
      <Button variant="ghost" className="history-page-arrow h-10 min-w-10 p-2 rounded-[10px] text-[#2b7fff] text-[14px] font-normal bg-[#dbeafe] max-[700.01px]:min-w-8 max-[700.01px]:w-8 max-[700.01px]:h-8 max-[700.01px]:rounded-lg leading-[1.3333333333]" aria-label="Halaman berikutnya" disabled={!table.getCanNextPage()} onClick={() => table.nextPage()}><IconChevronRight className="size-6" /></Button>
    </nav>
  </div>} />;
}
