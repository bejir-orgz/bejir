import { readPrepared } from "@/features/geography/prepared-data";
import type { PreparedBoundaries } from "@/features/geography/thematic-geometry";
import { fetchBackend } from "@/lib/api/backend";

export async function GET(request: Request) {
  const region = new URL(request.url).searchParams.get("region") || "";
  if (!/^[1-9]\d*(?:\/[1-9]\d*){0,2}$/.test(region)) return Response.json({ error: "Wilayah tidak valid." }, { status: 422 });
  const parts = region.split("/").map(Number);
  try {
    if (parts.length === 3) {
      const response = await fetchBackend(`/api/v1/geography/villages/${parts[2]}`, { signal: request.signal, next: { revalidate: 3600 } });
      if (!response.ok) throw new Error("Village boundary failed");
      return Response.json(await response.json());
    }
    const data = await readPrepared<PreparedBoundaries>("boundaries");
    const feature = (parts.length === 1 ? data.regencies : data.districts).features.find((row) => row.properties.id === parts.at(-1));
    if (!feature || (parts.length === 2 && feature.properties.regency_id !== parts[0])) return Response.json({ error: "Wilayah tidak ditemukan." }, { status: 404 });
    return Response.json({ name: feature.properties.name, geom: feature.geometry });
  } catch (error) {
    console.error("geography.boundary", error instanceof Error ? error.message : "unavailable");
    return Response.json({ error: "Batas wilayah belum tersedia." }, { status: 503 });
  }
}
