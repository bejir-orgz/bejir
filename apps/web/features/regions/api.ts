import type { RegionNode } from "@/features/webgis/types";

export async function fetchRegionChildren(parentId?: string, signal?: AbortSignal): Promise<RegionNode[]> {
  const query = parentId ? `?parent=${encodeURIComponent(parentId)}` : "";
  const response = await fetch(`/api/geography${query}`, { signal });
  if (!response.ok) throw new Error("Daerah gagal dimuat.");
  return response.json();
}
