"use client";

import { useMemo, useState } from "react";
import { WebgisHeader } from "@/components/layout/webgis-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { YearFilterButton } from "@/components/ui/year-filter-button";
import { emptyHistoryFilters, filterHistoryRows } from "../history";
import type { FloodHistoryData, HistoryFilters } from "../types";
import { CasualtyChart, TimelineChart } from "./history-charts";
import { HistoryFiltersBar, RegionFilter } from "./history-filters";
import { HistoryTable } from "./history-table";

/** Receives presentation data from the route; no network or backend assumptions. */
export function HistoryPage({ data }: { data: FloodHistoryData }) {
  const [summaryYear, setSummaryYear] = useState(data.years[0]);
  const [summaryRegionIds, setSummaryRegionIds] = useState<string[]>([]);
  const [tableYear, setTableYear] = useState(data.years[0]);
  const [filters, setFilters] = useState<HistoryFilters>(emptyHistoryFilters);
  const rows = useMemo(() => filterHistoryRows(data.rows, tableYear, filters), [data.rows, tableYear, filters]);
  const snapshot = data.snapshots[summaryYear];
  const active = tableYear !== data.years[0] || !!(filters.query || filters.regionIds.length || filters.severities.length || filters.from || filters.to);
  return <div className="history-page min-h-[100dvh] bg-[#fff] text-[#171717] [&_[data-slot=card]]:border-0 [&_[data-slot=card]]:[outline:1px_solid_#d4d4d4] [&_[data-slot=card]]:[outline-offset:-1px]"><WebgisHeader mapCanvas />
    <main className="history-content w-[min(1200px,calc(100%_-_32px))] mx-auto py-4">
      <div className="history-heading min-h-10 flex items-center justify-between gap-4 [&_h1]:text-[36px] [&_h1]:leading-[40px] [&_h1]:font-medium max-[700.01px]:items-start max-[700.01px]:flex-wrap max-[700.01px]:[&_h1]:text-[28px] max-[700.01px]:[&_h1]:leading-[36px]"><div className="history-heading-scope flex items-center gap-4 max-[700.01px]:gap-2 max-[700.01px]:flex-wrap"><h1>Histori Banjir</h1><span className="history-heading-divider mx-2 h-10 w-0.5 shrink-0 bg-neutral-300 max-[700.01px]:h-7" aria-hidden="true" /><RegionFilter iconOnly regions={data.regions} districtRows={data.rows} value={summaryRegionIds} onChange={setSummaryRegionIds} /></div>
        <YearFilterButton years={data.years} value={summaryYear} onValueChange={setSummaryYear} />
      </div>
      <div className="history-divider h-4 my-4 flex items-center [&::after]:content-[''] [&::after]:h-0.5 [&::after]:bg-neutral-300 [&::after]:w-full" aria-hidden="true" />
      <section className="history-summary grid grid-cols-[389fr_795fr] gap-4 [&_h2]:text-[16px] [&_h2]:leading-[24px] [&_h2]:font-medium max-[900.01px]:grid-cols-[300px_minmax(0,1fr)] max-[700.01px]:grid-cols-[minmax(0,1fr)]" aria-label={`Ringkasan contoh tahunan Jawa Barat ${summaryYear}`}>
        <CasualtyChart snapshot={snapshot} />
        <div className="history-summary-right grid gap-4 min-w-0"><div className="history-metrics grid grid-cols-[1fr_1fr] gap-4 max-[900.01px]:gap-2 max-[700.01px]:gap-2">
          <Card className="history-metric h-27 p-4 [&_h2]:text-[14px] [&_h2]:leading-[20px] [&_h2]:font-normal [&_strong]:block [&_strong]:text-[24px] [&_strong]:leading-[32px] [&_strong]:font-medium [&_>_span]:block [&_>_span]:text-[#2bb600] [&_>_span]:text-[12px] [&_>_span]:leading-[16px] [&_>_span]:mt-1 max-[900.01px]:p-3"><h2>Total Kejadian Banjir</h2><strong>{snapshot.events}</strong><span>{snapshot.eventChange}</span></Card>
          <Card className="history-metric h-27 p-4 [&_h2]:text-[14px] [&_h2]:leading-[20px] [&_h2]:font-normal [&_strong]:block [&_strong]:text-[24px] [&_strong]:leading-[32px] [&_strong]:font-medium [&_>_span]:block [&_>_span]:text-[#2bb600] [&_>_span]:text-[12px] [&_>_span]:leading-[16px] [&_>_span]:mt-1 max-[900.01px]:p-3"><h2>Total Area Terdampak</h2><strong>{snapshot.area}</strong><span>{snapshot.areaChange}</span></Card>
        </div><TimelineChart snapshot={snapshot} /></div>
      </section>
      <div className="history-divider h-4 my-4 flex items-center [&::after]:content-[''] [&::after]:h-0.5 [&::after]:bg-neutral-300 [&::after]:w-full" aria-hidden="true" />
      <Card className="history-table-card p-4 flex flex-col gap-4 min-w-0"><div className="history-table-title flex items-center justify-between min-h-8 [&_h2]:text-[20px] [&_h2]:leading-[28px] [&_h2]:font-medium"><h2>Tabel Histori Banjir</h2>{active && <Button variant="destructive" size="sm" onClick={() => { setFilters(emptyHistoryFilters); setTableYear(data.years[0]); }}>Reset filter</Button>}</div>
        <HistoryFiltersBar districtRows={data.rows} year={tableYear} years={data.years} onYearChange={(value) => { setTableYear(value); setFilters((current) => ({ ...current, from: "", to: "" })); }} filters={filters} regions={data.regions} onChange={setFilters} />
        <HistoryTable rows={rows} />
      </Card>
      <p className="history-data-note mt-4 text-[12px] leading-[16px] text-[#737373]">Data dummy. Filter header dan tabel terpisah; ringkasan dan timeline merupakan contoh tahunan terpisah.</p>
    </main>
  </div>;
}
