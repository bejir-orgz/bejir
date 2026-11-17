import { unstable_cache } from "next/cache";
import { getFacilityTotals } from "@/features/floods/api";

const cachedTotals = unstable_cache(getFacilityTotals, ["facility-totals-impacts-v3", process.env.BEJIR_API_URL || "documented"], { revalidate: 300 });

export async function GET(request: Request) {
  const query = new URL(request.url).searchParams;
  const ids = query.getAll("regency_id");
  const from = query.get("from") || "";
  const to = query.get("to") || "";
  const dateValid = (date: string) => !date || (/^\d{4}-\d{2}-\d{2}$/.test(date) && Number.isFinite(Date.parse(date)) && new Date(date).toISOString().slice(0, 10) === date);
  if (ids.some((id) => !/^[1-9]\d*$/.test(id) || !Number.isSafeInteger(Number(id))) || !dateValid(from) || !dateValid(to) || (to && (!from || to < from))) return Response.json({ error: "Filter tidak valid." }, { status: 422 });
  try { return Response.json(await cachedTotals([...new Set(ids.map(Number))].sort((a, b) => a - b), from, to)); }
  catch (error) {
    console.error("flood.facilities", error instanceof Error ? error.message : "unavailable");
    return Response.json({ error: "Jumlah fasilitas gagal dimuat." }, { status: 503 });
  }
}
