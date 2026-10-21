import type { RainfallPageData, RainfallRow } from "@/features/rainfall/types";

// All statistics, dates, and location pairings below are synthetic design specimens.
// Classification is fixture text, never calculated from rainfall thresholds.
const samples: Omit<RainfallRow, "id" | "period">[] = [
  { region: "Kota Bogor", classification: "Tinggi", rainfallMm: 428, averageMm: 17.1, minimumMm: 4, maximumMm: 62 },
  { region: "Kab. Bogor", classification: "Sangat Tinggi", rainfallMm: 512, averageMm: 20.5, minimumMm: 6, maximumMm: 71 },
  { region: "Kota Depok", classification: "Sedang", rainfallMm: 286, averageMm: 11.4, minimumMm: 2, maximumMm: 45 },
  { region: "Kota Bekasi", classification: "Rendah", rainfallMm: 174, averageMm: 7, minimumMm: 0, maximumMm: 31 },
  { region: "Kab. Bekasi", classification: "Sangat Rendah", rainfallMm: 76, averageMm: 3, minimumMm: 0, maximumMm: 18 },
  { region: "Kab. Cianjur", classification: "Tinggi", rainfallMm: 467, averageMm: 18.7, minimumMm: 5, maximumMm: 68 },
  { region: "Kab. Sukabumi", classification: "Sangat Tinggi", rainfallMm: 534, averageMm: 21.4, minimumMm: 6, maximumMm: 75 },
  { region: "Kota Bandung", classification: "Sedang", rainfallMm: 221, averageMm: 8.8, minimumMm: 1, maximumMm: 39 },
  { region: "Kab. Bandung", classification: "Tinggi", rainfallMm: 356, averageMm: 14.2, minimumMm: 3, maximumMm: 57 },
  { region: "Kab. Garut", classification: "Tinggi", rainfallMm: 309, averageMm: 12.4, minimumMm: 2, maximumMm: 49 },
];
const months = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
// Illustrative bar heights from Figma; independent of table and annual summary specimens.
const distribution = [12.6, 14.9, 12.6, 11, 7.5, 5.9, 5.9, 7.5, 8.7, 11, 12.6, 14];
const years = [2026, 2025, 2024];

export const mockRainfall: RainfallPageData = {
  years,
  regions: samples.map((row) => row.region),
  rows: years.flatMap((year) => Array.from({ length: 240 }, (_, index) => ({
    ...samples[index % samples.length],
    id: `rainfall-dummy-${year}-${index + 1}`,
    period: `${year}-${String((8 - Math.floor(index / 10) % 12 + 12) % 12 + 1).padStart(2, "0")}`,
  }))),
  legend: [
    { label: "Sangat Rendah", range: "< 1.000 mm/tahun", color: "var(--status-very-low)" },
    { label: "Rendah", range: "1.000–1.500 mm/tahun", color: "var(--status-low)" },
    { label: "Sedang", range: "1.500–2.500 mm/tahun", color: "var(--status-medium)" },
    { label: "Tinggi", range: "2.500–3.000 mm/tahun", color: "var(--status-high)" },
    { label: "Sangat Tinggi", range: "> 3.000 mm/tahun", color: "var(--status-very-high)" },
  ],
  snapshots: {
    2026: { metrics: [
      { label: "Rata-Rata Curah Hujan", value: "2.460 mm/tahun", change: "+4,7% dari 2025", trend: "increase" },
      { label: "Curah Hujan Minimum", value: "1.180 mm/tahun", change: "−3,4% dari 2025", trend: "decrease" },
      { label: "Curah Hujan Maksimum", value: "3.420 mm/tahun", change: "+6,9% dari 2025", trend: "increase" },
    ], distribution: months.map((month, index) => ({ month, rainfallMm: distribution[index] })) },
    2025: { metrics: [
      { label: "Rata-Rata Curah Hujan", value: "2.350 mm/tahun", change: "+3,1% dari 2024", trend: "increase" },
      { label: "Curah Hujan Minimum", value: "1.222 mm/tahun", change: "−2,0% dari 2024", trend: "decrease" },
      { label: "Curah Hujan Maksimum", value: "3.200 mm/tahun", change: "+2,6% dari 2024", trend: "increase" },
    ], distribution: months.map((month, index) => ({ month, rainfallMm: Math.round(distribution[index] * .9 * 10) / 10 })) },
    2024: { metrics: [
      { label: "Rata-Rata Curah Hujan", value: "2.279 mm/tahun", change: "+2,0% dari 2023", trend: "increase" },
      { label: "Curah Hujan Minimum", value: "1.247 mm/tahun", change: "−1,2% dari 2023", trend: "decrease" },
      { label: "Curah Hujan Maksimum", value: "3.119 mm/tahun", change: "+1,8% dari 2023", trend: "increase" },
    ], distribution: months.map((month, index) => ({ month, rainfallMm: Math.round(distribution[index] * .8 * 10) / 10 })) },
  },
};
