import { fetchBackend } from "@/lib/api/backend";

export async function GET(request: Request) {
  let mode = "geojson";
  try {
    // A small tile checks the actual service, including databases that cannot encode MVT.
    const upstream = await fetchBackend("/api/v1/rivers/tiles/14/13088/8496.mvt", {
      signal: AbortSignal.any([request.signal, AbortSignal.timeout(3500)]),
      cache: "no-store",
    });
    if (upstream.ok && upstream.headers.get("content-type")?.startsWith("application/vnd.mapbox-vector-tile")) mode = "tiles";
    await upstream.body?.cancel();
  } catch {
    // The existing GeoJSON route can still work when the tile service is unavailable.
  }
  return Response.json({ mode }, { headers: { "Cache-Control": "private, max-age=60" } });
}
