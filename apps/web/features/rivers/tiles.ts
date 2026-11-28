export const riverTileMinZoom = 4;
export const riverTileMaxZoom = 14;

export function riverTileTemplate(regionIds: readonly string[]) {
  if (regionIds.some((id) => id.split("/").length === 3)) return null;
  const query = new URLSearchParams();
  for (const id of [...new Set(regionIds)].sort()) query.append("region", id);
  return `/backend/web/rivers/tiles/{z}/{x}/{y}${query.size ? `?${query}` : ""}`;
}

export const riverVillageStatus = { message: "Filter sungai tingkat kelurahan/desa belum tersedia." };
