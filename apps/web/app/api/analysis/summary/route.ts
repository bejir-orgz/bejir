import { getAnalysisSummary } from "@/features/webgis/analysis-api";

export async function GET(request: Request) {
  const query = new URL(request.url).searchParams;
  const year = query.get("year") || "";
  const ids = query.getAll("regency_id");
  if (!/^\d{4}$/.test(year) || Number(year) < 2 || Number(year) > 9998 || ids.some((id) => !/^[1-9]\d*$/.test(id))) {
    return Response.json({ error: "Filter tidak valid." }, { status: 422 });
  }
  try { return Response.json(await getAnalysisSummary(Number(year), ids.map(Number))); }
  catch { return Response.json({ error: "Ringkasan histori gagal dimuat." }, { status: 502 }); }
}
