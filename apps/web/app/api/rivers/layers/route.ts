import { getRivers } from "@/features/rivers/api";
import { parseRiverRegions, parseRiverBounds, riverViewport } from "@/features/rivers/data";

export async function GET(request: Request) {
  let regions: string[], bounds: number[];
  try { const query = new URL(request.url).searchParams; regions = parseRiverRegions(query); bounds = parseRiverBounds(query.get("bbox")); }
  catch { return Response.json({ error: "Filter peta tidak valid." }, { status: 422 }); }
  try { return Response.json(riverViewport(await getRivers(), regions, bounds)); }
  catch (error) { console.error("rivers.layers", error instanceof Error ? error.message : "unavailable"); return Response.json({ error: "Layer sungai belum dapat dimuat." }, { status: 503 }); }
}
