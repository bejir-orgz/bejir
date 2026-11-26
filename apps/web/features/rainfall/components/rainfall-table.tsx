"use client";

import { useMemo, useState } from "react";
import { getCoreRowModel, getPaginationRowModel, getSortedRowModel, useReactTable, type ColumnDef, type SortingState } from "@tanstack/react-table";
import { IconChevronLeft, IconChevronRight, IconDots } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { TableSortHeader as SortHeader } from "@/components/shared/table-sort-header";
import { DataTable } from "@/components/shared/data-table";
import { StatusPill } from "@/components/shared/status-pill";
import { getPageItems } from "@/lib/pagination";
import type { RainfallClass, RainfallRow } from "../types";

const periodFormatter = new Intl.DateTimeFormat("id-ID", { month: "long", year: "numeric" });
const monthFormatter = new Intl.DateTimeFormat("id-ID", { month: "long" });
const rainfallFormatter = new Intl.NumberFormat("id-ID", { maximumFractionDigits: 1 });
const classOrder: RainfallClass[] = ["Sangat Rendah", "Rendah", "Sedang", "Tinggi", "Sangat Tinggi"];

export function RainfallTable({ rows, error }: { rows: RainfallRow[]; error?: string }) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const maxRainfall = useMemo(
    () => Math.max(1, ...rows.map((row) => (row.rainfallMm != null && Number.isFinite(row.rainfallMm) ? row.rainfallMm : 0))),
    [rows],
  );

  const columns = useMemo<ColumnDef<RainfallRow>[]>(
    () => [
      {
        accessorKey: "period",
        header: ({ column }) => <SortHeader column={column} title="Tanggal" />,
        cell: ({ row: { original: row } }) =>
          row.period
            ? periodFormatter.format(new Date(`${row.period}-01T12:00:00`))
            : row.month
              ? `${monthFormatter.format(new Date(2000, row.month - 1, 1))}${row.year ? ` ${row.year}` : ""}`
              : row.year
                ? String(row.year)
                : "—",
      },
      { accessorKey: "region", header: ({ column }) => <SortHeader column={column} title="Kota/Kabupaten" /> },
      {
        accessorKey: "classification",
        header: ({ column }) => <SortHeader column={column} title="Klasifikasi" />,
        cell: ({ row }) => <StatusPill label={row.original.classification} />,
        sortingFn: (a, b) =>
          (a.original.classification === null ? -1 : classOrder.indexOf(a.original.classification)) -
          (b.original.classification === null ? -1 : classOrder.indexOf(b.original.classification)),
      },
      {
        accessorKey: "rainfallMm",
        header: ({ column }) => <SortHeader column={column} title="Curah Hujan/Bulan" />,
        cell: ({ row }) => {
          const val = row.original.rainfallMm;
          if (val === null) return "—";
          const pct = Math.min(100, Math.max(4, Math.round((val / maxRainfall) * 100)));
          return (
            <div className="flex flex-col gap-1 pr-4">
              <span className="tabular-nums font-medium">{rainfallFormatter.format(val)} mm</span>
              <span className="h-1 w-24 overflow-hidden rounded-full bg-blue-100" aria-hidden="true">
                <span className="block h-full rounded-full bg-blue-500 transition-[width] duration-300" style={{ width: `${pct}%` }} />
              </span>
            </div>
          );
        },
      },
      {
        accessorKey: "minimumMm",
        header: ({ column }) => <SortHeader column={column} title="Minimum" />,
        cell: ({ row }) => (row.original.minimumMm === null ? "—" : <span className="tabular-nums">{rainfallFormatter.format(row.original.minimumMm)} mm</span>),
      },
      {
        accessorKey: "maximumMm",
        header: ({ column }) => <SortHeader column={column} title="Maksimum" />,
        cell: ({ row }) => (row.original.maximumMm === null ? "—" : <span className="tabular-nums">{rainfallFormatter.format(row.original.maximumMm)} mm</span>),
      },
    ],
    [maxRainfall],
  );

  // TanStack resets pagination whenever local filtering changes the supplied row collection.
  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({ data: rows, columns, sortDescFirst: false, enableMultiSort: false, state: { sorting }, onSortingChange: setSorting, getCoreRowModel: getCoreRowModel(), getSortedRowModel: getSortedRowModel(), getPaginationRowModel: getPaginationRowModel(), initialState: { pagination: { pageSize: 10 } }, getRowId: (row) => row.id });
  const { pageIndex } = table.getState().pagination;
  return <DataTable table={table} error={error} caption="Curah hujan Jawa Barat" captionClassName="sr-only" className="rainfall-table [&_[data-slot=data-table-frame]]:border-0 [&_[data-slot=data-table-frame]]:rounded-none [&_[data-slot=data-table-frame]]:-mx-4 [&_[data-slot=data-table-frame]]:w-[calc(100%+32px)] [&_th:first-child]:pl-4 [&_th:last-child]:pr-4 [&_td:first-child]:pl-4 [&_td:last-child]:pr-4 [&_table]:table-fixed [&_table]:min-w-292 [&_tr]:h-16 [&_tr]:border-0 [&_tbody_tr]:border-b [&_tbody_tr]:border-neutral-100 [&_tbody_tr:last-child]:border-0 [&_tbody_tr]:transition-colors [&_tbody_tr:hover]:bg-blue-50/45 [&_thead_tr]:[border-bottom:1px_solid_#d4d4d4] [&_th]:p-[8px_0] [&_th]:text-[14px] [&_th]:leading-[20px] [&_th]:font-medium [&_th]:text-left [&_td]:p-[8px_0] [&_td]:text-[14px] [&_td]:leading-[20px] [&_td]:font-normal [&_td]:text-left [&_th]:text-[#2b7fff] [&_th]:w-42 [&_th:first-child]:w-40" footer={<div className="rainfall-table-footer -mx-4 w-[calc(100%+32px)] border-t border-neutral-300 px-4 pt-4 flex items-center justify-between gap-4 text-[14px] leading-[20px] [&_nav]:flex [&_nav]:items-center [&_nav]:gap-2 max-[700.01px]:flex-wrap max-[700.01px]:[&_nav]:gap-1">
    <span aria-live="polite">Menampilkan {table.getRowModel().rows.length} dari {rows.length}</span>
    <nav aria-label="Halaman curah hujan">
      <Button variant="ghost" className="rainfall-page-arrow h-10 min-w-10 p-2 rounded-[10px] text-[#2b7fff] text-[14px] font-normal bg-[#dbeafe] max-[700.01px]:min-w-8 max-[700.01px]:w-8 max-[700.01px]:h-8 max-[700.01px]:rounded-lg leading-[1.3333333333]" aria-label="Halaman sebelumnya" disabled={!table.getCanPreviousPage()} onClick={() => table.previousPage()}><IconChevronLeft className="size-6" /></Button>
      {getPageItems(table.getPageCount(), pageIndex).map((page, index) => page === "ellipsis" ? <span className="rainfall-page-dots grid [place-items:center] w-8 text-[#2b7fff]" key={`dots-${index}`}><IconDots className="size-4" aria-label="Halaman lainnya" /></span> : <Button variant="ghost" className="rainfall-page-number h-10 min-w-10 p-2 rounded-[10px] text-[#2b7fff] text-[14px] font-normal [&[aria-current=page]]:[border:1px_solid_#2b7fff] max-[700.01px]:min-w-8 max-[700.01px]:w-8 max-[700.01px]:h-8 max-[700.01px]:rounded-lg leading-[1.3333333333]" key={page} aria-label={`Halaman ${page}`} aria-current={pageIndex + 1 === page ? "page" : undefined} onClick={() => table.setPageIndex(page - 1)}>{page}</Button>)}
      <Button variant="ghost" className="rainfall-page-arrow h-10 min-w-10 p-2 rounded-[10px] text-[#2b7fff] text-[14px] font-normal bg-[#dbeafe] max-[700.01px]:min-w-8 max-[700.01px]:w-8 max-[700.01px]:h-8 max-[700.01px]:rounded-lg leading-[1.3333333333]" aria-label="Halaman berikutnya" disabled={!table.getCanNextPage()} onClick={() => table.nextPage()}><IconChevronRight className="size-6" /></Button>
    </nav>
  </div>} />;
}
