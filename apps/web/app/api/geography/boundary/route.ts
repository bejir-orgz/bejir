import { fetchBackend } from "@/lib/api/backend";

/** region = "<regency>", "<regency>/<district>" or "<regency>/<district>/<village>". */
const collections = ["regencies", "districts", "villages"] as const;

interface BoundaryRecord {
  name?: unknown;
  regency_id?: unknown;
  geom?: unknown;
}

export async function GET(request: Request) {
  const region = new URL(request.url).searchParams.get("region") || "";
  if (!/^[1-9]\d*(?:\/[1-9]\d*){0,2}$/.test(region)) return Response.json({ error: "Wilayah tidak valid." }, { status: 422 });
  const parts = region.split("/").map(Number);
  try {
    const response = await fetchBackend(`/api/v1/geography/${collections[parts.length - 1]}/${parts.at(-1)}`, { signal: request.signal, next: { revalidate: 3600 } });
    if (response.status === 404) return Response.json({ error: "Wilayah tidak ditemukan." }, { status: 404 });
    if (!response.ok) throw new Error(`Boundary HTTP ${response.status}`);
    const record: BoundaryRecord = await response.json();
    // A district reached through the wrong parent is a different region, not a backend failure.
    if (parts.length === 2 && record.regency_id !== parts[0]) return Response.json({ error: "Wilayah tidak ditemukan." }, { status: 404 });
    if (typeof record.name !== "string" || !record.geom) throw new Error("Batas wilayah tidak lengkap.");
    return Response.json({ name: record.name, geom: record.geom });
  } catch (error) {
    console.error("geography.boundary", error instanceof Error ? error.message : "unavailable");
    return Response.json({ error: "Batas wilayah belum tersedia." }, { status: 503 });
  }
}
