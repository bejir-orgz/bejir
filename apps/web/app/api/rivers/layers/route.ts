import type { Feature, LineString, MultiLineString } from "geojson";
import { fetchBackend } from "@/lib/api/backend";
import { parseRiverRegions, parseRiverBounds } from "@/features/rivers/data";
import { riverScope } from "@/features/rivers/filter";
import type { RiverProperties } from "@/features/rivers/types";

/**
 * A wide viewport is the expensive case upstream: counting and sorting every matching
 * river costs about six seconds before a single row is serialized, and full detail there
 * is invisible anyway at roughly 300 m per pixel. Ask for less of it as the view widens.
 */
function viewportDetail(bounds: number[]): { limit: number; simplifyM: number } {
  const span = Math.max(bounds[2] - bounds[0], bounds[3] - bounds[1]);
  if (span > 2) return { limit: 1000, simplifyM: 400 };
  if (span > 0.5) return { limit: 2500, simplifyM: 150 };
  return { limit: 4000, simplifyM: 50 };
}

interface RiverRow {
  id: number;
  name: string | null;
  river_type: string | null;
  geom: LineString | MultiLineString | null;
}

/** Simplification collapses single-part rivers to LineString, so both arrive on the same page. */
function asMultiLine(geom: RiverRow["geom"]): MultiLineString | null {
  if (geom?.type === "MultiLineString") return geom.coordinates.length ? geom : null;
  if (geom?.type === "LineString") {
    return geom.coordinates.length ? { type: "MultiLineString", coordinates: [geom.coordinates] } : null;
  }
  return null;
}

const emptyCollection = (extra: Record<string, unknown>) =>
  Response.json({
    type: "FeatureCollection",
    features: [],
    total_matching: 0,
    returned: 0,
    truncated: false,
    scope_unsupported: null,
    ...extra,
  });

export async function GET(request: Request) {
  let regions: string[], bounds: number[];
  try {
    const query = new URL(request.url).searchParams;
    regions = parseRiverRegions(query);
    bounds = parseRiverBounds(query.get("bbox"));
  } catch {
    return Response.json({ error: "Filter peta tidak valid." }, { status: 422 });
  }
  try {
    const scope = await riverScope(regions);
    if (scope.kind === "village") return emptyCollection({ scope_unsupported: "village" });
    if (scope.kind === "too-wide") return emptyCollection({ scope_unsupported: "too-wide" });
    if (scope.kind === "empty") return emptyCollection({});
    const { limit, simplifyM } = viewportDetail(bounds);
    const query = `bbox=${bounds.join(",")}&simplify_m=${simplifyM}&limit=${limit}${scope.query ? `&${scope.query}` : ""}`;
    const response = await fetchBackend(`/api/v1/rivers?${query}`, {
      signal: request.signal,
      next: { revalidate: 3600 },
    });
    if (!response.ok) throw new Error(`Rivers HTTP ${response.status}`);
    const page: { items?: RiverRow[]; total?: number; truncated?: boolean } = await response.json();
    if (!Array.isArray(page.items) || !Number.isSafeInteger(page.total)) {
      throw new Error("Respons sungai tidak valid.");
    }
    const features: Feature<MultiLineString, RiverProperties>[] = [];
    for (const row of page.items) {
      const geometry = asMultiLine(row.geom);
      if (!geometry) continue;
      features.push({
        type: "Feature",
        id: row.id,
        geometry,
        properties: { id: row.id, name: row.name, river_type: row.river_type, district_paths: [] },
      });
    }
    return Response.json({
      type: "FeatureCollection",
      features,
      total_matching: page.total,
      returned: features.length,
      truncated: Boolean(page.truncated),
      scope_unsupported: null,
    });
  } catch (error) {
    console.error("rivers.layers", error instanceof Error ? error.message : "unavailable");
    return Response.json({ error: "Layer sungai belum dapat dimuat." }, { status: 503 });
  }
}
