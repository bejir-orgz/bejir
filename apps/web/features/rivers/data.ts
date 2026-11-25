import { isRegionSelected } from "../webgis/region-tree";
import type { PreparedRivers, RiverFeature, RiverSummary } from "./types";

export function scopeRivers(data: PreparedRivers, regionIds: string[]): RiverFeature[] {
  if (regionIds.some((id) => id.replace(/^!/, "").split("/").length === 3)) return [];
  return !regionIds.length ? data.features : data.features.filter((feature) => feature.properties.district_paths.some((path) => isRegionSelected(regionIds, path)));
}
export function summarizeRivers(data: PreparedRivers, regionIds: string[]): RiverSummary {
  if (regionIds.some((id) => id.replace(/^!/, "").split("/").length === 3)) return { total: null, by_regency: {}, prepared_at: data.prepared_at };
  const rows = scopeRivers(data, regionIds);
  const by_regency: Record<string, number> = {};
  for (const row of rows) {
    const parents = new Set(row.properties.district_paths.filter((path) => !regionIds.length || isRegionSelected(regionIds, path)).map((path) => path.split("/")[0]));
    for (const id of parents) by_regency[id] = (by_regency[id] || 0) + 1;
  }
  return { total: rows.length, by_regency, prepared_at: data.prepared_at };
}
export function parseRiverRegions(query: URLSearchParams): string[] {
  const ids = query.getAll("region");
  if (ids.length > 1000 || ids.some((id) => !/^!?[1-9]\d*(?:\/[1-9]\d*){0,2}$/.test(id))) throw new Error("Wilayah tidak valid.");
  return [...new Set(ids)];
}
export function parseRiverBounds(value: string | null): number[] {
  const bounds = value?.split(",").map(Number) ?? [];
  if (bounds.length !== 4 || bounds.some((n) => !Number.isFinite(n)) || bounds[0] < -180 || bounds[2] > 180 || bounds[1] < -90 || bounds[3] > 90 || bounds[0] >= bounds[2] || bounds[1] >= bounds[3]) throw new Error("Batas peta tidak valid.");
  return bounds;
}
