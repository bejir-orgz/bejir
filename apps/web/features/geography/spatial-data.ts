import { getCatalog } from "./catalog";
import { fetchBackend } from "../../lib/api/backend";
import { isRegionSelected } from "../webgis/region-tree";

export interface DistrictParameters {
  district_id: number;
  district_name: string | null;
  n_piksel: number | null;
  luas_km2: number | null;
  mean_elevasi_m: number | null;
  mean_hujan_mm: number | null;
  kelas_dominan_v2: number | null;
  landcover_dominan: string | null;
}

export interface ScopedDistrict extends DistrictParameters {
  regency_id: number;
  regency_name: string;
  population: number | null;
}

export async function readSpatialRows<T>(path: string): Promise<T[]> {
  const response = await fetchBackend(`/api/v1/${path}`, {
    ...(path.startsWith("geography/") ? { cache: "no-store" as const } : { next: { revalidate: 300 } }),
    signal: AbortSignal.timeout(15_000),
  });
  if (!response.ok) throw new Error("Data spasial gagal dimuat.");
  const rows: unknown = await response.json();
  if (!Array.isArray(rows)) throw new Error("Respons spasial tidak valid.");
  return rows;
}

export async function getSpatialDistricts(includePopulation = true): Promise<{ regencies: { id: number; name: string }[]; districts: ScopedDistrict[]; errors: string[] }> {
  const [catalog, parameters, exposures] = await Promise.allSettled([
    getCatalog(), getHazardParameters(),
    includePopulation ? readSpatialRows<{ district_id: number; penduduk_est: number | null }>("spatial-analysis/population-exposures") : Promise.resolve([]),
  ]);
  if (catalog.status === "rejected") throw catalog.reason;
  const { regencies, districts } = catalog.value;
  const expected = new Set(districts.map((row) => row.id));
  const errors: string[] = [];
  const index = <T extends { district_id: number }>(result: PromiseSettledResult<T[]>, label: string) => {
    const byId = new Map<number, T>();
    if (result.status === "fulfilled") {
      for (const row of result.value) {
        if (!expected.has(row.district_id) || byId.has(row.district_id)) { errors.push(`ID ${label} tidak valid.`); return new Map<number, T>(); }
        byId.set(row.district_id, row);
      }
      if ((includePopulation || label !== "penduduk") && byId.size !== expected.size) errors.push(`Cakupan ${label} belum lengkap.`);
    } else errors.push(`Data ${label} gagal dimuat.`);
    return byId;
  };
  const hazards = index(parameters, "parameter spasial");
  const population = index(exposures, "penduduk");
  const names = new Map(regencies.map((row) => [row.id, row.name]));
  return { regencies, errors, districts: districts.map((district) => ({
    district_id: district.id, district_name: district.name, regency_id: district.regency_id, regency_name: names.get(district.regency_id)!,
    n_piksel: hazards.get(district.id)?.n_piksel ?? null,
    luas_km2: hazards.get(district.id)?.luas_km2 ?? null,
    mean_elevasi_m: hazards.get(district.id)?.mean_elevasi_m ?? null,
    mean_hujan_mm: hazards.get(district.id)?.mean_hujan_mm ?? null,
    kelas_dominan_v2: hazards.get(district.id)?.kelas_dominan_v2 ?? null,
    landcover_dominan: hazards.get(district.id)?.landcover_dominan ?? null,
    population: population.get(district.id)?.penduduk_est ?? null,
  })) };
}

export async function getHazardParameters(regencyIds: number[] = []): Promise<DistrictParameters[]> {
  const [rows, { districts }] = await Promise.all([readSpatialRows<DistrictParameters>("spatial-analysis/district-hazards"), getCatalog()]);
  const expected = new Set(districts.map((row) => row.id));
  if (rows.length !== expected.size || new Set(rows.map((row) => row.district_id)).size !== rows.length || rows.some((row) => !expected.has(row.district_id))) throw new Error("Cakupan parameter spasial tidak lengkap atau berulang.");
  if (!regencyIds.length) return rows;
  const selected = new Set(districts.filter((row) => regencyIds.includes(row.regency_id)).map((row) => row.id));
  return rows.filter((row) => selected.has(row.district_id));
}

export async function selectedHazards(regionIds: string[]): Promise<DistrictParameters[]> {
  if (!regionIds.length) return getHazardParameters();
  if (regionIds.some((id) => id.replace(/^!/, "").split("/").length === 3)) return [];
  const [rows, catalog] = await Promise.all([getHazardParameters(), getCatalog()]);
  const parents = new Map(catalog.districts.map((row) => [row.id, row.regency_id]));
  return rows.filter((row) => isRegionSelected(regionIds, `${parents.get(row.district_id)}/${row.district_id}`));
}

export { classLabels, classColors, nullableSum, weightedMean, dominantClass, susceptibilityDistribution } from "./aggregation";
