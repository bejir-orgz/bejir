export type RiverBounds = [west: number, south: number, east: number, north: number];

export function riverDetail(bounds: RiverBounds) {
  const span = Math.max(bounds[2] - bounds[0], bounds[3] - bounds[1]);
  if (span > 2) return { limit: 450, simplifyM: 600 };
  if (span > 0.5) return { limit: 1200, simplifyM: 200 };
  return { limit: 2500, simplifyM: 75 };
}

export interface RiverViewportStatus {
  returned: number;
  total_matching: number;
  truncated: boolean;
  scope_unsupported: "village" | "too-wide" | null;
}

export function parseRiverRegions(query: URLSearchParams): string[] {
  const ids = query.getAll("region");
  if (ids.length > 1000 || ids.some((id) => !/^!?[1-9]\d*(?:\/[1-9]\d*){0,2}$/.test(id))) {
    throw new Error("Wilayah tidak valid.");
  }
  return [...new Set(ids)];
}

export function parseRiverBounds(value: string | null): RiverBounds {
  const bounds = value?.split(",").map(Number) ?? [];
  if (
    bounds.length !== 4 ||
    bounds.some((n) => !Number.isFinite(n)) ||
    bounds[0] < -180 ||
    bounds[2] > 180 ||
    bounds[1] < -90 ||
    bounds[3] > 90 ||
    bounds[0] >= bounds[2] ||
    bounds[1] >= bounds[3]
  ) {
    throw new Error("Batas peta tidak valid.");
  }
  return [bounds[0], bounds[1], bounds[2], bounds[3]];
}

export function riverViewportStatusMessage(data: RiverViewportStatus): { message: string } | undefined {
  if (data.scope_unsupported === "village") {
    return { message: "Filter sungai tingkat kelurahan/desa belum tersedia." };
  }
  if (data.scope_unsupported === "too-wide") {
    return { message: "Pilihan wilayah terlalu luas untuk filter sungai. Pilih lebih sedikit daerah." };
  }
  const shown = data.returned.toLocaleString("id-ID");
  // A truncated page arrives longest-first, so the view is the major rivers, not a random slice.
  if (data.truncated) {
    return {
      message: `API sungai saat ini memuat ${shown} dari ${data.total_matching.toLocaleString("id-ID")} segmen pada area peta. Perbesar peta untuk melihat lebih banyak segmen.`,
    };
  }
  return data.returned ? undefined : { message: "Tidak ada segmen sungai pada area peta ini." };
}
