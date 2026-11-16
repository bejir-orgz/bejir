import { readPrepared } from "../geography/prepared-data";
import type { PreparedRivers } from "./types";
import { summarizeRivers } from "./data";

let cache: { key: string; expires: number; promise: Promise<PreparedRivers> } | undefined;
export function getRivers(): Promise<PreparedRivers> {
  const key = `${process.env.BEJIR_API_URL || "http://80.43.0.180:8000"}|${process.env.BEJIR_PREPARED_DATA_DIR || process.cwd()}`;
  if (cache?.key === key && cache.expires > Date.now()) return cache.promise;
  const promise = readPrepared<PreparedRivers>("rivers").then((data) => {
    if (data.source_crs !== "EPSG:4326" || data.total !== data.features?.length || new Set(data.features.map((row) => row.id)).size !== data.total || data.features.some((row) => row.geometry?.type !== "MultiLineString" || row.bbox?.length !== 4 || !Array.isArray(row.properties?.district_paths))) throw new Error("Data sungai olahan tidak valid.");
    return data;
  }).catch((error) => { cache = undefined; throw error; });
  cache = { key, expires: Date.now() + 60_000, promise };
  return promise;
}
export async function getRiverSummary(regionIds: string[]) { return summarizeRivers(await getRivers(), regionIds); }
