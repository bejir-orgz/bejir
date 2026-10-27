import { matchesRegionFilter } from "@/features/webgis/region-tree";
import type { RainfallFilters, RainfallRow } from "./types";

export const emptyRainfallFilters: RainfallFilters = { query: "", regionIds: [], month: "", classifications: [] };

export function filterRainfallRows(rows: readonly RainfallRow[], year: number, filters: RainfallFilters) {
  const query = filters.query.trim().toLocaleLowerCase("id-ID");
  return rows.filter((row) => row.period.startsWith(`${year}-`) &&
    matchesRegionFilter(filters.regionIds, row.region) &&
    (!filters.month || row.period.slice(5, 7) === filters.month) &&
    (!query || row.region.toLocaleLowerCase("id-ID").includes(query)) &&
    (!filters.classifications.length || filters.classifications.includes(row.classification)));
}
