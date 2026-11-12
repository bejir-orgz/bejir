import type { Metadata } from "next";
import { WebgisWorkspace } from "@/features/webgis/components/webgis-workspace";
import { workspaceData } from "@/features/webgis/workspace-data";

export const metadata: Metadata = { title: "Map Interaktif" };

export default function MapPage() {
  return <WebgisWorkspace data={workspaceData} />;
}
