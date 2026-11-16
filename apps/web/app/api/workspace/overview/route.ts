import { getWorkspaceOverview } from "@/features/webgis/overview-api";

export async function GET(request: Request) {
  const query = new URL(request.url).searchParams;
  const ids = query.getAll("region");
  const from = query.get("from") || "";
  const to = query.get("to") || "";
  const validDate = (value: string) => !value || (/^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value);
  if (ids.some((id) => !/^!?\d+(?:\/\d+){0,2}$/.test(id)) || !validDate(from) || !validDate(to) || (to && (!from || to < from))) {
    return Response.json({ error: "Filter tidak valid." }, { status: 422 });
  }
  try {
    const data = await getWorkspaceOverview(ids, from, to);
    if (data.errors?.length) console.warn("workspace.overview.partial", data.errors);
    return Response.json(data, { status: data.errors?.length === 3 ? 503 : 200 });
  } catch (error) {
    console.error("workspace.overview", error instanceof Error ? error.message : "unavailable");
    return Response.json({ error: "Ringkasan backend gagal dimuat." }, { status: 503 });
  }
}
