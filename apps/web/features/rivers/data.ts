export function parseRiverRegions(query: URLSearchParams): string[] {
  const ids = query.getAll("region");
  if (ids.length > 1000 || ids.some((id) => !/^!?[1-9]\d*(?:\/[1-9]\d*){0,2}$/.test(id))) throw new Error("Wilayah tidak valid.");
  return [...new Set(ids)];
}
export function parseRiverBounds(value: string | null): number[] {
  const bounds = value?.split(",").map(Number) ?? [];
  if (bounds.length !== 4 || bounds.some((n) => !Number.isFinite(n)) || bounds[0] < -180 || bounds[2] > 180 || bounds[1] < -90 || bounds[3] > 90 || bounds[0] >= bounds[2] || bounds[1] >= bounds[3]) throw new Error("Batas peta tidak valid.");
  return bounds;
}
