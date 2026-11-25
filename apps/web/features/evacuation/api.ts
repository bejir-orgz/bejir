import type { EvacuationSite } from "./types";
import { fetchBackend } from "../../lib/api/backend";

interface SitesPage {
  items: EvacuationSite[];
  total: number;
}

export async function getEvacuationSites(signal?: AbortSignal): Promise<EvacuationSite[]> {
  async function readPage(offset: number): Promise<SitesPage> {
    const response = await fetchBackend(`/api/v1/evacuation/sites?limit=1000&offset=${offset}`, {
      next: { revalidate: 300 },
      signal: signal ? AbortSignal.any([signal, AbortSignal.timeout(20_000)]) : AbortSignal.timeout(20_000),
    });
    if (!response.ok) throw new Error("Titik evakuasi gagal dimuat.");
    const page: SitesPage = await response.json();
    if (!Array.isArray(page.items) || !Number.isSafeInteger(page.total) || page.total < 0) {
      throw new Error("Respons titik evakuasi tidak valid.");
    }
    for (const site of page.items) {
      if (!Number.isSafeInteger(site.id) || site.id < 1 ||
          (site.district_id != null && (!Number.isSafeInteger(site.district_id) || site.district_id < 1)) ||
          (site.name != null && typeof site.name !== "string") ||
          (site.category != null && typeof site.category !== "string") ||
          !Number.isFinite(site.latitude) || Math.abs(site.latitude) > 90 ||
          !Number.isFinite(site.longitude) || Math.abs(site.longitude) > 180) {
        throw new Error("Titik evakuasi tidak valid.");
      }
    }
    return page;
  }

  const first = await readPage(0);
  const items = [...first.items];
  for (let offset = 1000; offset < first.total; offset += 6000) {
    const offsets = Array.from({ length: Math.min(6, Math.ceil((first.total - offset) / 1000)) }, (_, index) => offset + index * 1000);
    const pages = await Promise.all(offsets.map(readPage));
    for (const page of pages) {
      if (page.total !== first.total) throw new Error("Daftar titik evakuasi berubah. Coba lagi.");
      items.push(...page.items);
    }
  }
  if (items.length !== first.total || new Set(items.map((site) => site.id)).size !== first.total) {
    throw new Error("Daftar titik evakuasi belum lengkap.");
  }
  return items;
}
