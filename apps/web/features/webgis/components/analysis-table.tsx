"use client";

import { useState } from "react";
import { getCoreRowModel, getPaginationRowModel, getSortedRowModel, useReactTable, type ColumnDef, type SortingState } from "@tanstack/react-table";
import { IconChevronLeft, IconChevronRight, IconDots } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { TableSortHeader as SortHeader } from "@/components/shared/table-sort-header";
import { DataTable } from "@/components/shared/data-table";
import { getPageItems } from "@/lib/pagination";
import type { AnalysisRow, SusceptibilityClass } from "../analysis-types";

const numberFormatter = new Intl.NumberFormat("id-ID", { maximumFractionDigits: 1 });
const classOrder: SusceptibilityClass[] = ["Sangat Rendah", "Rendah", "Sedang", "Tinggi", "Sangat Tinggi"];

const columns: ColumnDef<AnalysisRow>[] = [
  { accessorKey: "region", header: ({ column }) => <SortHeader column={column} title="Kota/Kabupaten" /> },
  { accessorKey: "susceptibility", header: ({ column }) => <SortHeader column={column} title="Kerawanan" />, sortingFn: (a, b) => classOrder.indexOf(a.original.susceptibility) - classOrder.indexOf(b.original.susceptibility) },
  { accessorKey: "population", header: ({ column }) => <SortHeader column={column} title="Penduduk" />, cell: ({ row }) => numberFormatter.format(row.original.population) },
  { accessorKey: "areaKm2", header: ({ column }) => <SortHeader column={column} title="Luas" />, cell: ({ row }) => `${numberFormatter.format(row.original.areaKm2)} km²` },
  { accessorKey: "rivers", header: ({ column }) => <SortHeader column={column} title="Jumlah Sungai" /> },
  { accessorKey: "elevationM", header: ({ column }) => <SortHeader column={column} title="Elevasi" />, cell: ({ row }) => `${numberFormatter.format(row.original.elevationM)} mdpl` },
];

export function AnalysisTable({ rows }: { rows: AnalysisRow[] }) {
  const [sorting, setSorting] = useState<SortingState>([]);
  // TanStack resets pagination when local filtering changes the supplied row collection.
  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({ data: rows, columns, sortDescFirst: false, enableMultiSort: false, state: { sorting }, onSortingChange: setSorting, getCoreRowModel: getCoreRowModel(), getSortedRowModel: getSortedRowModel(), getPaginationRowModel: getPaginationRowModel(), initialState: { pagination: { pageSize: 10 } }, getRowId: (row) => row.id });
  const { pageIndex } = table.getState().pagination;
  return <DataTable table={table} caption="Kerawanan wilayah Jawa Barat — data dummy" captionClassName="sr-only" className="analysis-table [&_[data-slot=data-table-frame]]:border-0 [&_[data-slot=data-table-frame]]:rounded-none [&_[data-slot=data-table-frame]]:-mx-4 [&_[data-slot=data-table-frame]]:w-[calc(100%+32px)] [&_th:first-child]:pl-4 [&_th:last-child]:pr-4 [&_td:first-child]:pl-4 [&_td:last-child]:pr-4 [&_table]:table-fixed [&_table]:min-w-292 [&_tr]:h-16 [&_tr]:border-0 [&_thead_tr]:[border-bottom:1px_solid_#d4d4d4] [&_th]:p-[8px_0] [&_th]:text-[14px] [&_th]:leading-[20px] [&_th]:font-medium [&_th]:text-left [&_td]:p-[8px_0] [&_td]:text-[14px] [&_td]:leading-[20px] [&_td]:font-normal [&_td]:text-left [&_th]:text-[#2b7fff] [&_th]:w-[calc(100%_/_6)]" footer={<div className="analysis-table-footer -mx-4 w-[calc(100%+32px)] border-t border-neutral-300 px-4 pt-4 flex items-center justify-between gap-4 text-[14px] leading-[20px] [&_nav]:flex [&_nav]:items-center [&_nav]:gap-2 max-[700.01px]:flex-wrap max-[700.01px]:[&_nav]:gap-1">
    <span aria-live="polite">Menampilkan {table.getRowModel().rows.length} dari {rows.length}</span>
    <nav aria-label="Halaman kerawanan wilayah">
      <Button variant="ghost" className="analysis-page-arrow h-10 min-w-10 p-2 rounded-[10px] text-[#2b7fff] text-[14px] font-normal bg-[#dbeafe] max-[700.01px]:min-w-8 max-[700.01px]:w-8 max-[700.01px]:h-8 max-[700.01px]:rounded-lg leading-[1.3333333333]" aria-label="Halaman sebelumnya" disabled={!table.getCanPreviousPage()} onClick={() => table.previousPage()}><IconChevronLeft className="size-6" /></Button>
      {getPageItems(table.getPageCount(), pageIndex).map((page, index) => page === "ellipsis" ? <span className="analysis-page-dots grid [place-items:center] w-8 text-[#2b7fff]" key={`dots-${index}`}><IconDots className="size-4" aria-label="Halaman lainnya" /></span> : <Button variant="ghost" className="analysis-page-number h-10 min-w-10 p-2 rounded-[10px] text-[#2b7fff] text-[14px] font-normal [&[aria-current=page]]:[border:1px_solid_#2b7fff] max-[700.01px]:min-w-8 max-[700.01px]:w-8 max-[700.01px]:h-8 max-[700.01px]:rounded-lg leading-[1.3333333333]" key={page} aria-label={`Halaman ${page}`} aria-current={pageIndex + 1 === page ? "page" : undefined} onClick={() => table.setPageIndex(page - 1)}>{page}</Button>)}
      <Button variant="ghost" className="analysis-page-arrow h-10 min-w-10 p-2 rounded-[10px] text-[#2b7fff] text-[14px] font-normal bg-[#dbeafe] max-[700.01px]:min-w-8 max-[700.01px]:w-8 max-[700.01px]:h-8 max-[700.01px]:rounded-lg leading-[1.3333333333]" aria-label="Halaman berikutnya" disabled={!table.getCanNextPage()} onClick={() => table.nextPage()}><IconChevronRight className="size-6" /></Button>
    </nav>
  </div>} />;
}
