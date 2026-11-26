import { fetchBackend } from "../../lib/api/backend";
import { byRegionName, getCatalog, regencyLabel } from "./catalog";
import type { RegionNode } from "../webgis/types";

export interface RegionSearchMatch {
  id: string;
  name: string;
  parents: string[];
}

/** Match each region by name and return its parent labels to distinguish duplicate names. */
export function findRegionMatches(nodes: RegionNode[], query: string): RegionSearchMatch[] {
  const normalize = (name: string) => name.trim().replace(/\s+/g, " ").toLocaleLowerCase("id-ID");
  const term = normalize(query);
  if (!term) return [];
  const villageQuery = term.replace(/^(desa|kelurahan) /, "");
  const exact: RegionSearchMatch[] = [];
  const partial: RegionSearchMatch[] = [];

  function visit(regions: RegionNode[], parents: string[]) {
    for (const { id, name, children } of regions) {
      const normalized = normalize(name);
      const matchName = parents.length === 2 ? normalized.replace(/^(desa|kelurahan) /, "") : normalized;
      const matchTerm = parents.length === 2 ? villageQuery : term;
      if (matchName === matchTerm) exact.push({ id, name, parents });
      else if (matchName.includes(matchTerm)) partial.push({ id, name, parents });
      if (children?.length) visit(children, [...parents, name]);
    }
  }

  visit(nodes, []);
  return [...exact, ...partial].slice(0, 30);
}

/** Search names at every level without loading map geometries or expanding 627 branches. */
export async function getRegionSearchTree(): Promise<RegionNode[]> {
  const catalog = await getCatalog();
  const roots: RegionNode[] = catalog.regencies.map((row) => ({
    id: String(row.id),
    name: regencyLabel(row.name),
    children: [],
  })).sort(byRegionName);
  const regencies = new Map(roots.map((row) => [Number(row.id), row]));
  const districts = new Map<number, RegionNode>();
  for (const row of catalog.districts) {
    const node: RegionNode = { id: `${row.regency_id}/${row.id}`, name: row.name, children: [] };
    const parentRegency = regencies.get(row.regency_id);
    if (parentRegency?.children) parentRegency.children.push(node);
    districts.set(row.id, node);
  }
  const seen = new Set<number>();
  for (let offset = 0; ; offset += 1000) {
    const response = await fetchBackend(`/api/v1/geography/villages?include_geometry=false&limit=1000&offset=${offset}`, { next: { revalidate: 3600 } });
    if (!response.ok) throw new Error("Metadata kelurahan gagal dimuat.");
    const rows: { id: number; name: string; district_id: number }[] = await response.json();
    if (!Array.isArray(rows)) throw new Error("Metadata kelurahan tidak valid.");
    for (const row of rows) {
      if (!row || !Number.isSafeInteger(row.id) || row.id < 1 || !Number.isSafeInteger(row.district_id) || row.district_id < 1 || typeof row.name !== "string" || seen.has(row.id)) {
        throw new Error("Metadata kelurahan tidak valid.");
      }
      seen.add(row.id);
      const parent = districts.get(row.district_id);
      if (parent?.children) parent.children.push({ id: `${parent.id}/${row.id}`, name: row.name });
    }
    if (rows.length < 1000) break;
  }
  return roots;
}
