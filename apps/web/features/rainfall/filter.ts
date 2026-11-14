import { hasDistrictSelection, hasVillageSelection, matchesRegionFilter } from "../webgis/region-tree";
import { aggregateRainfall } from "./summary";
import type { RainfallFilters, RainfallRow } from "./types";

export const emptyRainfallFilters: RainfallFilters = { query: "", regionIds: [], month: "", classifications: [] };

export function filterRainfallRows(rows: readonly RainfallRow[], year: number, filters: RainfallFilters) {
  const query = filters.query.trim().toLocaleLowerCase("id-ID");
  if (hasVillageSelection(filters.regionIds)) return [];
  const scoped = hasDistrictSelection(filters.regionIds) ? rows.flatMap((row) => {
    const parameters = row.parameters.filter((parameter) => matchesRegionFilter(filters.regionIds, row.region, parameter.district_name ?? ""));
    if (!parameters.length) return [];
    const totals = aggregateRainfall(parameters);
    return [{ ...row, parameters, rainfallMm: totals.average, averageMm: totals.average, minimumMm: totals.minimum, maximumMm: totals.maximum }];
  }) : rows.filter((row) => matchesRegionFilter(filters.regionIds, row.region));
  return scoped.filter((row) => (row.period === null ? year === 0 : row.period.startsWith(`${year}-`)) &&
    (!filters.month || row.period?.slice(5, 7) === filters.month) &&
    (!query || row.region.toLocaleLowerCase("id-ID").includes(query)) &&
    (!filters.classifications.length || (row.classification !== null && filters.classifications.includes(row.classification))));
}
