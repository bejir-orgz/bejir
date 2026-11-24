import { unstable_cache } from "next/cache";
import { getFloodHistory } from "@/features/floods/api";

// Impacts live only on event detail, so a year costs one request per event: 305 of them
// for 2021. Assembling that once an hour keeps the cost off almost every reader.
const cachedHistory = unstable_cache(getFloodHistory, ["flood-history-v1", process.env.BEJIR_API_URL || "documented"], { revalidate: 3600 });

export async function GET(request: Request) {
  const year = new URL(request.url).searchParams.get("year");
  if (year === null || !/^\d{4}$/.test(year) || Number(year) < 1 || Number(year) > 9998) {
    return Response.json({ error: "Tahun tidak valid." }, { status: 400 });
  }
  try {
    return Response.json(await cachedHistory(Number(year)));
  } catch (error) {
    console.error("flood.history", error instanceof Error ? error.message : "unavailable");
    return Response.json({ error: "Data histori banjir gagal dimuat." }, { status: 502 });
  }
}
