import type { AnalysisFilters, AnalysisRow } from "./analysis-types";

export const emptyAnalysisFilters: AnalysisFilters = { query: "", region: "", susceptibility: [] };

export function filterAnalysisRows(rows: readonly AnalysisRow[], year: number, filters: AnalysisFilters) {
  const query = filters.query.trim().toLocaleLowerCase("id-ID");
  return rows.filter((row) => row.year === year &&
    (!filters.region || row.region === filters.region) &&
    (!query || row.region.toLocaleLowerCase("id-ID").includes(query)) &&
    (!filters.susceptibility.length || filters.susceptibility.includes(row.susceptibility)));
}
