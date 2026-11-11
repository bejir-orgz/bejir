export const floodRankingSource = "https://bnpb.go.id/storage/app/media/Buletin%20Info%20Bencana/Buku%20Data%20Bencana%202024/20250613_Buku%20Data%202024.pdf#page=146";

// BNPB, Data Bencana Indonesia 2024, Table L5, printed pp. 128–129.
// Ranked by flood event count across the recorded West Java regencies/cities.
// Coordinates are approximate display anchors within regencies, not event locations.
export const topFloodRegions = [
  { code: "3215", name: "Kabupaten Karawang", shortName: "Karawang", count: 19, coordinates: [-6.3054, 107.3000] },
  { code: "3201", name: "Kabupaten Bogor", shortName: "Bogor", count: 18, coordinates: [-6.4797, 106.8240] },
  { code: "3204", name: "Kabupaten Bandung", shortName: "Bandung", count: 14, coordinates: [-7.0253, 107.5198] },
  { code: "3209", name: "Kabupaten Cirebon", shortName: "Cirebon", count: 13, coordinates: [-6.7603, 108.4831] },
  { code: "3216", name: "Kabupaten Bekasi", shortName: "Bekasi", count: 11, coordinates: [-6.3646, 107.1725] },
] satisfies { code: string; name: string; shortName: string; count: number; coordinates: [number, number] }[];
