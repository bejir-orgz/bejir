import type { WorkspaceData } from "./types";
import { emptyOverview } from "./overview-api";

// Existing workspace controls; observed values are supplied by the backend.
export const workspaceData: WorkspaceData = {
  source: "backend",
  year: 2026,
  layers: [
    { id: "rainfall", label: "Curah Hujan", count: 1 },
    { id: "evacuation", label: "Titik Evakuasi", count: 1 },
    { id: "rivers", label: "Jaringan Sungai", count: 1 },
    { id: "dem", label: "DEM", count: 1 },
    { id: "susceptibility", label: "Kerawanan Banjir", count: 1 },
    { id: "land-cover", label: "Tutupan Lahan", count: 1 },
  ],
  legends: [
    { id: "rainfall", label: "Curah Hujan" },
    { id: "evacuation", label: "Titik Evakuasi" },
    { id: "rivers", label: "Jaringan Sungai" },
    { id: "dem", label: "DEM" },
    { id: "susceptibility", label: "Flood Risk" },
    { id: "land-cover", label: "Tutupan Lahan" },
  ],
  initialFilters: {
    view: "map", period: "today", date: "", regionIds: [],
    layerIds: [], legendIds: [],
  },
  overview: emptyOverview(),
};
