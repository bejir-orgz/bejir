import { yearOverYear } from "../../lib/year-over-year";
import { subYears, format, parseISO } from "date-fns";
import { getRiverSummary } from "../rivers/api";
import { getFloodStatistics } from "../floods/api";
import type { WorkspaceData } from "./types";
import { getOverviewDateRange } from "./timeline";
import { classLabels, dominantClass, selectedHazards, weightedMean, nullableSum } from "../geography/spatial-data";

export function emptyOverview(message = "Memuat data backend…"): WorkspaceData["overview"] {
  return {
    metrics: [
      { id: "floods", label: "Total Kejadian Banjir", value: "—", change: "—", trend: "increase" },
      { id: "housesFlooded", label: "Rumah Terpendam", value: "—", change: "—", trend: "increase" },
      { id: "rainfall", label: "Curah Hujan Tahunan", value: "—", change: "—", trend: "increase" },
      { id: "population", label: "Penduduk Terdampak", value: "—", change: "—", trend: "decrease" },
    ],
    summary: message,
    susceptibility: {
      label: "—", colors: ["#3CFF00", "#E1FF00", "#FFD000", "#FF6A00", "#FF0000"],
      notes: ["Kelas 1–5 menyatakan Sangat Rendah–Sangat Tinggi.", "Kelas wilayah memakai modus kelas dominan kecamatan berbobot n_piksel.", "Fasilitas menghitung akumulasi kerusakan historis dan dapat mencakup fasilitas yang sama berulang kali.", "Periode spasial belum tersedia."],
    },
    facilities: [
      { id: "health", label: "Fasilitas Kesehatan", count: null },
      { id: "education", label: "Fasilitas Pendidikan", count: null },
      { id: "worship", label: "Tempat Ibadah", count: null },
      { id: "bridges", label: "Jembatan", count: null },
    ],
    landCover: ["—"], elevation: "—", rivers: "—",
  };
}

export async function getWorkspaceOverview(regionIds: string[], from: string, to: string) {
  const period = getOverviewDateRange(from, to);
  const overview = emptyOverview();
  const spatial = selectedHazards(regionIds);
  const supported = regionIds.every((id) => /^\d+$/.test(id));
  const scope = `${period.from} s.d. ${period.to}`;
  const ids = [...new Set(regionIds)];
  const readStatistics = (range: { from: string; to: string }) => supported ? Promise.all((ids.length ? ids : [""]).map((id) => {
    const query = new URLSearchParams();
    if (id) query.set("regency_id", id);
    query.set("start_date", `${range.from}T00:00:00`);
    query.set("end_date", `${range.to}T23:59:59.999999`);
    return getFloodStatistics(query.toString());
  })) : Promise.resolve([]);
  const previousPeriod = {
    from: format(subYears(parseISO(period.from), 1), "yyyy-MM-dd"),
    to: format(subYears(parseISO(period.to), 1), "yyyy-MM-dd"),
  };
  const [spatialResult, historyResult, riversResult, previousResult] = await Promise.allSettled([
    spatial, readStatistics(period), getRiverSummary(regionIds), readStatistics(previousPeriod),
  ]);
  if (riversResult.status === "fulfilled" && riversResult.value.total !== null) overview.rivers = `${riversResult.value.total.toLocaleString("id-ID")} segmen`;
  const records = spatialResult.status === "fulfilled" ? spatialResult.value : [];
  const statistics = historyResult.status === "fulfilled" ? historyResult.value : [];
  overview.errors = [
    ...(spatialResult.status === "rejected" ? ["Parameter spasial gagal dimuat."] : []),
    ...(historyResult.status === "rejected" ? ["Ringkasan Flood gagal dimuat."] : []),
  ];
  if (supported && historyResult.status === "fulfilled") {
    const total = statistics.reduce((sum, row) => sum + row.summary.total_events, 0);
    overview.metrics[0].value = total.toLocaleString("id-ID");
    const previous = previousResult.status === "fulfilled" ? previousResult.value : null;
    Object.assign(overview.metrics[0], yearOverYear(total, previous?.reduce((sum, row) => sum + row.summary.total_events, 0)));
    const houses = statistics.map((row) => row.impacts.houses_flooded);
    if (houses.every((value) => value != null)) {
      overview.metrics[1].value = houses.reduce<number>((sum, value) => sum + (value ?? 0), 0).toLocaleString("id-ID") + " unit";
      Object.assign(overview.metrics[1], yearOverYear(nullableSum(houses.map((value) => value ?? null)), previous ? nullableSum(previous.map((row) => row.impacts.houses_flooded ?? null)) : null));
    }
    const affected = statistics.map((row) => row.impacts.affected_displaced);
    if (affected.every((value) => value !== null)) {
      overview.metrics[3].value = affected.reduce<number>((sum, value) => sum + (value ?? 0), 0).toLocaleString("id-ID") + " jiwa";
      Object.assign(overview.metrics[3], yearOverYear(nullableSum(affected), previous ? nullableSum(previous.map((row) => row.impacts.affected_displaced)) : null));
    }
    overview.summary = `${total.toLocaleString("id-ID")} kejadian tercatat untuk ${scope}. Penduduk terdampak/mengungsi merupakan akumulasi catatan kejadian dan dapat mencakup orang yang sama.`;
  } else if (supported) {
    overview.summary = "Ringkasan Flood gagal dimuat. Parameter spasial tetap tersedia jika berhasil dimuat.";
  } else {
    overview.summary = "Filter histori tersedia pada tingkat kabupaten/kota. Statistik kecamatan atau desa/kelurahan belum tersedia pada API Flood.";
  }
  if (previousResult.status === "rejected") overview.summary += " Perbandingan tahun sebelumnya gagal dimuat.";
  if (spatialResult.status === "rejected") overview.summary += " Parameter spasial gagal dimuat.";
  const classification = dominantClass(records);
  overview.susceptibility.label = classification === null ? "—" : classLabels[classification - 1];
  const cover = [...new Set(records.map((row) => row.landcover_dominan).filter((value): value is string => Boolean(value)))];
  overview.landCover = cover.length ? cover.sort((a, b) => a.localeCompare(b, "id-ID")) : ["—"];
  const elevation = weightedMean(records, "mean_elevasi_m");
  if (elevation !== null) overview.elevation = elevation.toLocaleString("id-ID", { maximumFractionDigits: 1 }) + " meter";
  const rainfall = records.length === 1 ? records[0].mean_hujan_mm : null;
  if (rainfall != null) overview.susceptibility.notes.push(`Parameter rata-rata hujan kecamatan ${rainfall.toLocaleString("id-ID", { maximumFractionDigits: 1 })} mm. Periode belum tersedia.`);
  else if (records.some((row) => row.mean_hujan_mm == null)) overview.susceptibility.notes.push(`${records.filter((row) => row.mean_hujan_mm == null).length} kecamatan memiliki parameter hujan kosong.`);
  overview.susceptibility.notes.push("Jumlah sungai menghitung rekaman segmen API yang berpotongan dengan wilayah, bukan sungai bernama unik. Segmen lintas kecamatan dihitung satu kali dalam cakupan pilihan.");
  if (riversResult.status === "fulfilled") overview.susceptibility.notes.push(`Data sungai disiapkan ${new Date(riversResult.value.prepared_at).toLocaleDateString("id-ID", { timeZone: "Asia/Jakarta" })}.`);
  if (riversResult.status === "rejected") overview.errors?.push("Ringkasan sungai gagal dimuat.");
  return overview;
}
