import { matchesRegionFilter } from "@/features/webgis/region-tree";
import type { AnalysisFilters, AnalysisRow } from "./analysis-types";

export const emptyAnalysisFilters: AnalysisFilters = { query: "", regionIds: [], susceptibility: [] };

export function filterAnalysisRows(rows: readonly AnalysisRow[], year: number, filters: AnalysisFilters) {
  const query = filters.query.trim().toLocaleLowerCase("id-ID");
  return rows.filter((row) => row.year === year &&
    matchesRegionFilter(filters.regionIds, row.region) &&
    (!query || row.region.toLocaleLowerCase("id-ID").includes(query)) &&
    (!filters.susceptibility.length || filters.susceptibility.includes(row.susceptibility)));
}
