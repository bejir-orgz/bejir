import { getEvacuationSites } from "@/features/evacuation/api";

export async function GET(request: Request) {
  try {
    return Response.json(await getEvacuationSites(request.signal));
  } catch {
    return Response.json({ error: "Titik evakuasi gagal dimuat." }, { status: 502 });
  }
}
