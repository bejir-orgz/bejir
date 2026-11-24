import { fetchBackend } from "@/lib/api/backend";
import { byRegionName, getCatalog, regencyLabel } from "@/features/geography/catalog";
import { unstable_cache } from "next/cache";
import { getRegionSearchTree } from "@/features/geography/search";
import { filterRegionTree } from "@/features/webgis/region-tree";

const searchTree = unstable_cache(getRegionSearchTree, ["region-search-v1", process.env.BEJIR_API_URL || "documented"], { revalidate: 3600 });

interface GeographyRow {
  id: number;
  name: string;
}

export async function GET(request: Request) {
  const query = new URL(request.url).searchParams;
  const parent = query.get("parent");
  const search = query.get("search")?.trim();
  if (search && (search.length > 100 || parent !== null)) return Response.json({ error: "Pencarian tidak valid." }, { status: 400 });
  if (parent !== null && !/^[1-9]\d*(?:\/[1-9]\d*)?$/.test(parent)) {
    return Response.json({ error: "Wilayah induk tidak valid." }, { status: 400 });
  }

  const [regencyId, districtId] = parent?.split("/") ?? [];
  try {
    if (search) return Response.json(filterRegionTree(await searchTree(), search));
    let rows: GeographyRow[];
    if (!districtId) {
      const catalog = await getCatalog();
      rows = regencyId ? catalog.districts.filter((row) => row.regency_id === Number(regencyId)) : catalog.regencies;
    } else {
      rows = [];
      for (let offset = 0; ; offset += 1000) {
        const response = await fetchBackend(`/api/v1/geography/villages?district_id=${districtId}&include_geometry=false&limit=1000&offset=${offset}`, { signal: request.signal, next: { revalidate: 3600 } });
        if (!response.ok) throw new Error("Village metadata failed");
        const page: GeographyRow[] = await response.json();
        if (!Array.isArray(page)) throw new Error("Invalid village metadata");
        rows.push(...page);
        if (page.length < 1000) break;
      }
    }
    const seen = new Set<number>();
    return Response.json(rows.map(({ id, name }) => {
      if (!Number.isSafeInteger(id) || id < 1 || typeof name !== "string" || seen.has(id)) throw new Error("Invalid geography row");
      seen.add(id);
      return { id: parent ? `${parent}/${id}` : String(id), name: parent ? name : regencyLabel(name) };
    }).sort(byRegionName));
  } catch (error) {
    console.error("geography.metadata", error instanceof Error ? error.message : "unavailable");
    return Response.json({ error: "Daerah gagal dimuat." }, { status: 503 });
  }
}
