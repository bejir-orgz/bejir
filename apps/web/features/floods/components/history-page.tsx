"use client";

import { useMemo, useState } from "react";
import { IconCaretDown } from "@tabler/icons-react";
import { WebgisHeader } from "@/components/layout/webgis-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { emptyHistoryFilters, filterHistoryRows } from "../history";
import type { FloodHistoryData, HistoryFilters } from "../types";
import { CasualtyChart, TimelineChart } from "./history-charts";
import { HistoryFiltersBar, RegionFilter } from "./history-filters";
import { HistoryTable } from "./history-table";
import "../history.css";

/** Receives presentation data from the route; no network or backend assumptions. */
export function HistoryPage({ data }: { data: FloodHistoryData }) {
  const [year, setYear] = useState(data.years[0]);
  const [filters, setFilters] = useState<HistoryFilters>(emptyHistoryFilters);
  const rows = useMemo(() => filterHistoryRows(data.rows, year, filters), [data.rows, year, filters]);
  const snapshot = data.snapshots[year];
  const active = !!(filters.query || filters.region || filters.severities.length || filters.from || filters.to);
  return <div className="history-page"><WebgisHeader mapCanvas />
    <main className="history-content">
      <div className="history-heading"><div className="history-heading-scope"><h1>Histori Banjir</h1><span className="history-heading-divider" aria-hidden="true" /><span className="history-province">Jawa Barat</span><RegionFilter iconOnly regions={data.regions} value={filters.region} onChange={(region) => setFilters({ ...filters, region })} /></div>
        <DropdownMenu><DropdownMenuTrigger asChild><Button className="history-year" aria-label={`Pilih tahun, ${year}`}>{year}<IconCaretDown className="size-6" /></Button></DropdownMenuTrigger><DropdownMenuContent align="end"><DropdownMenuRadioGroup value={String(year)} onValueChange={(value) => { setYear(Number(value)); setFilters(emptyHistoryFilters); }}>{data.years.map((item) => <DropdownMenuRadioItem key={item} value={String(item)}>{item}</DropdownMenuRadioItem>)}</DropdownMenuRadioGroup></DropdownMenuContent></DropdownMenu>
      </div>
      <div className="history-divider" aria-hidden="true" />
      <section className="history-summary" aria-label={`Ringkasan contoh tahunan Jawa Barat ${year}`}>
        <CasualtyChart snapshot={snapshot} />
        <div className="history-summary-right"><div className="history-metrics">
          <Card className="history-metric"><h2>Total Kejadian Banjir</h2><strong>{snapshot.events}</strong><span>{snapshot.eventChange}</span></Card>
          <Card className="history-metric"><h2>Total Area Terdampak</h2><strong>{snapshot.area}</strong><span>{snapshot.areaChange}</span></Card>
        </div><TimelineChart snapshot={snapshot} /></div>
      </section>
      <div className="history-divider" aria-hidden="true" />
      <Card className="history-table-card"><div className="history-table-title"><h2>Tabel Histori Banjir</h2>{active && <Button variant="ghost" size="sm" onClick={() => setFilters(emptyHistoryFilters)}>Reset filter</Button>}</div>
        <HistoryFiltersBar year={year} filters={filters} regions={data.regions} onChange={setFilters} />
        <HistoryTable rows={rows} />
      </Card>
      <p className="history-data-note">Data dummy. Filter berlaku pada tabel; ringkasan dan timeline merupakan contoh tahunan terpisah.</p>
    </main>
  </div>;
}
