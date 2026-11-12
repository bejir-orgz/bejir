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
    return Response.json(await getWorkspaceOverview(ids, from, to));
  } catch {
    return Response.json({ error: "Ringkasan backend gagal dimuat." }, { status: 502 });
  }
}
