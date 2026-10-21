import type { FloodHistoryRow, HistoryFilters } from "./types";

export const emptyHistoryFilters: HistoryFilters = { query: "", region: "", severities: [], from: "", to: "" };

export function filterHistoryRows(rows: readonly FloodHistoryRow[], year: number, filters: HistoryFilters) {
  const query = filters.query.trim().toLocaleLowerCase("id-ID");
  return rows.filter((row) =>
    row.date.startsWith(`${year}-`) &&
    (!filters.region || row.region === filters.region) &&
    (!query || row.region.toLocaleLowerCase("id-ID").includes(query)) &&
    (!filters.severities.length || filters.severities.includes(row.severity)) &&
    (!filters.from || row.date >= filters.from) &&
    (!filters.to || row.date <= filters.to)
  );
}

export function localDateString(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}
