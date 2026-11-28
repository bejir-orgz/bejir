import { getCatalog } from "../geography/catalog";
import { isRegionSelected } from "../webgis/region-tree";

/** /api/v1/rivers accepts at most 100 district ids, and a regency holds up to 47. */
const maxDistrictIds = 100;

export type RiverScope =
  | { kind: "all"; query: "" }
  | { kind: "districts"; query: string }
  | { kind: "regencies"; query: string }
  | { kind: "empty" }
  | { kind: "village" }
  | { kind: "too-wide" };

/**
 * Turn a region selection into the filter the rivers API understands.
 * Districts carry the whole selection, exclusions included, because a regency
 * is just its districts and district filtering is the indexed path upstream.
 */
export async function riverScope(regionIds: string[], { tiles = false, viewport = false } = {}): Promise<RiverScope> {
  if (!regionIds.length) return { kind: "all", query: "" };
  if (regionIds.some((id) => id.replace(/^!/, "").split("/").length === 3)) return { kind: "village" };
  if ((tiles ? regionIds.length <= 27 : viewport && regionIds.length === 1) &&
      regionIds.every((id) => /^[1-9]\d*$/.test(id))) {
    return { kind: "regencies", query: regionIds.map((id) => `regency_id=${id}`).join("&") };
  }
  const { districts } = await getCatalog();
  const selected = districts.filter((row) => isRegionSelected(regionIds, `${row.regency_id}/${row.id}`));
  if (!selected.length) return { kind: "empty" };
  if (viewport && selected.length === districts.length) return { kind: "all", query: "" };
  if (!tiles && selected.length > maxDistrictIds) return { kind: "too-wide" };
  return { kind: "districts", query: selected.map((row) => `district_id=${row.id}`).join("&") };
}
