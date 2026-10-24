"use client";

import { useMemo, useState } from "react";
import { WebgisHeader } from "@/components/layout/webgis-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { YearFilterButton } from "@/components/ui/year-filter-button";
import { emptyRainfallFilters, filterRainfallRows } from "../filter";
import type { RainfallFilters, RainfallPageData } from "../types";
import { RainfallChart } from "./rainfall-chart";
import { RainfallFiltersBar, RainfallRegionFilter } from "./rainfall-filters";
import { RainfallTable } from "./rainfall-table";

/** Route-provided presentation data keeps this screen independent of future API transport. */
export function RainfallPage({ data }: { data: RainfallPageData }) {
  const [summaryYear, setSummaryYear] = useState(data.years[0]);
  const [summaryRegionIds, setSummaryRegionIds] = useState<string[]>([]);
  const [tableYear, setTableYear] = useState(data.years[0]);
  const [filters, setFilters] = useState<RainfallFilters>(emptyRainfallFilters);
  const rows = useMemo(() => filterRainfallRows(data.rows, tableYear, filters), [data.rows, tableYear, filters]);
  const snapshot = data.snapshots[summaryYear];
  function changeTableYear(value: number) {
    setTableYear(value);
    setFilters(emptyRainfallFilters);
  }
  const active = tableYear !== data.years[0] || !!(filters.query || filters.regionIds.length || filters.month || filters.classifications.length);

  return <div className="rainfall-page min-h-[100dvh] bg-[#fff] text-[#171717] [&_[data-slot=card]]:border-0 [&_[data-slot=card]]:[outline:1px_solid_#d4d4d4] [&_[data-slot=card]]:[outline-offset:-1px]"><WebgisHeader mapCanvas />
    <main className="rainfall-content w-[min(1200px,calc(100%_-_32px))] mx-auto py-4">
      <div className="rainfall-heading min-h-10 flex items-center justify-between gap-4 [&_h1]:text-[36px] [&_h1]:leading-[40px] [&_h1]:font-medium max-[700.01px]:items-start max-[700.01px]:flex-wrap max-[700.01px]:[&_h1]:text-[28px] max-[700.01px]:[&_h1]:leading-[36px]"><div className="rainfall-heading-scope flex items-center gap-2"><h1>Curah Hujan</h1><span className="rainfall-heading-divider h-10 w-4 relative [&::after]:content-[''] [&::after]:absolute [&::after]:[inset-block:0] [&::after]:left-2 [&::after]:w-[1px] [&::after]:bg-[#d4d4d4] max-[700.01px]:h-7 max-[700.01px]:w-2 max-[700.01px]:[&::after]:left-1" aria-hidden="true" /><span className="rainfall-province text-[#2b7fff] text-[20px] leading-[28px] whitespace-nowrap max-[700.01px]:text-[16px]">Jawa Barat</span><RainfallRegionFilter iconOnly regions={data.regions} value={summaryRegionIds} onChange={setSummaryRegionIds} /></div>
        <YearFilterButton years={data.years} value={summaryYear} onValueChange={setSummaryYear} />
      </div>
      <div className="rainfall-divider h-4 my-4 flex items-center [&::after]:content-[''] [&::after]:h-[1px] [&::after]:bg-[#d4d4d4] [&::after]:w-full" aria-hidden="true" />
      <section className="rainfall-summary grid gap-4" aria-label={`Ringkasan contoh curah hujan Jawa Barat ${summaryYear}`}>
        <div className="rainfall-metrics grid grid-cols-[repeat(3,minmax(0,1fr))] gap-4 max-[700.01px]:grid-cols-[minmax(0,1fr)] max-[700.01px]:gap-2">{snapshot.metrics.map((metric) => <Card className="rainfall-metric h-[110px] p-4 [&_h2]:text-[14px] [&_h2]:leading-[20px] [&_h2]:font-normal [&_strong]:block [&_strong]:text-[24px] [&_strong]:leading-[32px] [&_strong]:font-medium [&_strong]:whitespace-nowrap [&_>_span]:block [&_>_span]:text-[#2bb600] [&_>_span]:text-[12px] [&_>_span]:leading-[16px] [&_>_span]:mt-2 [&_>_span[data-trend=decrease]]:text-[#ff0000] max-[900.01px]:p-3 max-[900.01px]:[&_strong]:text-[20px] max-[700.01px]:p-4 max-[700.01px]:[&_strong]:text-[24px]" key={metric.label}><h2>{metric.label}</h2><strong>{metric.value}</strong><span data-trend={metric.trend}>{metric.change}</span></Card>)}</div>
        <div className="rainfall-charts grid grid-cols-[795fr_389fr] gap-4 [&_h2]:text-[16px] [&_h2]:leading-[24px] [&_h2]:font-medium [&_h2]:mb-4 max-[1100.01px]:grid-cols-[minmax(0,1fr)_360px] max-[900.01px]:grid-cols-[minmax(0,1fr)]"><RainfallChart distribution={snapshot.distribution} />
          <Card className="rainfall-legend p-4 h-[310px] min-w-0 flex flex-col [&_ul]:flex [&_ul]:flex-1 [&_ul]:flex-col [&_ul]:justify-between [&_li]:flex [&_li]:items-center [&_li]:gap-4 [&_li]:min-h-6 [&_strong]:text-[14px] [&_strong]:leading-[20px] [&_strong]:font-semibold [&_strong]:whitespace-nowrap [&_li_>_span:last-child]:ml-auto [&_li_>_span:last-child]:text-[12px] [&_li_>_span:last-child]:leading-[16px] [&_li_>_span:last-child]:whitespace-nowrap max-[900.01px]:h-[310px] max-[700.01px]:p-3 max-[700.01px]:[&_li]:gap-2 max-[700.01px]:[&_strong]:text-[13px] max-[700.01px]:[&_li_>_span:last-child]:text-[11px]"><h2>Reklasifikasi Curah Hujan</h2><ul aria-label="Contoh legenda tahunan dari desain">{data.legend.map((entry) => <li key={entry.label}><span className="rainfall-swatch w-6 h-6 rounded-lg shrink-0" style={{ backgroundColor: entry.color }} aria-hidden="true" /><strong>{entry.label}</strong><span>{entry.range}</span></li>)}</ul></Card>
        </div>
      </section>
      <div className="rainfall-divider h-4 my-4 flex items-center [&::after]:content-[''] [&::after]:h-[1px] [&::after]:bg-[#d4d4d4] [&::after]:w-full" aria-hidden="true" />
      <Card className="rainfall-table-card p-4 flex flex-col gap-4 min-w-0"><div className="rainfall-table-title flex items-center justify-between min-h-8 [&_h2]:text-[20px] [&_h2]:leading-[28px] [&_h2]:font-medium"><h2>Tabel Curah Hujan</h2>{active && <Button variant="destructive" size="sm" onClick={() => { setFilters(emptyRainfallFilters); setTableYear(data.years[0]); }}>Reset filter</Button>}</div>
        <RainfallFiltersBar filters={filters} regions={data.regions} legend={data.legend} year={tableYear} years={data.years} onYearChange={changeTableYear} onChange={setFilters} />
        <RainfallTable rows={rows} />
      </Card>
      <p className="rainfall-data-note mt-4 text-[12px] leading-[16px] text-[#737373]">Data dummy. Filter header dan tabel terpisah; ringkasan, grafik, dan legenda tahunan adalah contoh desain terpisah.</p>
    </main>
  </div>;
}
