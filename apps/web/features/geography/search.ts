import { fetchBackend } from "../../lib/api/backend";
import { byRegionName, getCatalog, regencyLabel } from "./catalog";
import type { RegionNode } from "../webgis/types";

/** Search names at every level without loading map geometries or expanding 627 branches. */
export async function getRegionSearchTree(): Promise<RegionNode[]> {
  const catalog = await getCatalog();
  const roots = catalog.regencies.map((row) => ({
    id: String(row.id),
    name: regencyLabel(row.name),
    children: [] as RegionNode[],
  })).sort(byRegionName);
  const regencies = new Map(roots.map((row) => [Number(row.id), row]));
  const districts = new Map<number, RegionNode>();
  for (const row of catalog.districts) {
    const node = { id: `${row.regency_id}/${row.id}`, name: row.name, children: [] };
    regencies.get(row.regency_id)!.children.push(node);
    districts.set(row.id, node);
  }
  const seen = new Set<number>();
  for (let offset = 0; ; offset += 1000) {
    const response = await fetchBackend(`/api/v1/geography/villages?include_geometry=false&limit=1000&offset=${offset}`, { next: { revalidate: 3600 } });
    if (!response.ok) throw new Error("Metadata kelurahan gagal dimuat.");
    const rows: { id: number; name: string; district_id: number }[] = await response.json();
    if (!Array.isArray(rows)) throw new Error("Metadata kelurahan tidak valid.");
    for (const row of rows) {
      if (!row || !Number.isSafeInteger(row.id) || row.id < 1 || !Number.isSafeInteger(row.district_id) || row.district_id < 1 || typeof row.name !== "string" || seen.has(row.id)) throw new Error("Metadata kelurahan tidak valid.");
      seen.add(row.id);
      const parent = districts.get(row.district_id);
      if (parent) parent.children!.push({ id: `${parent.id}/${row.id}`, name: row.name });
    }
    if (rows.length < 1000) break;
  }
  return roots;
}
