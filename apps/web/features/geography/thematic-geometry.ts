import type { FeatureCollection, MultiPolygon, Polygon } from "geojson";
import { getHazardParameters, type DistrictParameters } from "./spatial-data";
import { readPrepared } from "./prepared-data";

export type AdministrativeGeometry = Polygon | MultiPolygon;
export type PreparedCollection = FeatureCollection<AdministrativeGeometry, { id: number; name: string; regency_id?: number }>;
export interface PreparedBoundaries { crs: "EPSG:4326"; regencies: PreparedCollection; districts: PreparedCollection }
export interface ThematicProperties extends DistrictParameters { regency_id: number }
export type ThematicCollection = FeatureCollection<AdministrativeGeometry, ThematicProperties>;

export async function getThematicCollection(): Promise<ThematicCollection> {
  const [boundaries, parameters] = await Promise.all([readPrepared<PreparedBoundaries>("boundaries"), getHazardParameters()]);
  if (boundaries.crs !== "EPSG:4326" || !boundaries.districts.features.length) throw new Error("Batas tampilan belum tersedia.");
  const byId = new Map(parameters.map((row) => [row.district_id, row]));
  const ids = new Set(boundaries.districts.features.map((row) => row.properties.id));
  if (ids.size !== boundaries.districts.features.length || byId.size !== parameters.length || ids.size !== byId.size) throw new Error("Cakupan batas dan parameter berbeda.");
  const features = boundaries.districts.features.map((feature) => {
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
