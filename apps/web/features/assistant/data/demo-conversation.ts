/** Presentation-only fixtures from Figma; these are not observed or calculated GIS results. */
export const demoPrompt = "Berikan saya rangkuman Curah Hujan, Titik Evakuasi, Jaringan Sungai, dan Bangunan Penting";

export const assistantLayers = [
  { id: "rainfall", label: "Curah Hujan", defaultSelected: true },
  { id: "evacuation", label: "Titik Evakuasi", defaultSelected: true },
  { id: "rivers", label: "Jaringan Sungai", defaultSelected: true },
  { id: "flood-area", label: "Area Banjir", defaultSelected: false },
  { id: "dem", label: "DEM", defaultSelected: false },
  { id: "buildings", label: "Bangunan Penting", defaultSelected: true },
  { id: "susceptibility", label: "Kerawanan Banjir", defaultSelected: false },
  { id: "land-cover", label: "Tutupan Lahan", defaultSelected: false },
] as const;

export type AssistantLayerId = (typeof assistantLayers)[number]["id"];
export const defaultAssistantLayerIds: AssistantLayerId[] = assistantLayers.filter((layer) => layer.defaultSelected).map((layer) => layer.id);

export const demoReport = {
  summary: "Sepanjang 2026 tercatat 286 kejadian banjir dengan luas terdampak 13,4 km² dan 18.640 penduduk terpapar. Enam kecamatan masuk zona prioritas karena berada di dataran rendah serta dekat jaringan sungai. Dibandingkan 2025, jumlah kejadian naik 15,8%, sementara jumlah penduduk terdampak turun 6,2%. Pemerintah daerah memfokuskan mitigasi pada pembersihan drainase, pemantauan muka air, dan kesiapan jalur evakuasi.",
  rainfall: "Akumulasi curah hujan mencapai 2.840 mm/tahun, meningkat 9,6% dari 2025 dan termasuk kategori tinggi. Puncak hujan diperkirakan berlangsung pada November–Februari, dengan rata-rata bulanan 237 mm dan maksimum harian 86 mm. Wilayah bantaran sungai perlu siaga ketika hujan lebat berlangsung lebih dari tiga jam. Pembaruan peringatan dini dilakukan setiap enam jam selama periode cuaca ekstrem.",
  risks: ["Curah hujan: 2.840 mm/tahun.", "Elevasi: rata-rata 28 meter.", "Sungai: 10 aliran aktif.", "Drainase: 37 titik penyempitan.", "Penduduk rentan: 18.640 jiwa."],
  regions: [
    { name: "Tanah Sareal", risk: "Sangat Tinggi", focus: "Drainase" },
    { name: "Cibinong", risk: "Tinggi", focus: "Sungai" },
    { name: "Baleendah", risk: "Tinggi", focus: "Evakuasi" },
    { name: "Jatiasih", risk: "Sedang", focus: "Pompa" },
    { name: "Gedebage", risk: "Rendah", focus: "Pantau" },
  ],
  updatedAt: "24 September 2026",
  recommendations: ["Bersihkan 37 titik drainase.", "Aktifkan pos pantau 24 jam.", "Perbarui jalur evakuasi.", "Siapkan logistik untuk 2.500 warga.", "Uji sistem peringatan setiap pekan.", "Evaluasi kemajuan setiap dua pekan."],
};

export interface DemoExchange {
  id: number;
  question: string;
  layerIds: AssistantLayerId[];
}
