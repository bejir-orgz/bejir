import { matchesRegionFilter } from "../webgis/region-tree";
import type { FloodHistoryData } from "./types";

export const unavailableSnapshot: FloodHistoryData["snapshots"][number] = {
  events: "—", eventChange: "—", area: "—", areaChange: "—",
  deaths: null, missing: null, timeline: [],
};

export function summarizeHistory(data: FloodHistoryData, regionIds: string[]) {
  const rows = data.rows.filter((row) => matchesRegionFilter(regionIds, row.region));
  const previous = data.previousCounts?.filter((row) => matchesRegionFilter(regionIds, row.region))
    .reduce((total, row) => total + row.events, 0) ?? 0;
  const sum = (field: "deaths" | "missing") => rows.every((row) => row[field] !== null)
    ? rows.reduce((total, row) => total + (row[field] ?? 0), 0) : null;
  const percent = previous ? (rows.length - previous) / previous * 100 : null;
  return {
    events: rows.length.toLocaleString("id-ID"),
    eventChange: percent === null ? "—" : `${percent >= 0 ? "+" : ""}${percent.toLocaleString("id-ID", { maximumFractionDigits: 1 })}% dari tahun sebelumnya`,
    area: "—", areaChange: "—", deaths: sum("deaths"), missing: sum("missing"),
    timeline: ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"]
      .map((month, index) => ({ month, events: rows.filter((row) => Number(row.date.slice(5, 7)) === index + 1).length })),
  };
}
