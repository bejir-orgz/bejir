# Bejir UI foundations

Visual specifications: [DESIGN.md](../../../../DESIGN.md), based on Figma node 315:375. Local component sources were generated with the official shadcn CLI and adapted to the project's tokens, `cn` utility, and Tabler icons. `components.json` uses new-york, Neutral, CSS variables, and Tabler.

## Adding or changing components

Run `npx shadcn@latest add <name>` from `apps/web`. Review generated changes before accepting overwrites. The current registry can still emit Lucide imports and `cn` package imports despite project configuration: replace them with named `@tabler/icons-react` imports and `@/lib/utils`, respectively. Keep icons decorative with `aria-hidden` and label icon-only controls. Do not install a second icon library or utility package.

Use existing Button, Card, Badge, Checkbox, Input, Label, Textarea, Tabs, Select, Sheet, Popover, Calendar, Tooltip, Dropdown Menu, Pagination, Skeleton, Table, and Chart sources. Add other shadcn primitives as features need them. Semantic HTML layout and map/decorative rendering are not competing component systems.

Button sizes `sm`, `default`, `lg` map to 32/40/48 px heights and 8/10/12 px radii. Icon sizes are 16/24/24 px. Use explicit `size-*` classes when overriding an icon size. `asChild` supports Next.js links.

## Chart example

Charts use [shadcn Chart](https://ui.shadcn.com/docs/components/radix/chart) and its Recharts dependency. Keep this interactive composition in a client component. Data should enter through props from a feature container; never fetch inside `components/ui`.

```tsx
"use client";

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";

const config = {
  events: { label: "Kejadian (contoh)", color: "var(--chart-1)" },
} satisfies ChartConfig;

export function EventChart({ data }: {
  data: { month: string; events: number }[];
}) {
  return (
    <ChartContainer config={config} className="h-64 min-h-48 w-full" aria-label="Kejadian banjir per bulan — data dummy">
      <BarChart accessibilityLayer data={data}>
        <CartesianGrid vertical={false} />
        <XAxis dataKey="month" tickLine={false} axisLine={false} />
        <YAxis allowDecimals={false} tickLine={false} axisLine={false} />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Bar dataKey="events" fill="var(--color-events)" radius={4} />
      </BarChart>
    </ChartContainer>
  );
}
```

Use ChartLegend/ChartLegendContent for multiple series. Provide a visible heading, period, units and source, plus a textual summary/table. Pass empty/loading/error states from the feature. ChartConfig is developer-owned presentation configuration, not arbitrary API-supplied CSS. Status/rainfall classes use the documented data colors; generic series use chart tokens. No chart data or network requests are built into these primitives.

## Table example

Simple tables use Table/TableHeader/TableBody/TableRow/TableHead/TableCell. For interactive tables, the [shadcn Data Table pattern](https://ui.shadcn.com/docs/components/radix/data-table) uses TanStack Table v8. Our shared DataTable accepts an existing typed table instance, so a feature can choose local or server pagination without changing table markup.

```tsx
"use client";

import { getCoreRowModel, getPaginationRowModel, useReactTable, type ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/shared/data-table";

type EventRow = { id: string; region: string; events: number };
const columns: ColumnDef<EventRow>[] = [
  { accessorKey: "region", header: "Daerah" },
  { accessorKey: "events", header: "Kejadian", cell: ({ row }) => <div className="text-right tabular-nums">{row.original.events}</div> },
];

export function EventTable({ data }: { data: EventRow[] }) {
  const table = useReactTable({
    data,
    columns,
    getRowId: (row) => row.id,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageIndex: 0, pageSize: 10 } },
  });
  return <DataTable table={table} caption="Kejadian banjir — data dummy" />;
}
```

Keep data/column references stable. A feature with real large datasets should use controlled pagination/sorting/filter state, `manualPagination`/`manualSorting`/`manualFiltering`, `rowCount` or `pageCount`, and an API adapter. Supply only the current page, handle stale requests, and reset/revalidate page selection when filters change. Do not use client row models to sort only a partial server page as though it were the complete dataset. Pass loading/error to DataTable; an empty row set displays its empty state. API contracts remain undecided.

## Boundaries

The landing page and `/map` remain dummy-only. This setup supplies foundations, not new flood charts or data screens. Leaflet now renders the OpenStreetMap raster basemap; thematic layers and domain data remain unconnected. All current interface icons use Tabler components; downloaded icon exports and unused starter assets have been removed. Do not store icon assets or recreate icon registries in the project; use named Tabler imports at component callsites.
