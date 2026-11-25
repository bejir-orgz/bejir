import { getCatalog } from "../geography/catalog";
import { isRegionSelected } from "../webgis/region-tree";

/** /api/v1/rivers accepts at most 100 district ids, and a regency holds up to 47. */
const maxDistrictIds = 100;

export type RiverScope =
  | { kind: "all"; query: "" }
  | { kind: "districts"; query: string }
  | { kind: "empty" }
  | { kind: "village" }
  | { kind: "too-wide" };

/**
 * Turn a region selection into the filter the rivers API understands.
 * Districts carry the whole selection, exclusions included, because a regency
 * is just its districts — and district filtering is the indexed path upstream.
 */
export async function riverScope(regionIds: string[]): Promise<RiverScope> {
  if (!regionIds.length) return { kind: "all", query: "" };
  if (regionIds.some((id) => id.replace(/^!/, "").split("/").length === 3)) return { kind: "village" };
  const { districts } = await getCatalog();
  const selected = districts.filter((row) => isRegionSelected(regionIds, `${row.regency_id}/${row.id}`));
  if (!selected.length) return { kind: "empty" };
  if (selected.length > maxDistrictIds) return { kind: "too-wide" };
  return { kind: "districts", query: selected.map((row) => `district_id=${row.id}`).join("&") };
}
