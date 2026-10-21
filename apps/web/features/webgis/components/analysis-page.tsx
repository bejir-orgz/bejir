"use client";

import { useMemo, useState } from "react";
import { IconCaretDown } from "@tabler/icons-react";
import { WebgisHeader } from "@/components/layout/webgis-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { emptyAnalysisFilters, filterAnalysisRows } from "../analysis-filter";
import type { AnalysisData, AnalysisFilters } from "../analysis-types";
import { AnnualEventsChart, FrequencyChart, SusceptibilityChart } from "./analysis-charts";
import { AnalysisFiltersBar, AnalysisRegionFilter } from "./analysis-filters";
import { AnalysisTable } from "./analysis-table";
import { FacilityRows } from "./facility-rows";
import "../analysis.css";

/** Composes the analysis screen from route-provided fixtures, without running GIS calculations. */
export function AnalysisPage({ data }: { data: AnalysisData }) {
  const [year, setYear] = useState(data.years[0]);
  const [filters, setFilters] = useState<AnalysisFilters>(emptyAnalysisFilters);
  const rows = useMemo(() => filterAnalysisRows(data.rows, year, filters), [data.rows, year, filters]);
  const snapshot = data.snapshots[year];
  const active = !!(filters.query || filters.region || filters.susceptibility.length);
  return <div className="analysis-page"><WebgisHeader mapCanvas />
    <main className="analysis-content">
      <div className="analysis-heading"><div className="analysis-heading-scope"><h1>Analisis</h1><span className="analysis-heading-divider" aria-hidden="true" /><span className="analysis-province">Jawa Barat</span><AnalysisRegionFilter iconOnly regions={data.regions} value={filters.region} onChange={(region) => setFilters({ ...filters, region })} /></div>
        <DropdownMenu><DropdownMenuTrigger asChild><Button className="analysis-year" aria-label={`Pilih tahun, ${year}`}>{year}<IconCaretDown className="size-6" /></Button></DropdownMenuTrigger><DropdownMenuContent align="end"><DropdownMenuRadioGroup value={String(year)} onValueChange={(value) => { setYear(Number(value)); setFilters(emptyAnalysisFilters); }}>{data.years.map((item) => <DropdownMenuRadioItem key={item} value={String(item)}>{item}</DropdownMenuRadioItem>)}</DropdownMenuRadioGroup></DropdownMenuContent></DropdownMenu>
      </div>
      <div className="analysis-divider" aria-hidden="true" />
      <section className="analysis-summary" aria-label={`Ringkasan contoh analisis Jawa Barat ${year}`}>
        <div className="analysis-metrics">{snapshot.metrics.map((metric) => <Card className="analysis-metric" key={metric.id}><h2>{metric.label}</h2><strong>{metric.value}</strong><span data-trend={metric.trend}>{metric.change}</span></Card>)}</div>
        <div className="analysis-panels">
          <FrequencyChart frequency={snapshot.frequency} />
          <SusceptibilityChart distribution={snapshot.distribution} />
          <AnnualEventsChart annualEvents={snapshot.annualEvents} />
          <Card className="analysis-facilities"><h2>Fasilitas Terdampak</h2><div className="analysis-facility-list"><FacilityRows facilities={snapshot.facilities} /></div></Card>
        </div>
      </section>
      <div className="analysis-divider" aria-hidden="true" />
      <Card className="analysis-table-card"><div className="analysis-table-title"><h2>Tabel Kerawanan/Wilayah</h2>{active && <Button variant="ghost" size="sm" onClick={() => setFilters(emptyAnalysisFilters)}>Reset filter</Button>}</div>
        <AnalysisFiltersBar filters={filters} regions={data.regions} classes={data.classes} onChange={setFilters} />
        <AnalysisTable rows={rows} />
      </Card>
      <p className="analysis-data-note">Data dummy. Filter berlaku pada tabel; ringkasan dan grafik adalah contoh desain terpisah, bukan hasil perhitungan GIS.</p>
    </main>
  </div>;
}
