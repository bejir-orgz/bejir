import type { RegionNode } from "@/features/webgis/types";

export async function fetchRegionChildren(parentId?: string, signal?: AbortSignal): Promise<RegionNode[]> {
  const query = parentId ? `?parent=${encodeURIComponent(parentId)}` : "";
  const response = await fetch(`/api/geography${query}`, { signal });
  if (!response.ok) throw new Error("Daerah gagal dimuat.");
  return response.json();
}

export async function searchRegions(query: string, signal?: AbortSignal): Promise<RegionNode[]> {
  const response = await fetch(`/api/geography?search=${encodeURIComponent(query)}`, { signal });
  if (!response.ok) throw new Error("Pencarian daerah gagal dimuat.");
  return response.json();
}
