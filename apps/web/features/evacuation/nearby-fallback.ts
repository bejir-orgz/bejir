import { requestBackend } from "../../lib/api/client";
import type { EvacuationSite } from "./types";

export interface NearbySite {
  id: number;
  name: string | null;
  latitude: number;
  longitude: number;
  distance_m: number;
}

export const EVACUATION_CATEGORIES = [
  { id: "kesehatan", label: "Kesehatan" },
  { id: "pendidikan", label: "Pendidikan" },
  { id: "ibadah", label: "Ibadah" },
  { id: "umum", label: "Umum" },
] as const;

export type EvacuationCategoryId = (typeof EVACUATION_CATEGORIES)[number]["id"];

export const ALL_EVACUATION_CATEGORIES: readonly EvacuationCategoryId[] = EVACUATION_CATEGORIES.map((c) => c.id);

/** Maps API category labels cleanly into one of the four canonical buckets. */
export function normalizeEvacuationCategory(raw: string | null | undefined): EvacuationCategoryId {
  const value = (raw ?? "").trim().toLowerCase();
  if (value.includes("sehat") || value.includes("rs") || value.includes("puskesmas") || value.includes("klinik")) {
    return "kesehatan";
  }
  if (value.includes("didik") || value.includes("sekolah") || value.includes("kampus") || value.includes("univ")) {
    return "pendidikan";
  }
  if (value.includes("ibadah") || value.includes("masjid") || value.includes("gereja") || value.includes("vihara")) {
    return "ibadah";
  }
  return "umum";
}

export function filterEvacuationSitesByCategories(
  sites: readonly EvacuationSite[],
  activeCategories: readonly EvacuationCategoryId[],
): EvacuationSite[] {
  if (activeCategories.length === EVACUATION_CATEGORIES.length) return [...sites];
  if (activeCategories.length === 0) return [];
  const allowed = new Set<EvacuationCategoryId>(activeCategories);
  return sites.filter((site) => allowed.has(normalizeEvacuationCategory(site.category)));
}

/** Most evacuation sites are a few hundred metres away, where "0 km" tells nobody anything. */
export function formatStraightDistance(distanceM: number): string {
  if (distanceM < 1000) return `${Math.round(distanceM).toLocaleString("id-ID")} m`;
  return `${(distanceM / 1000).toLocaleString("id-ID", { maximumFractionDigits: 1 })} km`;
}

export function haversineMeters(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const rad = Math.PI / 180;
  const dLat = (lat2 - lat1) * rad;
  const dLng = (lng2 - lng1) * rad;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * rad) * Math.cos(lat2 * rad) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  return 6371000 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export async function fetchNearestEvacuationSite(
  lng: number,
  lat: number,
  signal?: AbortSignal,
): Promise<NearbySite | null> {
  const nearby = await requestBackend<NearbySite[]>(
    `/api/v1/evacuation/sites/nearby?longitude=${lng}&latitude=${lat}&limit=1`,
    { signal },
  );
  return nearby[0] ?? null;
}
