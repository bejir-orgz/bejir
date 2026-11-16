import type { FloodHistoryData, FloodHistoryRow, FloodSeverity } from "@/features/floods/types";

// The first page follows the Figma specimen. Every row is synthetic, including place/date pairings.
const samples: { region: string; district: string; village: string; severity: FloodSeverity; areaKm2: number; deaths: number; missing: number }[] = [
  { region: "Kota Bogor", district: "Tanah Sareal", village: "Cibadak", severity: "Rendah", areaKm2: .84, deaths: 0, missing: 1 },
  { region: "Kab. Bogor", district: "Cibinong", village: "Pabuaran", severity: "Sedang", areaKm2: 1.25, deaths: 1, missing: 0 },
  { region: "Kota Depok", district: "Pancoran Mas", village: "Depok Jaya", severity: "Sedang", areaKm2: 2.10, deaths: 0, missing: 2 },
  { region: "Kota Bekasi", district: "Jatiasih", village: "Jatiluhur", severity: "Tinggi", areaKm2: .63, deaths: 2, missing: 1 },
  { region: "Kab. Bekasi", district: "Tambun Selatan", village: "Setiadarma", severity: "Sedang", areaKm2: 1.78, deaths: 1, missing: 3 },
  { region: "Kab. Cianjur", district: "Cipanas", village: "Sindanglaya", severity: "Tinggi", areaKm2: 3.42, deaths: 3, missing: 2 },
  { region: "Kab. Sukabumi", district: "Cisaat", village: "Sukamanah", severity: "Rendah", areaKm2: 2.65, deaths: 0, missing: 1 },
  { region: "Kota Bandung", district: "Gedebage", village: "Rancabolang", severity: "Rendah", areaKm2: .91, deaths: 1, missing: 0 },
  { region: "Kab. Bandung", district: "Baleendah", village: "Andir", severity: "Tinggi", areaKm2: 4.12, deaths: 4, missing: 5 },
  { region: "Kab. Garut", district: "Tarogong Kidul", village: "Haurpanggung", severity: "Sedang", areaKm2: 1.56, deaths: 2, missing: 2 },
];

const years = [2026, 2025, 2024];
const months = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
const trend = [70, 90, 95, 115, 120, 135, 145, 160, 170, 190, 205, 220];
const rows: FloodHistoryRow[] = years.flatMap((year) => Array.from({ length: 240 }, (_, index) => {
  const day = new Date(year, 8, 21 - index);
  return {
    ...samples[index % samples.length],
    floodType: null,
    id: `dummy-${year}-${index + 1}`,
    date: `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, "0")}-${String(day.getDate()).padStart(2, "0")}`,
  };
}));

export const mockFloodHistory: FloodHistoryData = {
  years,
  regions: samples.map((row) => row.region),
  rows,
  snapshots: {
    2026: { events: "286", eventChange: "+15,8% dari 2025", area: "13,4 km²", areaChange: "+14,5% dari 2025", deaths: 61, missing: 3, timeline: months.map((month, index) => ({ month, events: trend[index] })) },
    2025: { events: "247", eventChange: "+8,3% dari 2024", area: "11,7 km²", areaChange: "+6,4% dari 2024", deaths: 47, missing: 4, timeline: months.map((month, index) => ({ month, events: Math.round(trend[index] * .85) })) },
    2024: { events: "228", eventChange: "+4,6% dari 2023", area: "11,0 km²", areaChange: "+3,8% dari 2023", deaths: 39, missing: 2, timeline: months.map((month, index) => ({ month, events: Math.round(trend[index] * .75) })) },
  },
};
