import { fetchBackend } from "../../lib/api/backend";
import type { WorkspaceData } from "./types";

interface Statistics {
  summary: { total_events: number };
  impacts: { affected_displaced: number | null };
}

interface Hazard {
  landcover_dominan: string | null;
  mean_elevasi_m: number | null;
  mean_hujan_mm: number | null;
}

export function emptyOverview(message = "Memuat data backend…"): WorkspaceData["overview"] {
  return {
    metrics: [
      { id: "floods", label: "Total Kejadian Banjir", value: "—", change: "—", trend: "increase" },
      { id: "area", label: "Area Terdampak", value: "—", change: "—", trend: "increase" },
      { id: "rainfall", label: "Curah Hujan Tahunan", value: "—", change: "—", trend: "increase" },
      { id: "population", label: "Penduduk Terdampak", value: "—", change: "—", trend: "decrease" },
    ],
    summary: message,
    susceptibility: {
      label: "—", colors: ["#3CFF00", "#E1FF00", "#FFD000", "#FF6A00", "#FF0000"],
      notes: ["Kerawanan tersedia per kecamatan.", "Kelas agregat dan periode spasial belum ditetapkan.", "Paparan dan simulasi tidak menyatakan kejadian banjir historis."],
    },
    facilities: [
      { id: "health", label: "Fasilitas Kesehatan", count: null },
      { id: "education", label: "Fasilitas Pendidikan", count: null },
      { id: "public", label: "Fasilitas Umum", count: null },
      { id: "worship", label: "Tempat Ibadah", count: null },
    ],
    landCover: ["—"], elevation: "—", rivers: "—",
  };
}

export async function getWorkspaceOverview(regionIds: string[], from: string, to: string) {
  const overview = emptyOverview();
  const supported = regionIds.every((id) => /^\d+$/.test(id));
  const scope = from ? `${from} s.d. ${to || from}` : "seluruh periode histori";
  if (supported) {
    const ids = [...new Set(regionIds)];
    const statistics = await Promise.all((ids.length ? ids : [""]).map(async (id) => {
      const query = new URLSearchParams();
      if (id) query.set("regency_id", id);
      if (from) { query.set("start_date", `${from}T00:00:00`); query.set("end_date", `${to || from}T23:59:59.999999`); }
      const response = await fetchBackend(`/api/v1/flood/statistics?${query}`, { next: { revalidate: 300 } });
      if (!response.ok) throw new Error("Ringkasan banjir gagal dimuat.");
      return response.json() as Promise<Statistics>;
    }));
    const total = statistics.reduce((sum, row) => sum + row.summary.total_events, 0);
    overview.metrics[0].value = total.toLocaleString("id-ID");
    overview.metrics[0].change = scope;
    const affected = statistics.map((row) => row.impacts.affected_displaced);
    if (affected.every((value) => value !== null)) {
      overview.metrics[3].value = affected.reduce<number>((sum, value) => sum + (value ?? 0), 0).toLocaleString("id-ID") + " jiwa";
      overview.metrics[3].change = "Akumulasi terdampak/mengungsi";
    }
    overview.summary = `${total.toLocaleString("id-ID")} kejadian tercatat untuk ${scope}. Penduduk terdampak/mengungsi merupakan akumulasi catatan kejadian dan dapat mencakup orang yang sama.`;
  } else {
    overview.summary = "Filter histori tersedia pada tingkat kabupaten/kota. Statistik kecamatan atau desa/kelurahan belum tersedia pada API Flood.";
  }
  if (regionIds.length === 1 && /^\d+\/\d+$/.test(regionIds[0])) {
    const districtId = regionIds[0].split("/")[1];
    const response = await fetchBackend(`/api/v1/spatial-analysis/district-hazards/district/${districtId}`, { next: { revalidate: 300 } });
    if (response.ok) {
      const hazard: Hazard = await response.json();
      overview.landCover = [hazard.landcover_dominan || "—"];
      if (hazard.mean_elevasi_m !== null) overview.elevation = hazard.mean_elevasi_m.toLocaleString("id-ID", { maximumFractionDigits: 1 }) + " meter";
      if (hazard.mean_hujan_mm !== null) overview.susceptibility.notes.push(`Parameter rata-rata hujan ${hazard.mean_hujan_mm.toLocaleString("id-ID", { maximumFractionDigits: 1 })} mm. Periode belum tersedia.`);
    }
  }
  return overview;
}
