import { emptyRainfallFilters, filterRainfallRows } from "./filter";
import { rainfallSnapshot } from "./summary";
import { rainfallQuery } from "./query";
import type { RainfallPageData, RainfallRequest, RainfallView } from "./types";

export function buildRainfallView(data: RainfallPageData, request?: RainfallRequest): RainfallView {
  const scope = request ?? { summaryYear: data.years[0] ?? 0, tableYear: data.years[0] ?? 0, summaryRegionIds: [], filters: emptyRainfallFilters };
  const summaryFilters = { ...emptyRainfallFilters, regionIds: scope.summaryRegionIds };
  const current = filterRainfallRows(data.rows, scope.summaryYear, summaryFilters);
  const previous = scope.summaryYear > 1 ? filterRainfallRows(data.rows, scope.summaryYear - 1, summaryFilters) : [];
  const options = filterRainfallRows(data.rows, scope.tableYear, { ...scope.filters, query: "", classifications: [] });
  return {
    key: rainfallQuery(scope), years: data.years, regions: data.regions, legend: data.legend, error: data.error,
    rows: filterRainfallRows(data.rows, scope.tableYear, scope.filters).map((row) => ({
      id: row.id, period: row.period, month: row.month, year: row.year, region: row.region,
      classification: row.classification, rainfallMm: row.rainfallMm, averageMm: row.averageMm,
      minimumMm: row.minimumMm, maximumMm: row.maximumMm, parameters: [],
    })),
    snapshot: rainfallSnapshot(current, previous),
    classificationOptions: [...new Set([...scope.filters.classifications, ...options.flatMap((row) => row.classification === null ? [] : [row.classification])])],
    monthlyAvailable: data.rows.some((row) => !!row.monthly?.length),
  };
}
