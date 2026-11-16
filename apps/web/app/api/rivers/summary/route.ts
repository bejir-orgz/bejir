import { getRiverSummary } from "@/features/rivers/api";
import { parseRiverRegions } from "@/features/rivers/data";

export async function GET(request: Request) {
  let regions: string[];
  try { regions = parseRiverRegions(new URL(request.url).searchParams); }
  catch { return Response.json({ error: "Filter wilayah tidak valid." }, { status: 422 }); }
  try { return Response.json(await getRiverSummary(regions)); }
  catch (error) { console.error("rivers.summary", error instanceof Error ? error.message : "unavailable"); return Response.json({ error: "Ringkasan sungai belum dapat dimuat." }, { status: 503 }); }
}
