import { fetchBackend } from "../../lib/api/backend";
import { readPrepared } from "./prepared-data";
import type { AdministrativeCatalog } from "../../lib/api/schemas";

export type Catalog = AdministrativeCatalog;

export async function getCatalog(): Promise<Catalog> {
  let catalog: Catalog;
  try { catalog = await readPrepared<Catalog>("catalog"); }
  catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
    const response = await fetchBackend("/api/v1/geography/catalog", { next: { revalidate: 3600 }, signal: AbortSignal.timeout(15_000) });
    if (!response.ok) throw new Error("Metadata wilayah ringan belum tersedia. Siapkan data olahan atau perbarui backend.");
    catalog = await response.json();
  }
  if (!Array.isArray(catalog.regencies) || !catalog.regencies.length || !Array.isArray(catalog.districts) || !catalog.districts.length) throw new Error("Katalog wilayah tidak valid.");
  const parents = new Set(catalog.regencies.map((row) => row.id));
  if (parents.size !== catalog.regencies.length || new Set(catalog.districts.map((row) => row.id)).size !== catalog.districts.length) throw new Error("ID wilayah berulang.");
  for (const row of [...catalog.regencies, ...catalog.districts]) {
    if (!Number.isSafeInteger(row.id) || row.id < 1 || typeof row.name !== "string") throw new Error("Metadata wilayah tidak valid.");
    if ("regency_id" in row && !parents.has(row.regency_id as number)) throw new Error("Induk kecamatan tidak valid.");
  }
  return catalog;
}
