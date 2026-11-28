import { fetchBackend } from "@/lib/api/backend";
import { parseRiverRegions } from "@/features/rivers/data";
import { riverScope } from "@/features/rivers/filter";
import { riverTileMaxZoom, riverTileMinZoom } from "@/features/rivers/tiles";

const tileType = "application/vnd.mapbox-vector-tile";

export async function GET(request: Request, { params }: { params: Promise<{ z: string; x: string; y: string }> }) {
  const { z, x, y } = await params;
  const [zoom, col, row] = [z, x, y].map(Number);
  if (![z, x, y].every((value) => /^\d+$/.test(value)) || zoom < riverTileMinZoom || zoom > riverTileMaxZoom ||
      col >= 2 ** zoom || row >= 2 ** zoom) {
    return Response.json({ error: "Koordinat tile tidak valid." }, { status: 422 });
  }
  let ids: string[];
  try {
    ids = parseRiverRegions(new URL(request.url).searchParams);
  } catch {
    return Response.json({ error: "Filter wilayah tidak valid." }, { status: 422 });
  }
  const headers = {
    "Content-Type": tileType,
    "Cache-Control": ids.length ? "private, max-age=120" : "public, max-age=300, s-maxage=300",
  };
  try {
    const scope = await riverScope(ids, { tiles: true });
    if (scope.kind === "empty" || scope.kind === "village" || scope.kind === "too-wide") return new Response(null, { headers });
    const query = scope.query ? `?${scope.query}` : "";
    const upstream = await fetchBackend(`/api/v1/rivers/tiles/${zoom}/${col}/${row}.mvt${query}`, {
      signal: request.signal,
      cache: "no-store",
    });
    if (upstream.ok && upstream.headers.get("content-type")?.startsWith(tileType)) {
      return new Response(upstream.body, { headers });
    }
  } catch (error) {
    console.error("rivers.tiles", error instanceof Error ? error.message : "unavailable");
  }
  return Response.json({ error: "Tile jaringan sungai belum tersedia." }, { status: 503 });
}
