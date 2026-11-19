import { getRainfallPageData } from "@/features/rainfall/api";
import { buildRainfallView } from "@/features/rainfall/view";
import { parseRainfallQuery } from "@/features/rainfall/query";

export async function POST(request: Request) {
  if (request.headers.get("content-type")?.split(";")[0] !== "application/x-www-form-urlencoded") return Response.json({ error: "Format filter tidak valid." }, { status: 415 });
  const body = await request.text();
  if (body.length > 200000) return Response.json({ error: "Filter terlalu besar." }, { status: 413 });
  const scope = parseRainfallQuery(new URLSearchParams(body));
  if (!scope) return Response.json({ error: "Filter hujan tidak valid." }, { status: 422 });
  try {
    const data = await getRainfallPageData();
    return Response.json(buildRainfallView(data, scope));
  } catch {
    return Response.json({ error: "Data curah hujan gagal dimuat." }, { status: 503 });
  }
}
