import { unstable_cache } from "next/cache";
import { getThematicCollection } from "@/features/geography/thematic-geometry";

const collection = unstable_cache(getThematicCollection, ["prepared-district-themes", process.env.BEJIR_API_URL || "documented"], { revalidate: 300 });

export async function GET() {
  try { return Response.json(await collection()); }
  catch (error) {
    console.error("spatial.layers", error instanceof Error ? error.message : "unavailable");
    return Response.json({ error: "Layer parameter kecamatan belum tersedia. Data olahan perlu disiapkan." }, { status: 503 });
  }
}
