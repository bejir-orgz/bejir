import { yearOverYear } from "../../lib/year-over-year";
import { subYears, format, parseISO } from "date-fns";
import { getRiverSummary } from "../rivers/api";
import { getFloodStatistics } from "../floods/api";
import type { WorkspaceData } from "./types";
import { clampPeriodToToday, getCurrentTimelineDate, getOverviewDateRange, formatOverviewPeriodLabel } from "./timeline";
import { classLabels, dominantClass, selectedHazards, weightedMean, nullableSum } from "../geography/spatial-data";

export function emptyOverview(message = "Memuat data backend…"): WorkspaceData["overview"] {
  return {
    metrics: [
      { id: "floods", label: "Total Kejadian Banjir", value: "—", change: "—", trend: "increase" },
      { id: "housesFlooded", label: "Rumah Terpendam", value: "—", change: "—", trend: "increase" },
      { id: "fatalities", label: "Korban Meninggal", value: "—", change: "—", trend: "increase" },
      { id: "population", label: "Penduduk Terdampak", value: "—", change: "—", trend: "decrease" },
    ],
    summary: message,
    susceptibility: {
      label: "—",
      colors: ["#3CFF00", "#E1FF00", "#FFD000", "#FF6A00", "#FF0000"],
      notes: ["Memuat informasi kerawanan banjir…"],
    },
    facilities: [
      { id: "health", label: "Fasilitas Kesehatan", count: null },
      { id: "education", label: "Fasilitas Pendidikan", count: null },
      { id: "worship", label: "Tempat Ibadah", count: null },
      { id: "bridges", label: "Jembatan", count: null },
    ],
    landCover: ["—"],
    elevation: "—",
    rivers: "—",
    period: getOverviewDateRange("", ""),
  };
}

type Period = { from: string; to: string };

const susceptibilityMeaning = [
  "Kondisi wilayah umumnya kurang mendukung terbentuknya genangan. Bagian yang rendah masih bisa tergenang saat hujan deras.",
  "Wilayah ini umumnya kurang rentan, tetapi genangan masih bisa terbentuk di lokasi yang rendah atau datar.",
  "Potensi genangan perlu diperhatikan, terutama di bagian wilayah yang rendah atau datar saat hujan deras.",
  "Wilayah ini lebih rentan tergenang saat hujan deras, terutama di bagian yang rendah atau datar.",
  "Wilayah ini termasuk yang paling rentan terhadap genangan. Bagian yang rendah perlu mendapat perhatian lebih saat hujan deras.",
];

/** by_year honours the date filter, so the newest recorded year needs one undated read. */
async function latestRecordedPeriod(read: (range?: Period) => Promise<{ by_year: { year: number }[] }[]>, currentYear: string): Promise<Period> {
  try {
    const years = (await read()).flatMap((row) => row.by_year.map((entry) => entry.year)).filter((year) => year <= Number(currentYear));
    if (!years.length) return getOverviewDateRange("", "");
    const year = Math.max(...years);
    return { from: `${year}-01-01`, to: `${year}-12-31` };
  } catch {
    return getOverviewDateRange("", "");
  }
}

