import { matchesRegionFilter } from "../webgis/region-tree";
import type { RainfallFilters, RainfallRow } from "./types";

export const emptyRainfallFilters: RainfallFilters = { query: "", regionIds: [], month: "", classifications: [] };

export function filterRainfallRows(rows: readonly RainfallRow[], year: number, filters: RainfallFilters) {
  const query = filters.query.trim().toLocaleLowerCase("id-ID");
  return rows.filter((row) => (row.period === null ? year === 0 : row.period.startsWith(`${year}-`)) &&
    matchesRegionFilter(filters.regionIds, row.region) &&
    (!filters.month || row.period?.slice(5, 7) === filters.month) &&
    (!query || row.region.toLocaleLowerCase("id-ID").includes(query)) &&
    (!filters.classifications.length || (row.classification !== null && filters.classifications.includes(row.classification))));
}
