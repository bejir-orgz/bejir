import type { WorkspaceData } from "@/features/webgis/types";

// Values and copy from Figma are demo fixtures, never recorded observations.
export const mockWorkspaceData: WorkspaceData = {
  source: "dummy",
  year: 2026,
  regions: [
    { id: "kab-bogor", name: "Kabupaten Bogor", children: [
      { id: "cibinong", name: "Cibinong" }, { id: "citeureup", name: "Citeureup" },
    ] },
    { id: "kota-bogor", name: "Kota Bogor", children: [
      { id: "tanah-sareal", name: "Tanah Sareal", children: [
        { id: "cibadak", name: "Cibadak" },
        { id: "kayumanis", name: "Kayumanis" },
        { id: "kebonpedes", name: "Kebonpedes" },
        { id: "kedungbadak", name: "Kedungbadak" },
        { id: "kedungjaya", name: "Kedungjaya" },
      ] },
    ] },
  ],
  layers: [
    { id: "rainfall", label: "Curah Hujan", count: 5 },
    { id: "evacuation", label: "Titik Evakuasi", count: 1 },
    { id: "rivers", label: "Jaringan Sungai", count: 1 },
    { id: "flood-area", label: "Area Banjir", count: 1 },
    { id: "dem", label: "DEM", count: 1 },
    { id: "buildings", label: "Bangunan Penting", count: 4 },
    { id: "susceptibility", label: "Kerawanan Banjir", count: 1 },
    { id: "land-cover", label: "Tutupan Lahan", count: 1 },
  ],
  legends: [
    { id: "rainfall", label: "Curah Hujan" },
    { id: "evacuation", label: "Titik Evakuasi" },
    { id: "rivers", label: "Jaringan Sungai" },
    { id: "flood-area", label: "Area Banjir" },
    { id: "dem", label: "DEM" },
    { id: "buildings", label: "Bangunan Penting" },
    { id: "susceptibility", label: "Flood Risk" },
  ],
  initialFilters: {
    view: "map", period: "today", date: "", regionIds: ["cibadak"],
    layerIds: ["rainfall", "evacuation", "rivers", "buildings"], legendIds: ["rainfall"],
  },
  initiallyExpandedRegions: ["kota-bogor", "tanah-sareal"],
  overview: {
    metrics: [
      { id: "floods", label: "Total Kejadian Banjir", value: "286", change: "+15,8% dari 2025", trend: "increase" },
      { id: "area", label: "Area Terdampak", value: "13,4 km²", change: "+14,5% dari 2025", trend: "increase" },
      { id: "rainfall", label: "Curah Hujan Tahunan", value: "2.840 mm", change: "+9,6% dari 2025", trend: "increase" },
      { id: "population", label: "Penduduk Terdampak", value: "18.640 jiwa", change: "−6,2% dari 2025", trend: "decrease" },
    ],
    summary: "Sepanjang 2026 tercatat 286 kejadian banjir dengan luas terdampak 13,4 km². Curah hujan tahunan 2.840 mm menempatkan wilayah pada kategori kerawanan tinggi. Sekitar 18.640 penduduk terdampak, terutama di dataran rendah dan koridor sungai. Pemantauan muka air, pembersihan drainase, dan kesiapan evakuasi perlu diprioritaskan menjelang puncak musim hujan.",
    susceptibility: {
      label: "Tinggi", colors: ["#3CFF00", "#E1FF00", "#FFD000", "#FF6A00", "#FF0000"],
      notes: [
        "Kerawanan tinggi dipicu curah hujan 2.840 mm/tahun dan permukiman padat di bantaran sungai.",
        "Enam kecamatan masuk zona prioritas pemantauan.",
        "Siagakan pos pantau, bersihkan saluran utama, dan perbarui jalur evakuasi sebelum puncak hujan. Fokuskan dukungan pada warga rentan dan fasilitas penting.",
      ],
    },
    facilities: [
      { id: "health", label: "Fasilitas Kesehatan", count: 42 },
      { id: "education", label: "Fasilitas Pendidikan", count: 186 },
      { id: "public", label: "Fasilitas Umum", count: 73 },
      { id: "worship", label: "Tempat Ibadah", count: 129 },
    ],
    landCover: ["Pemukiman", "Air", "Hutan"], elevation: "28 meter", rivers: "10 sungai",
  },
};
