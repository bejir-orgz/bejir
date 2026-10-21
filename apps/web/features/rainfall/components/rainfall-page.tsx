"use client";

import { useMemo, useState } from "react";
import { IconCaretDown } from "@tabler/icons-react";
import { WebgisHeader } from "@/components/layout/webgis-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { emptyRainfallFilters, filterRainfallRows } from "../filter";
import type { RainfallFilters, RainfallPageData } from "../types";
import { RainfallChart } from "./rainfall-chart";
import { RainfallFiltersBar, RainfallRegionFilter } from "./rainfall-filters";
import { RainfallTable } from "./rainfall-table";
import "../rainfall.css";

/** Route-provided presentation data keeps this screen independent of future API transport. */
export function RainfallPage({ data }: { data: RainfallPageData }) {
  const [year, setYear] = useState(data.years[0]);
  const [filters, setFilters] = useState<RainfallFilters>(emptyRainfallFilters);
  const rows = useMemo(() => filterRainfallRows(data.rows, year, filters), [data.rows, year, filters]);
  const snapshot = data.snapshots[year];
  const active = !!(filters.query || filters.region || filters.month || filters.classifications.length);

  return <div className="rainfall-page"><WebgisHeader mapCanvas />
    <main className="rainfall-content">
      <div className="rainfall-heading"><div className="rainfall-heading-scope"><h1>Curah Hujan</h1><span className="rainfall-heading-divider" aria-hidden="true" /><span className="rainfall-province">Jawa Barat</span><RainfallRegionFilter iconOnly regions={data.regions} value={filters.region} onChange={(region) => setFilters({ ...filters, region })} /></div>
        <DropdownMenu><DropdownMenuTrigger asChild><Button className="rainfall-year" aria-label={`Pilih tahun, ${year}`}>{year}<IconCaretDown className="size-6" /></Button></DropdownMenuTrigger><DropdownMenuContent align="end"><DropdownMenuRadioGroup value={String(year)} onValueChange={(value) => { setYear(Number(value)); setFilters(emptyRainfallFilters); }}>{data.years.map((item) => <DropdownMenuRadioItem key={item} value={String(item)}>{item}</DropdownMenuRadioItem>)}</DropdownMenuRadioGroup></DropdownMenuContent></DropdownMenu>
      </div>
      <div className="rainfall-divider" aria-hidden="true" />
      <section className="rainfall-summary" aria-label={`Ringkasan contoh curah hujan Jawa Barat ${year}`}>
        <div className="rainfall-metrics">{snapshot.metrics.map((metric) => <Card className="rainfall-metric" key={metric.label}><h2>{metric.label}</h2><strong>{metric.value}</strong><span data-trend={metric.trend}>{metric.change}</span></Card>)}</div>
        <div className="rainfall-charts"><RainfallChart distribution={snapshot.distribution} />
          <Card className="rainfall-legend"><h2>Reklasifikasi Curah Hujan</h2><ul aria-label="Contoh legenda tahunan dari desain">{data.legend.map((entry) => <li key={entry.label}><span className="rainfall-swatch" style={{ backgroundColor: entry.color }} aria-hidden="true" /><strong>{entry.label}</strong><span>{entry.range}</span></li>)}</ul></Card>
        </div>
      </section>
      <div className="rainfall-divider" aria-hidden="true" />
      <Card className="rainfall-table-card"><div className="rainfall-table-title"><h2>Tabel Curah Hujan</h2>{active && <Button variant="ghost" size="sm" onClick={() => setFilters(emptyRainfallFilters)}>Reset filter</Button>}</div>
        <RainfallFiltersBar filters={filters} regions={data.regions} legend={data.legend} year={year} onChange={setFilters} />
        <RainfallTable rows={rows} />
      </Card>
      <p className="rainfall-data-note">Data dummy. Filter berlaku pada tabel; ringkasan, grafik, dan legenda tahunan adalah contoh desain terpisah.</p>
    </main>
  </div>;
}
