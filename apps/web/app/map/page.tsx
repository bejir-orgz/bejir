import type { Metadata } from "next";
import { WebgisWorkspace } from "@/features/webgis/components/webgis-workspace";
import { mockWorkspaceData } from "@/mocks/webgis";

export const metadata: Metadata = { title: "Map Interaktif" };

export default function MapPage() {
  return <WebgisWorkspace data={mockWorkspaceData} />;
}
