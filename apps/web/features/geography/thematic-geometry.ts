import type { FeatureCollection, MultiPolygon, Polygon } from "geojson";
import { getHazardParameters, type DistrictParameters } from "./spatial-data";
import { fetchBackend } from "../../lib/api/backend";
import { westJavaBasemap } from "../map/basemap";

export type AdministrativeGeometry = Polygon | MultiPolygon;
export type PreparedCollection = FeatureCollection<AdministrativeGeometry, { id: number; name: string; regency_id?: number }>;
export interface ThematicProperties extends DistrictParameters { regency_id: number }
export type ThematicCollection = FeatureCollection<AdministrativeGeometry, ThematicProperties>;

/** Backend generalises after projecting to EPSG:3857, so the tolerance is in metres. */
const displayToleranceM3857 = 100;

/**
 * District outlines for the whole province, served by the backend viewport endpoint.
 * The browser never receives raw polygons and no generated file has to ship with the build.
 */
export async function getDistrictBoundaries(): Promise<PreparedCollection> {
  const [[south, west], [north, east]] = westJavaBasemap.bounds;
  const query = `bbox=${west},${south},${east},${north}&simplify_m=${displayToleranceM3857}&limit=5000`;
  const response = await fetchBackend(`/api/v1/geography/boundaries?level=district&${query}`, { next: { revalidate: 3600 } });
  if (!response.ok) throw new Error(`Batas kecamatan HTTP ${response.status}`);
  const data = await response.json();
  if (data?.type !== "FeatureCollection" || data.level !== "district" || !Array.isArray(data.features) || !data.features.length) {
    throw new Error("Respons batas kecamatan tidak valid.");
  }
  // A truncated page would silently drop districts from every thematic layer.
  if (data.truncated) throw new Error("Cakupan batas kecamatan terpotong.");
  return data as PreparedCollection;
}

export async function getThematicCollection(): Promise<ThematicCollection> {
  const [districts, parameters] = await Promise.all([getDistrictBoundaries(), getHazardParameters()]);
  const byId = new Map(parameters.map((row) => [row.district_id, row]));
  const ids = new Set(districts.features.map((row) => row.properties.id));
  if (ids.size !== districts.features.length || byId.size !== parameters.length || ids.size !== byId.size) throw new Error("Cakupan batas dan parameter berbeda.");
  const features = districts.features.map((feature) => {
    const row = byId.get(feature.properties.id);
    if (!row || !Number.isSafeInteger(feature.properties.regency_id) || !feature.geometry) throw new Error("Batas atau parameter kecamatan tidak lengkap.");
    return { ...feature, properties: {
      district_id: row.district_id, district_name: row.district_name ?? feature.properties.name,
      n_piksel: row.n_piksel, luas_km2: row.luas_km2, mean_elevasi_m: row.mean_elevasi_m, mean_hujan_mm: row.mean_hujan_mm,
      kelas_dominan_v2: row.kelas_dominan_v2, landcover_dominan: row.landcover_dominan, regency_id: feature.properties.regency_id!,
    } };
  });
  return { type: "FeatureCollection", features };
}
