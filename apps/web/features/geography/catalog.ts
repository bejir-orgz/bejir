import { fetchBackend } from "../../lib/api/backend";
import type { AdministrativeCatalog } from "../../lib/api/schemas";

export type Catalog = AdministrativeCatalog;

/** Catalog names drop the administrative prefix; every list and table shows it and sorts by it. */
export function regencyLabel(name: string): string {
  return /^(Kota|Kabupaten)\s/i.test(name) ? name : `Kabupaten ${name}`;
}

/** Backend order follows regency id, which interleaves the Kabupaten and Kota blocks. */
export function byRegionName<T extends { name: string }>(a: T, b: T): number {
  return a.name.localeCompare(b.name, "id-ID");
}

export async function getCatalog(): Promise<Catalog> {
  const response = await fetchBackend("/api/v1/geography/catalog", { next: { revalidate: 3600 }, signal: AbortSignal.timeout(15_000) });
  if (!response.ok) throw new Error("Metadata wilayah gagal dimuat.");
  const catalog: Catalog = await response.json();
  if (!catalog || !Array.isArray(catalog.regencies) || !catalog.regencies.length || !Array.isArray(catalog.districts) || !catalog.districts.length) throw new Error("Katalog wilayah tidak valid.");
  const parents = new Set(catalog.regencies.map((row) => row.id));
  if (parents.size !== catalog.regencies.length || new Set(catalog.districts.map((row) => row.id)).size !== catalog.districts.length) throw new Error("ID wilayah berulang.");
  for (const row of [...catalog.regencies, ...catalog.districts]) {
    if (!Number.isSafeInteger(row.id) || row.id < 1 || typeof row.name !== "string") throw new Error("Metadata wilayah tidak valid.");
    if ("regency_id" in row && !parents.has(row.regency_id as number)) throw new Error("Induk kecamatan tidak valid.");
  }
  return catalog;
}
