export const assistantLayers = [
  { id: "flood_history", label: "Riwayat Banjir", defaultSelected: true },
  { id: "flood_susceptibility", label: "Kerawanan & Curah Hujan", defaultSelected: true },
  { id: "population_exposure", label: "Paparan Penduduk", defaultSelected: true },
  { id: "evacuation_sites", label: "Titik Evakuasi", defaultSelected: false },
  { id: "rivers", label: "Jaringan Sungai", defaultSelected: false },
] as const;

export type AssistantLayerId = (typeof assistantLayers)[number]["id"];
export const defaultAssistantLayerIds: AssistantLayerId[] = assistantLayers.filter((layer) => layer.defaultSelected).map((layer) => layer.id);
