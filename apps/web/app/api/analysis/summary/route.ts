import { getAnalysisSummary } from "@/features/webgis/analysis-api";

export async function GET(request: Request) {
  const query = new URL(request.url).searchParams;
  const year = query.get("year") || "";
  const ids = query.getAll("regency_id");
  if (!/^\d{4}$/.test(year) || Number(year) < 2 || Number(year) > 9998 || ids.some((id) => !/^[1-9]\d*$/.test(id))) {
    return Response.json({ error: "Filter tidak valid." }, { status: 422 });
  }
  try {
    const data = await getAnalysisSummary(Number(year), ids.map(Number));
    if (data.errors?.length) console.warn("analysis.summary.partial", data.errors);
    const unavailable = data.metrics[0].value === "—" && !data.annualEvents.length && data.distribution.every((row) => row.value === null);
    return Response.json(data, { status: unavailable && data.errors?.length ? 503 : 200 });
  } catch (error) {
    console.error("analysis.summary", error instanceof Error ? error.message : "unavailable");
    return Response.json({ error: "Ringkasan histori gagal dimuat." }, { status: 503 });
  }
}
