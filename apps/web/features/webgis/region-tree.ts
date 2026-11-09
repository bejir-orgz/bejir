import type { RegionNode } from "./types";

/** Retain parent context when a descendant matches a region search. */
export function filterRegionTree(nodes: RegionNode[], query: string): RegionNode[] {
  const term = query.trim().toLocaleLowerCase("id-ID");
  if (!term) return nodes;
  return nodes.flatMap((node) => {
    if (node.name.toLocaleLowerCase("id-ID").includes(term)) return [node];
    const children = filterRegionTree(node.children ?? [], term);
    return children.length ? [{ ...node, children }] : [];
  });
}

export function toggleSelection(ids: string[], id: string): string[] {
  return ids.includes(id) ? ids.filter((value) => value !== id) : [...ids, id];
}

export const westJavaFilterId = "province:jawa-barat";

export interface DistrictFilterRow {
  region: string;
  district: string;
}

const regionFilterId = (name: string) => `region:${encodeURIComponent(name)}`;
const districtFilterId = (region: string, district: string) => `${regionFilterId(region)}/district:${encodeURIComponent(district)}`;

/** Build only the administrative levels supplied by the presentation data. */
export function createRegionFilterTree(regions: readonly string[], rows: readonly DistrictFilterRow[] = []): RegionNode[] {
  if (!regions.length) return [];
  return [{
    id: westJavaFilterId,
    name: "Jawa Barat",
    children: [...new Set(regions)].sort((a, b) => a.localeCompare(b, "id-ID")).map((region) => ({
      id: regionFilterId(region),
      name: region.replace(/^Kab\.\s*/, "Kabupaten "),
      children: [...new Set(rows.filter((row) => row.region === region).map((row) => row.district).filter(Boolean))]
        .sort((a, b) => a.localeCompare(b, "id-ID"))
        .map((district) => ({ id: districtFilterId(region, district), name: `Kecamatan ${district}` })),
    })),
  }];
}

/** Selected nodes are combined with OR; all other table filters still apply with AND. */
export function matchesRegionFilter(ids: readonly string[], region: string, district?: string): boolean {
  return !ids.length || ids.includes(westJavaFilterId) || ids.includes(regionFilterId(region)) ||
    (district !== undefined && ids.includes(districtFilterId(region, district)));
}
