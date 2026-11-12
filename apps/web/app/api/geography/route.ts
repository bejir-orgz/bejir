import { fetchBackend } from "@/lib/api/backend";

interface GeographyRow {
  id: number;
  name: string;
}

export async function GET(request: Request) {
  const parent = new URL(request.url).searchParams.get("parent");
  if (parent !== null && !/^[1-9]\d*(?:\/[1-9]\d*)?$/.test(parent)) {
    return Response.json({ error: "Wilayah induk tidak valid." }, { status: 400 });
  }

  const [regencyId, districtId] = parent?.split("/") ?? [];
  const [resource, filter] = districtId
    ? ["villages", `district_id=${districtId}`]
    : regencyId
      ? ["districts", `regency_id=${regencyId}`]
      : ["regencies", "province_code=32"];
  const limit = 100;

  try {
    const regions = [];
    const signal = AbortSignal.any([request.signal, AbortSignal.timeout(20_000)]);
    for (let offset = 0; ; offset += limit) {
      const response = await fetchBackend(`/api/v1/geography/${resource}?${filter}&limit=${limit}&offset=${offset}`, { signal, cache: "no-store" });
      if (!response.ok) throw new Error("Geography request failed");
      const rows: GeographyRow[] = await response.json();
      for (const { id, name } of rows) {
        if (!Number.isSafeInteger(id) || id < 1 || typeof name !== "string") throw new Error("Invalid geography row");
        regions.push({
          id: parent ? `${parent}/${id}` : String(id),
          name: parent || /^(Kota|Kabupaten)\s/i.test(name) ? name : `Kabupaten ${name}`,
        });
      }
      if (rows.length < limit) break;
    }
    return Response.json(regions);
  } catch {
    return Response.json({ error: "Daerah gagal dimuat." }, { status: 502 });
  }
}
