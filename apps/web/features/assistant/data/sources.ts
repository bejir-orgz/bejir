export const assistantLayers = [
  { id: "rainfall", label: "Curah Hujan" },
  { id: "evacuation", label: "Titik Evakuasi" },
  { id: "rivers", label: "Jaringan Sungai" },
  { id: "flood-area", label: "Area Banjir" },
  { id: "dem", label: "DEM" },
  { id: "susceptibility", label: "Kerawanan Banjir" },
  { id: "land-cover", label: "Tutupan Lahan" },
] as const;

export type AssistantLayerId = (typeof assistantLayers)[number]["id"];

