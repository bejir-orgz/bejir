import type { Metadata } from "next";
import { WebgisWorkspace } from "@/features/webgis/components/webgis-workspace";
import { workspaceData } from "@/features/webgis/workspace-data";

export const metadata: Metadata = { title: "Map Interaktif" };

export default async function MapPage({ searchParams }: { searchParams: Promise<{ region?: string | string[] }> }) {
  const { region } = await searchParams;
  const regionId = typeof region === "string" && /^\d+$/.test(region) ? region : undefined;
  const data = regionId ? { ...workspaceData, initialFilters: { ...workspaceData.initialFilters, regionIds: [regionId] } } : workspaceData;
  return <WebgisWorkspace key={regionId ?? "map"} data={data} />;
}
