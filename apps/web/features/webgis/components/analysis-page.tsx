"use client";

import { useEffect, useMemo, useState } from "react";
import { useRegionSelection, useRegionalFilters } from "@/features/regions/region-selection";
import { WebgisHeader } from "@/components/layout/webgis-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { YearFilterButton } from "@/components/ui/year-filter-button";
import { emptyAnalysisFilters, filterAnalysisRows } from "../analysis-filter";
import type { AnalysisData, AnalysisFilters } from "../analysis-types";
import { susceptibilityDistribution } from "@/features/geography/aggregation";
import { AnnualEventsChart, FrequencyChart, SusceptibilityChart } from "./analysis-charts";
import { AnalysisFiltersBar, AnalysisRegionFilter } from "./analysis-filters";
import { AnalysisTable } from "./analysis-table";
import { FacilityRows } from "./facility-rows";
import { useRiverSummary } from "@/features/rivers/use-river-summary";
import { useFacilityTotals } from "../../floods/use-facility-totals";
import { hasDistrictSelection, hasVillageSelection, matchesRegionFilter } from "../region-tree";

export function AnalysisPage({ data }: { data: AnalysisData }) {
  const [summaryYear, setSummaryYear] = useState(data.years[0] ?? 0);
  const { regionIds: summaryRegionIds, setRegionIds: setSummaryRegionIds, dataRegionIds } = useRegionSelection();
  const tableYear = data.years[0] ?? 0;
  const [filters, setFilters] = useRegionalFilters<AnalysisFilters>(emptyAnalysisFilters);
  const riverSummary = useRiverSummary(dataRegionIds, data.source === "backend");
  const rows = useMemo(() => filterAnalysisRows(data.rows, tableYear, filters).map((row) => ({ ...row, rivers: riverSummary?.data && riverSummary.data.total !== null ? riverSummary.data.by_regency[row.id] ?? 0 : null })), [data.rows, tableYear, filters, riverSummary]);
  const query = new URLSearchParams({ year: String(summaryYear) });
  const detailed = hasDistrictSelection(summaryRegionIds);
  const summaryRows = filterAnalysisRows(data.rows, tableYear, { ...emptyAnalysisFilters, regionIds: summaryRegionIds });
  const selectedRegions = data.rows.filter((row) => matchesRegionFilter(summaryRegionIds, row.region));
  if (selectedRegions.length !== data.rows.length) {
    for (const row of selectedRegions) query.append("regency_id", row.id);
  }
  const summaryKey = query.toString();
  const [liveSummary, setLiveSummary] = useState<{ key: string; snapshot?: AnalysisData["snapshots"][number]; error?: string }>();
  const initialSummary = summaryYear === data.years[0] && !summaryRegionIds.length;
  const baseSnapshot = liveSummary?.key === summaryKey && liveSummary.snapshot ? liveSummary.snapshot
      : initialSummary ? data.snapshots[summaryYear] ?? data.snapshots[0] : data.snapshots[0];
  const facilities = useFacilityTotals(selectedRegions.length === data.rows.length ? [] : selectedRegions.map((row) => Number(row.id)), `${summaryYear}-01-01`, `${summaryYear}-12-31`, data.source === "backend" && summaryYear > 0 && !detailed && selectedRegions.length > 0);
  const populatedSnapshot = facilities?.counts ? { ...baseSnapshot, facilities: baseSnapshot.facilities.map((facility) => ({ ...facility, count: facilities.counts![facility.id] })) } : baseSnapshot;
  const summaryDistricts = summaryRows.flatMap((row) => row.districts ?? []);
  const knownClasses = summaryDistricts.some((row) => row.kelas_dominan_v2 !== null);
  const snapshot = detailed || !selectedRegions.length ? {
    ...data.snapshots[0],
    metrics: data.snapshots[0].metrics.map((metric) => ({ ...metric, value: "—", change: "—" })),
    frequency: [], annualEvents: [],
    distribution: hasVillageSelection(summaryRegionIds) || !knownClasses ? data.snapshots[0].distribution.map((entry) => ({ ...entry, value: null })) : susceptibilityDistribution(summaryDistricts).reverse(),
    facilities: data.snapshots[0].facilities.map((facility) => ({ ...facility, count: null })),
  } : populatedSnapshot;
  useEffect(() => {
    if (data.source !== "backend" || !data.years.length || initialSummary || detailed || !selectedRegions.length) return;
    const controller = new AbortController();
    fetch(`/api/analysis/summary?${summaryKey}`, { signal: controller.signal }).then(async (response) => {
      if (!response.ok) throw new Error("Ringkasan histori gagal dimuat.");
      const result: AnalysisData["snapshots"][number] = await response.json();
      if (!controller.signal.aborted) setLiveSummary({ key: summaryKey, snapshot: result });
    }).catch(() => {
      if (!controller.signal.aborted) setLiveSummary({ key: summaryKey, error: "Ringkasan histori gagal dimuat." });
    });
    return () => controller.abort();
  }, [summaryKey, data.source, data.years.length, initialSummary, detailed, selectedRegions.length]);
  const active = !!(filters.query || filters.regionIds.length || filters.susceptibility.length);
  return <div className="analysis-page min-h-[100dvh] bg-[#fff] text-[#171717] [&_[data-slot=card]]:border-0 [&_[data-slot=card]]:[outline:1px_solid_#d4d4d4] [&_[data-slot=card]]:[outline-offset:-1px] [&_[data-slot=chart]_.recharts-cartesian-axis-tick-value]:[fill:#a1a1a1] [&_[data-slot=chart]_.recharts-cartesian-axis-tick-value]:text-[12px]"><WebgisHeader mapCanvas />
    <main className="analysis-content w-[min(1200px,calc(100%_-_32px))] mx-auto py-4">
      <div className="analysis-heading min-h-10 flex items-center justify-between gap-4 [&_h1]:text-[36px] [&_h1]:leading-[40px] [&_h1]:font-medium max-[700.01px]:items-start max-[700.01px]:flex-wrap max-[700.01px]:[&_h1]:text-[28px] max-[700.01px]:[&_h1]:leading-[36px]"><div className="analysis-heading-scope flex items-center gap-2"><h1>Analisis</h1><span className="analysis-heading-divider mx-2 h-10 w-0.5 shrink-0 bg-neutral-300 max-[700.01px]:h-7" aria-hidden="true" /><AnalysisRegionFilter iconOnly regions={data.regions} value={summaryRegionIds} onChange={setSummaryRegionIds} /></div>
        <YearFilterButton years={data.years} value={summaryYear} onValueChange={setSummaryYear} label={!data.years.length ? "—" : undefined} />
      </div>
      <div className="analysis-divider h-4 my-4 flex items-center [&::after]:content-[''] [&::after]:h-0.5 [&::after]:bg-neutral-300 [&::after]:w-full" aria-hidden="true" />
      <section className="analysis-summary grid gap-4" aria-label={`Ringkasan analisis Jawa Barat ${summaryYear || "periode belum tersedia"}`}>
        <div className="analysis-metrics grid grid-cols-[repeat(4,minmax(0,1fr))] gap-4 max-[1000.01px]:grid-cols-[repeat(2,minmax(0,1fr))] max-[700.01px]:gap-2">{snapshot.metrics.map((metric) => <Card className="analysis-metric h-[110px] p-4 [&_h2]:text-[14px] [&_h2]:leading-[20px] [&_h2]:font-normal [&_strong]:block [&_strong]:text-[24px] [&_strong]:leading-[32px] [&_strong]:font-medium [&_>_span]:block [&_>_span]:text-[#2bb600] [&_>_span]:text-[12px] [&_>_span]:leading-[16px] [&_>_span]:mt-2 [&_>_span[data-trend=decrease]]:text-[#ff0000] max-[700.01px]:p-3 max-[700.01px]:[&_h2]:text-[12px] max-[700.01px]:[&_strong]:text-[20px]" key={metric.id}><h2>{metric.label}</h2><strong>{metric.value}</strong><span data-trend={metric.trend}>{metric.change}</span></Card>)}</div>
        <div className="analysis-panels grid grid-cols-[repeat(2,minmax(0,1fr))] gap-4 [&_>_[data-slot=card]]:p-4 [&_>_[data-slot=card]]:min-w-0 [&_h2]:text-[16px] [&_h2]:leading-[24px] [&_h2]:font-medium [&_h2]:mb-4 max-[1000.01px]:grid-cols-[minmax(0,1fr)] max-[700.01px]:[&_>_[data-slot=card]]:px-3">
          <FrequencyChart frequency={snapshot.frequency} />
          <SusceptibilityChart distribution={snapshot.distribution} />
          <AnnualEventsChart annualEvents={snapshot.annualEvents} />
          <Card className="analysis-facilities h-[314px] flex flex-col [--facility-education-background:#bedbff] [&_.gis-facility-row]:flex [&_.gis-facility-row]:items-center [&_.gis-facility-row]:justify-between [&_.gis-facility-row]:gap-4 [&_.gis-facility-row]:text-[14px] [&_.gis-facility-row]:leading-[20px] [&_.gis-facility-label]:flex [&_.gis-facility-label]:items-center [&_.gis-facility-label]:gap-4 [&_.gis-facility-icon]:grid [&_.gis-facility-icon]:[place-items:center] [&_.gis-facility-icon]:w-10 [&_.gis-facility-icon]:h-10 [&_.gis-facility-icon]:shrink-0 [&_.gis-facility-icon]:rounded-lg [&_.gis-facility-row_strong]:font-semibold [&_.gis-facility-icon]:p-0 [&_.gis-facility-icon]:justify-normal"><h2>Fasilitas Terdampak</h2><div className="analysis-facility-list flex-1 flex flex-col justify-between"><FacilityRows facilities={snapshot.facilities} /></div></Card>
        </div>
      </section>
      <div className="analysis-divider h-4 my-4 flex items-center [&::after]:content-[''] [&::after]:h-0.5 [&::after]:bg-neutral-300 [&::after]:w-full" aria-hidden="true" />
      <Card className="analysis-table-card p-4 flex flex-col gap-4 min-w-0"><div className="analysis-table-title flex items-center justify-between min-h-8 [&_h2]:text-[20px] [&_h2]:leading-[28px] [&_h2]:font-medium"><h2>Tabel Kerawanan/Wilayah</h2>{active && <Button variant="link" size="sm" className="text-red-500 no-underline hover:text-red-600 hover:no-underline" onClick={() => setFilters(emptyAnalysisFilters)}>Reset filter</Button>}</div>
        <AnalysisFiltersBar filters={filters} regions={data.regions} classes={data.classes} onChange={setFilters} />
        <AnalysisTable rows={rows} />
      </Card>
    </main>
  </div>;
}
