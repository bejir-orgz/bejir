export const assistantLayers = [
  { id: "rainfall", label: "Curah Hujan", defaultSelected: true },
  { id: "evacuation", label: "Titik Evakuasi", defaultSelected: true },
  { id: "rivers", label: "Jaringan Sungai", defaultSelected: false },
  { id: "flood-area", label: "Area Banjir", defaultSelected: false },
  { id: "dem", label: "DEM", defaultSelected: false },
  { id: "buildings", label: "Bangunan Penting", defaultSelected: false },
  { id: "susceptibility", label: "Kerawanan Banjir", defaultSelected: false },
  { id: "land-cover", label: "Tutupan Lahan", defaultSelected: false },
] as const;

export type AssistantLayerId = (typeof assistantLayers)[number]["id"];
export const defaultAssistantLayerIds: AssistantLayerId[] = assistantLayers.filter((layer) => layer.defaultSelected).map((layer) => layer.id);

