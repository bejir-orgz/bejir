"use client";

import { useMemo, useState } from "react";
import { WebgisHeader } from "@/components/layout/webgis-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { YearFilterButton } from "@/components/ui/year-filter-button";
import { emptyAnalysisFilters, filterAnalysisRows } from "../analysis-filter";
import type { AnalysisData, AnalysisFilters } from "../analysis-types";
import { AnnualEventsChart, FrequencyChart, SusceptibilityChart } from "./analysis-charts";
import { AnalysisFiltersBar, AnalysisRegionFilter } from "./analysis-filters";
import { AnalysisTable } from "./analysis-table";
import { FacilityRows } from "./facility-rows";

/** Composes the analysis screen from route-provided fixtures, without running GIS calculations. */
export function AnalysisPage({ data }: { data: AnalysisData }) {
  const [summaryYear, setSummaryYear] = useState(data.years[0]);
  const [summaryRegionIds, setSummaryRegionIds] = useState<string[]>([]);
  const tableYear = data.years[0];
  const [filters, setFilters] = useState<AnalysisFilters>(emptyAnalysisFilters);
  const rows = useMemo(() => filterAnalysisRows(data.rows, tableYear, filters), [data.rows, tableYear, filters]);
  const snapshot = data.snapshots[summaryYear];
  const active = !!(filters.query || filters.regionIds.length || filters.susceptibility.length);
  return <div className="analysis-page min-h-[100dvh] bg-[#fff] text-[#171717] [&_[data-slot=card]]:border-0 [&_[data-slot=card]]:[outline:1px_solid_#d4d4d4] [&_[data-slot=card]]:[outline-offset:-1px] [&_[data-slot=chart]_.recharts-cartesian-axis-tick-value]:[fill:#a1a1a1] [&_[data-slot=chart]_.recharts-cartesian-axis-tick-value]:text-[12px]"><WebgisHeader mapCanvas />
    <main className="analysis-content w-[min(1200px,calc(100%_-_32px))] mx-auto py-4">
      <div className="analysis-heading min-h-10 flex items-center justify-between gap-4 [&_h1]:text-[36px] [&_h1]:leading-[40px] [&_h1]:font-medium max-[700.01px]:items-start max-[700.01px]:flex-wrap max-[700.01px]:[&_h1]:text-[28px] max-[700.01px]:[&_h1]:leading-[36px]"><div className="analysis-heading-scope flex items-center gap-2"><h1>Analisis</h1><span className="analysis-heading-divider h-10 w-4 relative [&::after]:content-[''] [&::after]:absolute [&::after]:[inset-block:0] [&::after]:left-2 [&::after]:w-[1px] [&::after]:bg-[#d4d4d4] max-[700.01px]:h-7 max-[700.01px]:w-2 max-[700.01px]:[&::after]:left-1" aria-hidden="true" /><span className="analysis-province text-[#2b7fff] text-[20px] leading-[28px] whitespace-nowrap max-[700.01px]:text-[16px]">Jawa Barat</span><AnalysisRegionFilter iconOnly regions={data.regions} value={summaryRegionIds} onChange={setSummaryRegionIds} /></div>
        <YearFilterButton years={data.years} value={summaryYear} onValueChange={setSummaryYear} />
      </div>
      <div className="analysis-divider h-4 my-4 flex items-center [&::after]:content-[''] [&::after]:h-[1px] [&::after]:bg-[#d4d4d4] [&::after]:w-full" aria-hidden="true" />
      <section className="analysis-summary grid gap-4" aria-label={`Ringkasan contoh analisis Jawa Barat ${summaryYear}`}>
        <div className="analysis-metrics grid grid-cols-[repeat(4,minmax(0,1fr))] gap-4 max-[1000.01px]:grid-cols-[repeat(2,minmax(0,1fr))] max-[700.01px]:gap-2">{snapshot.metrics.map((metric) => <Card className="analysis-metric h-[110px] p-4 [&_h2]:text-[14px] [&_h2]:leading-[20px] [&_h2]:font-normal [&_strong]:block [&_strong]:text-[24px] [&_strong]:leading-[32px] [&_strong]:font-medium [&_>_span]:block [&_>_span]:text-[#2bb600] [&_>_span]:text-[12px] [&_>_span]:leading-[16px] [&_>_span]:mt-2 [&_>_span[data-trend=decrease]]:text-[#ff0000] max-[700.01px]:p-3 max-[700.01px]:[&_h2]:text-[12px] max-[700.01px]:[&_strong]:text-[20px]" key={metric.id}><h2>{metric.label}</h2><strong>{metric.value}</strong><span data-trend={metric.trend}>{metric.change}</span></Card>)}</div>
        <div className="analysis-panels grid grid-cols-[repeat(2,minmax(0,1fr))] gap-4 [&_>_[data-slot=card]]:p-4 [&_>_[data-slot=card]]:min-w-0 [&_h2]:text-[16px] [&_h2]:leading-[24px] [&_h2]:font-medium [&_h2]:mb-4 max-[1000.01px]:grid-cols-[minmax(0,1fr)] max-[700.01px]:[&_>_[data-slot=card]]:px-3">
          <FrequencyChart frequency={snapshot.frequency} />
          <SusceptibilityChart distribution={snapshot.distribution} />
          <AnnualEventsChart annualEvents={snapshot.annualEvents} />
          <Card className="analysis-facilities h-[314px] flex flex-col [--facility-education-background:#bedbff] [&_.gis-facility-row]:flex [&_.gis-facility-row]:items-center [&_.gis-facility-row]:justify-between [&_.gis-facility-row]:gap-4 [&_.gis-facility-row]:text-[14px] [&_.gis-facility-row]:leading-[20px] [&_.gis-facility-label]:flex [&_.gis-facility-label]:items-center [&_.gis-facility-label]:gap-4 [&_.gis-facility-icon]:grid [&_.gis-facility-icon]:[place-items:center] [&_.gis-facility-icon]:w-10 [&_.gis-facility-icon]:h-10 [&_.gis-facility-icon]:shrink-0 [&_.gis-facility-icon]:rounded-lg [&_.gis-facility-row_strong]:font-semibold [&_.gis-facility-icon]:p-0 [&_.gis-facility-icon]:justify-normal"><h2>Fasilitas Terdampak</h2><div className="analysis-facility-list flex-1 flex flex-col justify-between"><FacilityRows facilities={snapshot.facilities} /></div></Card>
        </div>
      </section>
      <div className="analysis-divider h-4 my-4 flex items-center [&::after]:content-[''] [&::after]:h-[1px] [&::after]:bg-[#d4d4d4] [&::after]:w-full" aria-hidden="true" />
      <Card className="analysis-table-card p-4 flex flex-col gap-4 min-w-0"><div className="analysis-table-title flex items-center justify-between min-h-8 [&_h2]:text-[20px] [&_h2]:leading-[28px] [&_h2]:font-medium"><h2>Tabel Kerawanan/Wilayah</h2>{active && <Button variant="destructive" size="sm" onClick={() => setFilters(emptyAnalysisFilters)}>Reset filter</Button>}</div>
        <AnalysisFiltersBar filters={filters} regions={data.regions} classes={data.classes} onChange={setFilters} />
        <AnalysisTable rows={rows} />
      </Card>
      <p className="analysis-data-note mt-4 text-[12px] leading-[16px] text-[#737373]">Data dummy. Filter header dan tabel terpisah; ringkasan dan grafik adalah contoh desain terpisah, bukan hasil perhitungan GIS.</p>
    </main>
  </div>;
}
