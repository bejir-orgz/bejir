import { hasDistrictSelection, hasVillageSelection, matchesRegionFilter } from "../webgis/region-tree";
import { aggregateRainfall } from "./summary";
import type { RainfallFilters, RainfallRow } from "./types";

export const emptyRainfallFilters: RainfallFilters = { query: "", regionIds: [], month: "", classifications: [] };

export function filterRainfallRows(rows: readonly RainfallRow[], year: number, filters: RainfallFilters) {
  const query = filters.query.trim().toLocaleLowerCase("id-ID");
  if (hasVillageSelection(filters.regionIds)) return [];
  const scoped = rows.flatMap((row) => {
    if (!hasDistrictSelection(filters.regionIds) && !matchesRegionFilter(filters.regionIds, row.region)) return [];
    const districtMatches = (parameter: { district_name?: string | null }) => !hasDistrictSelection(filters.regionIds) || matchesRegionFilter(filters.regionIds, row.region, parameter.district_name ?? "");
    const monthly = row.monthly?.filter((parameter) => parameter.year === (year || null) && districtMatches(parameter));
    const useMonthly = !!filters.month || year > 0;
    const parameters = useMonthly && row.monthly
      ? (monthly ?? []).filter((parameter) => !filters.month || parameter.month === Number(filters.month))
      : row.parameters.filter(districtMatches);
    if (!parameters.length) return [];
    const totals = aggregateRainfall(parameters);
    return [{ ...row, month: filters.month ? Number(filters.month) : undefined, year: year || undefined, monthly, parameters, rainfallMm: totals.average, averageMm: totals.average, minimumMm: totals.minimum, maximumMm: totals.maximum }];
  });
  return scoped.filter((row) => (row.monthly !== undefined || (row.period === null ? year === 0 : row.period.startsWith(`${year}-`))) &&
    (!filters.month || row.monthly !== undefined || row.period?.slice(5, 7) === filters.month) &&
    (!query || row.region.toLocaleLowerCase("id-ID").includes(query)) &&
    (!filters.classifications.length || (row.classification !== null && filters.classifications.includes(row.classification))));
}
