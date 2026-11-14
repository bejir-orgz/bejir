import type { AnalysisData, AnalysisRow } from "@/features/webgis/analysis-types";

// All values and region/statistic pairings are synthetic Figma specimens, not GIS results.
const samples: Omit<AnalysisRow, "id" | "year">[] = [
  { region: "Kota Bogor", susceptibility: "Tinggi", population: 1125000, areaKm2: 111.4, rivers: 7, elevationM: 265 },
  { region: "Kab. Bogor", susceptibility: "Sangat Tinggi", population: 5489000, areaKm2: 2991, rivers: 12, elevationM: 150 },
  { region: "Kota Depok", susceptibility: "Sedang", population: 2146000, areaKm2: 200.3, rivers: 4, elevationM: 95 },
  { region: "Kota Bekasi", susceptibility: "Sangat Tinggi", population: 2590000, areaKm2: 210.5, rivers: 8, elevationM: 19 },
  { region: "Kab. Bekasi", susceptibility: "Tinggi", population: 3250000, areaKm2: 1225, rivers: 10, elevationM: 28 },
  { region: "Kab. Cianjur", susceptibility: "Sedang", population: 2506000, areaKm2: 3840, rivers: 6, elevationM: 392 },
  { region: "Kab. Sukabumi", susceptibility: "Tinggi", population: 2806000, areaKm2: 4146, rivers: 9, elevationM: 584 },
  { region: "Kota Bandung", susceptibility: "Rendah", population: 2540000, areaKm2: 167.3, rivers: 3, elevationM: 768 },
  { region: "Kab. Bandung", susceptibility: "Sedang", population: 3718000, areaKm2: 1762, rivers: 7, elevationM: 675 },
  { region: "Kab. Garut", susceptibility: "Sangat Rendah", population: 2701000, areaKm2: 3074, rivers: 2, elevationM: 717 },
];
const years = [2026, 2025, 2024];
const classes: AnalysisData["classes"] = [
  { label: "Sangat Tinggi", color: "var(--status-very-high)" },
  { label: "Tinggi", color: "var(--status-high)" },
  { label: "Sedang", color: "var(--status-medium)" },
  { label: "Rendah", color: "var(--status-low)" },
  { label: "Sangat Rendah", color: "var(--status-very-low)" },
];
const snapshots: AnalysisData["snapshots"] = {};
for (const year of years) {
  const previous = year - 1;
  const offset = 2026 - year;
  snapshots[year] = {
    metrics: [
      { id: "events", label: "Total Kejadian Banjir", value: ["286", "247", "228"][offset], change: [`+15,8% dari ${previous}`, `+8,3% dari ${previous}`, `+4,6% dari ${previous}`][offset], trend: "increase" },
      { id: "area", label: "Total Area Terdampak", value: ["13,4 km²", "11,7 km²", "11,0 km²"][offset], change: [`+14,5% dari ${previous}`, `+6,4% dari ${previous}`, `+3,8% dari ${previous}`][offset], trend: "increase" },
      { id: "population", label: "Penduduk Terdampak", value: ["18.640 jiwa", "19.872 jiwa", "20.400 jiwa"][offset], change: [`−6,2% dari ${previous}`, `−2,6% dari ${previous}`, `−1,5% dari ${previous}`][offset], trend: "decrease" },
      { id: "average", label: "Rata-Rata Kejadian/Bulan", value: ["23,8", "20,6", "19,0"][offset], change: [`+15,8% dari ${previous}`, `+8,3% dari ${previous}`, `+4,6% dari ${previous}`][offset], trend: "increase" },
    ],
    // The repeated labels are deliberately preserved from the frame. IDs distinguish chart rows.
    frequency: [40, 36, 34, 32, 29, 26, 23, 21, 18, 14].map((events, index) => ({ id: `frequency-${index}`, region: "Kabupaten Bogor", events: events - offset })),
    distribution: classes.map((entry, index) => ({ ...entry, value: [40, 32, 35, 29, 26][index] - offset })),
    // Independent chart specimens follow the frame scale, not the annual metric totals.
    annualEvents: [42, 49, 42, 36, 25].map((events, index) => ({ year: String(year - 4 + index), events: events - offset })),
    facilities: [
      { id: "health", label: "Fasilitas Kesehatan", count: [42, 39, 36][offset] },
      { id: "education", label: "Fasilitas Pendidikan", count: [186, 178, 165][offset] },
      { id: "worship", label: "Tempat Ibadah", count: [129, 121, 110][offset] },
    ],
  };
}

export const mockAnalysis: AnalysisData = {
  years, classes, snapshots,
  regions: samples.map((row) => row.region),
  // Repeated design specimens exercise pagination; these are not 240 distinct administrative areas.
  rows: years.flatMap((year) => Array.from({ length: 240 }, (_, index) => ({ ...samples[index % samples.length], id: `analysis-dummy-${year}-${index + 1}`, year }))),
};