export async function getWorkspaceOverview(regionIds: string[], from: string, to: string) {
  const overview = emptyOverview();
  const spatial = selectedHazards(regionIds);
  const supported = regionIds.every((id) => /^\d+$/.test(id));
  const ids = [...new Set(regionIds)];
  const readStatistics = (range?: { from: string; to: string }) =>
    supported
      ? Promise.all(
          (ids.length ? ids : [""]).map((id) => {
            const query = new URLSearchParams();
            if (id) query.set("regency_id", id);
            if (range) {
              query.set("start_date", `${range.from}T00:00:00`);
              query.set("end_date", `${range.to}T23:59:59.999999`);
            }
            return getFloodStatistics(query.toString());
          }),
        )
      : Promise.resolve([]);
  const today = getCurrentTimelineDate();
  const currentYear = today.slice(0, 4);
  const period = from || !supported ? getOverviewDateRange(from, to) : await latestRecordedPeriod(readStatistics, currentYear);
  const displayPeriod = clampPeriodToToday(period, today);
  const scope = formatOverviewPeriodLabel(displayPeriod);
  overview.period = displayPeriod;
  const olderPeriod = !from && period.from.slice(0, 4) !== currentYear;
  const previousPeriod = {
    from: format(subYears(parseISO(period.from), 1), "yyyy-MM-dd"),
    to: format(subYears(parseISO(period.to), 1), "yyyy-MM-dd"),
  };
  const [spatialResult, historyResult, riversResult, previousResult] = await Promise.allSettled([
    spatial,
    readStatistics(period),
    getRiverSummary(regionIds),
    readStatistics(previousPeriod),
  ]);
  if (riversResult.status === "fulfilled" && riversResult.value.total !== null) {
    overview.rivers = `${riversResult.value.total.toLocaleString("id-ID")} segmen`;
  }
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
      Object.assign(
        overview.metrics[1],
        yearOverYear(
          nullableSum(houses.map((value) => value ?? null)),
          previous ? nullableSum(previous.map((row) => row.impacts.houses_flooded ?? null)) : null,
        ),
      );
    }
    const fatalities = nullableSum(statistics.map((row) => row.impacts.fatalities ?? null));
    if (fatalities !== null) {
      overview.metrics[2].value = fatalities.toLocaleString("id-ID") + " jiwa";
      Object.assign(
        overview.metrics[2],
        yearOverYear(fatalities, previous ? nullableSum(previous.map((row) => row.impacts.fatalities ?? null)) : null),
      );
    }
    const affected = statistics.map((row) => row.impacts.affected_displaced);
    if (affected.every((value) => value !== null)) {
      overview.metrics[3].value = affected.reduce<number>((sum, value) => sum + (value ?? 0), 0).toLocaleString("id-ID") + " jiwa";
      Object.assign(
        overview.metrics[3],
        yearOverYear(nullableSum(affected), previous ? nullableSum(previous.map((row) => row.impacts.affected_displaced)) : null),
      );
    }
    const fallbackNote = olderPeriod ? ` Tahun ${currentYear} belum memiliki catatan untuk wilayah ini, jadi ringkasan memakai tahun terakhir yang tercatat.` : "";
    overview.summary = `${total.toLocaleString("id-ID")} kejadian tercatat untuk ${scope}.${fallbackNote} Penduduk terdampak/mengungsi merupakan akumulasi catatan kejadian dan dapat mencakup orang yang sama.`;
  } else if (supported) {
    overview.summary = "Ringkasan Flood gagal dimuat. Parameter spasial tetap tersedia jika berhasil dimuat.";
  } else {
    overview.summary = "Filter histori tersedia pada tingkat kabupaten/kota. Statistik kecamatan atau desa/kelurahan belum tersedia pada API Flood.";
  }
  if (previousResult.status === "rejected") overview.summary += " Perbandingan tahun sebelumnya gagal dimuat.";
  if (spatialResult.status === "rejected") overview.summary += " Parameter spasial gagal dimuat.";
  const classification = dominantClass(records);
  if (classification === null) {
    overview.susceptibility.notes = ["Kerawanan banjir untuk wilayah ini belum dapat ditentukan dari data yang tersedia."];
  } else {
    overview.susceptibility.label = classLabels[classification - 1];
    const notes = [susceptibilityMeaning[classification - 1]];
    const formatValue = (value: number) => value.toLocaleString("id-ID", { maximumFractionDigits: 1 });
    const proneArea = weightedMean(records, "pct_rawan_v2");
    if (proneArea !== null && proneArea >= 0 && proneArea <= 100) {
      notes.push(`Hasil pemetaan menunjukkan sekitar ${formatValue(proneArea)}% dari area yang dinilai termasuk area rawan banjir.`);
    }
    const heightAboveDrainage = weightedMean(records, "mean_hand_m");
    const slope = weightedMean(records, "mean_slope_pct");
    if (heightAboveDrainage !== null && heightAboveDrainage >= 0 && slope !== null && slope >= 0) {
      notes.push(`Tanah rata-rata berada ${formatValue(heightAboveDrainage)} m di atas jalur aliran air, dengan kemiringan rata-rata ${formatValue(slope)}%. Air lebih mudah terkumpul di bagian yang rendah dan datar.`);
    }
    overview.susceptibility.notes = notes;
  }
  const cover = [...new Set(records.map((row) => row.landcover_dominan).filter((value): value is string => Boolean(value)))];
  overview.landCover = cover.length ? cover.sort((a, b) => a.localeCompare(b, "id-ID")) : ["—"];
  const elevation = weightedMean(records, "mean_elevasi_m");
  if (elevation !== null) overview.elevation = elevation.toLocaleString("id-ID", { maximumFractionDigits: 1 }) + " meter";
  if (riversResult.status === "rejected") overview.errors?.push("Ringkasan sungai gagal dimuat.");
  return overview;
}
