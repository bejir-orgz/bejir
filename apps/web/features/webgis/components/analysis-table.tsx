"use client";

import { useState } from "react";
import { getCoreRowModel, getPaginationRowModel, getSortedRowModel, useReactTable, type Column, type ColumnDef, type SortingState } from "@tanstack/react-table";
import { IconChevronLeft, IconChevronRight, IconDots, IconSelector } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/shared/data-table";
import { getPageItems } from "@/lib/pagination";
import type { AnalysisRow, SusceptibilityClass } from "../analysis-types";

const numberFormatter = new Intl.NumberFormat("id-ID", { maximumFractionDigits: 1 });
const classOrder: SusceptibilityClass[] = ["Sangat Rendah", "Rendah", "Sedang", "Tinggi", "Sangat Tinggi"];

function SortHeader({ column, title }: { column: Column<AnalysisRow>; title: string }) {
  return <Button variant="ghost" className="analysis-sort" aria-label={`Urutkan ${title}`} onClick={column.getToggleSortingHandler()}><span>{title}</span><IconSelector className="size-6" aria-hidden="true" /></Button>;
}
const columns: ColumnDef<AnalysisRow>[] = [
  { accessorKey: "region", header: "Kota/Kabupaten", enableSorting: false },
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
  const table = useReactTable({ data: rows, columns, state: { sorting }, onSortingChange: setSorting, getCoreRowModel: getCoreRowModel(), getSortedRowModel: getSortedRowModel(), getPaginationRowModel: getPaginationRowModel(), initialState: { pagination: { pageSize: 10 } }, getRowId: (row) => row.id });
  const { pageIndex } = table.getState().pagination;
  return <DataTable table={table} caption="Kerawanan wilayah Jawa Barat — data dummy" captionClassName="sr-only" className="analysis-table" footer={<div className="analysis-table-footer">
    <span aria-live="polite">Menampilkan {table.getRowModel().rows.length} dari {rows.length}</span>
    <nav aria-label="Halaman kerawanan wilayah">
      <Button variant="ghost" className="analysis-page-arrow" aria-label="Halaman sebelumnya" disabled={!table.getCanPreviousPage()} onClick={() => table.previousPage()}><IconChevronLeft className="size-6" /></Button>
      {getPageItems(table.getPageCount(), pageIndex).map((page, index) => page === "ellipsis" ? <span className="analysis-page-dots" key={`dots-${index}`}><IconDots className="size-4" aria-label="Halaman lainnya" /></span> : <Button variant="ghost" className="analysis-page-number" key={page} aria-label={`Halaman ${page}`} aria-current={pageIndex + 1 === page ? "page" : undefined} onClick={() => table.setPageIndex(page - 1)}>{page}</Button>)}
      <Button variant="ghost" className="analysis-page-arrow" aria-label="Halaman berikutnya" disabled={!table.getCanNextPage()} onClick={() => table.nextPage()}><IconChevronRight className="size-6" /></Button>
    </nav>
  </div>} />;
}
