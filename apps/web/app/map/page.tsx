import type { Metadata } from "next";
import { WebgisWorkspace } from "@/features/webgis/components/webgis-workspace";
import { workspaceData } from "@/features/webgis/workspace-data";

export const metadata: Metadata = { title: "Map Interaktif" };

export default async function MapPage({ searchParams }: { searchParams: Promise<{ region?: string | string[] }> }) {
  const { region } = await searchParams;
  const regionIds = (Array.isArray(region) ? region : region ? [region] : []).filter((id) => /^!?\d+(?:\/\d+){0,2}$/.test(id));
  const data = regionIds.length ? { ...workspaceData, initialFilters: { ...workspaceData.initialFilters, regionIds } } : workspaceData;
  return <WebgisWorkspace key={regionIds.join(",") || "map"} data={data} />;
}
