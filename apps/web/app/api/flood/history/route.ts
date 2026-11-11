import { getFloodHistory } from "@/features/floods/api";

export async function GET(request: Request) {
  const year = new URL(request.url).searchParams.get("year");
  if (year === null || !/^\d{4}$/.test(year) || Number(year) < 1 || Number(year) > 9998) {
    return Response.json({ error: "Tahun tidak valid." }, { status: 400 });
  }
  try {
    return Response.json(await getFloodHistory(Number(year)));
  } catch {
    return Response.json({ error: "Data histori banjir gagal dimuat." }, { status: 502 });
  }
}
