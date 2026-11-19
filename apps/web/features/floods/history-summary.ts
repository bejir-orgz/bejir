import { yearOverYear } from "../../lib/year-over-year";
import { nullableSum } from "../geography/aggregation";
import { hasDistrictSelection, matchesRegionFilter } from "../webgis/region-tree";
import type { FloodHistoryData } from "./types";

export const unavailableSnapshot: FloodHistoryData["snapshots"][number] = {
  events: "—", eventChange: "—", housesFlooded: "—", housesFloodedNote: "—",
  deaths: null, missing: null, timeline: [],
};

export function summarizeHistory(data: FloodHistoryData, regionIds: string[]) {
  if (hasDistrictSelection(regionIds)) return unavailableSnapshot;
  const rows = data.rows.filter((row) => matchesRegionFilter(regionIds, row.region));
  const previousRows = data.previousCounts?.filter((row) => matchesRegionFilter(regionIds, row.region));
  const previous = previousRows?.reduce((total, row) => total + row.events, 0);
  const sum = (field: "deaths" | "missing" | "housesFlooded") => rows.every((row) => row[field] != null)
    ? rows.reduce((total, row) => total + (row[field] ?? 0), 0) : null;

  const houses = sum("housesFlooded");
  return {
    events: rows.length.toLocaleString("id-ID"),
    eventChange: yearOverYear(rows.length, previous).change,
    housesFlooded: houses === null ? "—" : houses.toLocaleString("id-ID") + " unit",
    housesFloodedNote: yearOverYear(houses, previousRows ? nullableSum(previousRows.map((row) => row.housesFlooded ?? null)) : null).change,
    deaths: sum("deaths"), missing: sum("missing"),
    timeline: ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"]
      .map((month, index) => ({ month, events: rows.filter((row) => Number(row.date.slice(5, 7)) === index + 1).length })),
  };
}
