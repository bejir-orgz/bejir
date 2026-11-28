import { resolve } from "node:path";
process.env.BEJIR_PREPARED_DATA_DIR = resolve(import.meta.dirname, "missing-prepared");
import "../../lib/api/test-setup.mjs";
import assert from "node:assert/strict";
import test from "node:test";
const { getWorkspaceOverview } = await import("./overview-api.ts");
const { getAnalysisSummary } = await import("./analysis-api.ts");

test("Overview fatalities sum distinct regencies, compare the same period and preserve missing data", async () => {
  const original = globalThis.fetch;
  const { getFloodStatistics } = await import("../floods/api.ts");
  let count = 3;
  const calls = [];
  globalThis.fetch = async (input) => {
    const url = new URL(input);
    if (!url.pathname.endsWith("/statistics")) return new Response(null, { status: 503 });
    const start = url.searchParams.get("start_date");
    const region = url.searchParams.get("regency_id");
    calls.push([region, start]);
    return Response.json({ summary: { total_events: 1 }, impacts: { affected_displaced: 0, fatalities: start.startsWith("2025") ? 6 : count }, by_year: [], by_regency: [] });
  };
  try {
    const overview = await getWorkspaceOverview(["4", "14", "4"], "2026-01-01", "2026-01-31");
    assert.equal(calls.length, 4);
    assert.deepEqual(new Set(calls.map(([region]) => region)), new Set(["4", "14"]));
    assert.ok(calls.every(([, start]) => ["2025-01-01T00:00:00", "2026-01-01T00:00:00"].includes(start)));
    assert.equal(overview.metrics[2].label, "Korban Meninggal");
    assert.equal(overview.metrics[2].value, "6 jiwa");
    assert.equal(overview.metrics[2].change, "-50% dari tahun sebelumnya");
    assert.equal(overview.metrics[2].trend, "decrease");
    for (const value of [0, null, undefined]) {
      count = value;
      const result = await getWorkspaceOverview([], "2026-01-01", "2026-01-31");
      assert.equal(result.metrics[2].value, value === 0 ? "0 jiwa" : "—");
    }
    for (const invalid of [-1, 1.5, "7"]) {
      count = invalid;
      await assert.rejects(getFloodStatistics("start_date=2026-01-01"), /tidak valid/);
    }
  } finally { globalThis.fetch = original; }
});

test("initial Overview compares current and previous years without changing region scope", async () => {
  const original = globalThis.fetch;
  const { clampPeriodToToday, getOverviewDateRange } = await import("./timeline.ts");
  const period = getOverviewDateRange("", "");
  const displayPeriod = clampPeriodToToday(period);
  let statistics = 0, probes = 0;
  globalThis.fetch = async (input) => {
    const url = new URL(input);
    if (!url.pathname.endsWith("/statistics")) return new Response(null, { status: 503 });
    assert.equal(url.searchParams.has("regency_id"), false);
    if (!url.searchParams.has("start_date")) {
      probes++;
      return Response.json({ summary: { total_events: 0 }, impacts: { affected_displaced: 0, houses_flooded: 0 }, by_year: [], by_regency: [] });
    }
    statistics++;
    assert.ok([`${period.from}T00:00:00`, `${Number(period.from.slice(0, 4)) - 1}-01-01T00:00:00`].includes(url.searchParams.get("start_date")));
    assert.ok([`${period.to}T23:59:59.999999`, `${Number(period.to.slice(0, 4)) - 1}-12-31T23:59:59.999999`].includes(url.searchParams.get("end_date")));
    return Response.json({ summary: { total_events: 0 }, impacts: { affected_displaced: 0, houses_flooded: 0 }, by_year: [], by_regency: [] });
  };
  try {
    const overview = await getWorkspaceOverview([], "", "");
    assert.equal(probes, 1);
    assert.equal(statistics, 2);
    assert.equal(overview.metrics[1].value, "0 unit");
    assert.ok(!overview.summary.includes("tahun terakhir yang tercatat"));
    const readable = (iso) => new Intl.DateTimeFormat("id-ID", { dateStyle: "long" }).format(new Date(`${iso}T00:00:00`));
    assert.ok(overview.summary.includes(`${readable(displayPeriod.from)} s.d. ${readable(displayPeriod.to)}`));
    assert.ok(!overview.summary.includes(period.from));
    assert.ok(!overview.summary.includes("seluruh periode"));
  } finally { globalThis.fetch = original; }
});

test("a region with nothing this year falls back to its newest recorded year", async () => {
  const original = globalThis.fetch;
  const { getOverviewDateRange } = await import("./timeline.ts");
  const currentYear = Number(getOverviewDateRange("", "").from.slice(0, 4));
  const recorded = currentYear - 1;
  const windows = [];
  globalThis.fetch = async (input) => {
    const url = new URL(input);
    if (!url.pathname.endsWith("/statistics")) return new Response(null, { status: 503 });
    const start = url.searchParams.get("start_date");
    assert.equal(url.searchParams.get("regency_id"), "11");
    if (!start) return Response.json({ summary: { total_events: 7 }, impacts: { affected_displaced: 0, houses_flooded: 0 }, by_year: [{ year: recorded - 1, total_events: 3 }, { year: recorded, total_events: 7 }], by_regency: [] });
    windows.push(start.slice(0, 4));
    return Response.json({ summary: { total_events: start.startsWith(String(recorded)) ? 7 : 3 }, impacts: { affected_displaced: 0, houses_flooded: 0 }, by_year: [], by_regency: [] });
  };
  try {
    const overview = await getWorkspaceOverview(["11"], "", "");
    assert.deepEqual(windows.sort(), [String(recorded - 1), String(recorded)]);
    assert.equal(overview.metrics[0].value, "7");
    assert.ok(overview.summary.includes(`Tahun ${currentYear} belum memiliki catatan`));
  } finally { globalThis.fetch = original; }
});

test("an explicit date filter is never replaced by the newest recorded year", async () => {
  const original = globalThis.fetch;
  const starts = [];
  globalThis.fetch = async (input) => {
    const url = new URL(input);
    if (!url.pathname.endsWith("/statistics")) return new Response(null, { status: 503 });
    starts.push(url.searchParams.get("start_date"));
    return Response.json({ summary: { total_events: 2 }, impacts: { affected_displaced: 0, houses_flooded: 0 }, by_year: [{ year: 2019, total_events: 9 }], by_regency: [] });
  };
  try {
    const overview = await getWorkspaceOverview(["11"], "2023-03-01", "2023-03-31");
    assert.ok(starts.every((start) => start !== null), "the probe must be skipped when the reader chose a period");
    assert.ok(starts.includes("2023-03-01T00:00:00"));
    assert.ok(!overview.summary.includes("tahun terakhir yang tercatat"));
  } finally { globalThis.fetch = original; }
});

test("flooded houses sum distinct selected regencies and preserve unknown or invalid counts", async () => {
  const original = globalThis.fetch;
  const { getFloodStatistics } = await import("../floods/api.ts");
  try {
    globalThis.fetch = async (input) => {
      const id = new URL(input).searchParams.get("regency_id");
      return Response.json({ summary: { total_events: 1 }, impacts: { affected_displaced: 0, houses_flooded: id === "4" ? 10 : 2 }, by_year: [], by_regency: [] });
    };
    assert.equal((await getAnalysisSummary(2026, [4, 14, 4], [])).metrics[1].value, "12 unit");
    for (const houses of [null, undefined]) {
      globalThis.fetch = async () => Response.json({ summary: { total_events: 1 }, impacts: { affected_displaced: 0, houses_flooded: houses }, by_year: [], by_regency: [] });
      assert.equal((await getAnalysisSummary(2026, [], [])).metrics[1].value, "—");
    }
    for (const houses of [-1, 1.5, "12"]) {
      globalThis.fetch = async () => Response.json({ summary: { total_events: 1 }, impacts: { affected_displaced: 0, houses_flooded: houses }, by_year: [], by_regency: [] });
      await assert.rejects(getFloodStatistics(), /tidak valid/);
    }
  } finally { globalThis.fetch = original; }
});

test("overview scopes history by regency and date and preserves explicit zero", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (input) => {
    if (input.includes("geography/catalog")) return Response.json({ regencies: [{ id: 14, name: "Kota Bogor" }], districts: [{ id: 545, name: "Tanah Sareal", regency_id: 14 }] });
    if (input.includes("district-hazards")) return Response.json([{ district_id: 545, n_piksel: null, kelas_dominan_v2: null }]);
    const query = new URL(input).searchParams;
    assert.equal(query.get("regency_id"), "14");
    assert.ok(["2026-01-01T00:00:00", "2025-01-01T00:00:00"].includes(query.get("start_date")));
    assert.ok(["2026-01-31T23:59:59.999999", "2025-01-31T23:59:59.999999"].includes(query.get("end_date")));
    return Response.json({ summary: { total_events: 0 }, impacts: { affected_displaced: 0, houses_flooded: 0 }, by_year: [], by_regency: [] });
  };
  try {
    const result = await getWorkspaceOverview(["14"], "2026-01-01", "2026-01-31");
    assert.deepEqual(result.facilities.find((row) => row.id === "bridges"), { id: "bridges", label: "Jembatan", count: null });
    assert.equal(result.metrics[0].value, "0");
    assert.equal(result.metrics[1].label, "Rumah Terpendam");
    assert.equal(result.metrics[1].value, "0 unit");
    assert.equal(result.metrics[3].value, "0 jiwa");
    assert.match(result.summary, /akumulasi/);
    assert.equal(result.elevation, "—");
  } finally { globalThis.fetch = originalFetch; }
});

test("district spatial facts keep their source scale and don't substitute for unavailable flood history", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (input) => {
    if (input.includes("geography/catalog")) return Response.json({ regencies: [{ id: 14, name: "Kota Bogor" }], districts: [{ id: 545, name: "Tanah Sareal", regency_id: 14 }] });
    assert.match(input, /district-hazards$/);
    return Response.json([{ district_id: 545, n_piksel: 100, kelas_dominan_v2: 4, landcover_dominan: "Pemukiman", mean_elevasi_m: 265, mean_hujan_mm: 3000, pct_rawan_v2: 63.4, mean_hand_m: 11, mean_slope_pct: 4.2 }]);
  };
  try {
    const result = await getWorkspaceOverview(["14/545"], "", "");
    assert.equal(result.metrics[0].value, "—");
    assert.equal(result.elevation, "265 meter");
    assert.deepEqual(result.landCover, ["Pemukiman"]);
    assert.equal(result.metrics[2].value, "—");
    assert.equal(result.susceptibility.label, "Tinggi");
    assert.match(result.susceptibility.notes.join(" "), /63,4%.*11 m.*4,2%/);
  } finally { globalThis.fetch = originalFetch; }
});

test("overview describes each susceptibility level and omits unavailable local evidence", async (t) => {
  let classification = null;
  t.mock.method(globalThis, "fetch", async (input) => {
    if (input.includes("geography/catalog")) return Response.json({ regencies: [{ id: 14, name: "Kota Bogor" }], districts: [{ id: 545, name: "Tanah Sareal", regency_id: 14 }] });
    if (input.includes("district-hazards")) return Response.json([{ district_id: 545, n_piksel: 100, kelas_dominan_v2: classification }]);
    return new Response(null, { status: 503 });
  });
  const explanations = new Set();
  const levels = ["Sangat Rendah", "Rendah", "Sedang", "Tinggi", "Sangat Tinggi"];
  for (const [index, label] of levels.entries()) {
    classification = index + 1;
    const { susceptibility } = await getWorkspaceOverview(["14/545"], "", "");
    assert.equal(susceptibility.label, label);
    assert.equal(susceptibility.notes.length, 1);
    assert.doesNotMatch(susceptibility.notes[0], /\b(?:n_piksel|modus|API)\b/i);
    explanations.add(susceptibility.notes[0]);
  }
  assert.equal(explanations.size, 5);
  classification = null;
  const { susceptibility } = await getWorkspaceOverview(["14/545"], "", "");
  assert.equal(susceptibility.label, "—");
  assert.match(susceptibility.notes[0], /belum dapat ditentukan/);
});

test("analysis combines scoped counts and keeps impacts distinct from unique population", async () => {
  const originalFetch = globalThis.fetch;
  let calls = 0;
  globalThis.fetch = async (input) => {
    if (input.includes("geography/catalog")) return Response.json({ regencies: [{ id: 14, name: "Kota Bogor" }], districts: [{ id: 545, name: "Tanah Sareal", regency_id: 14 }] });
    if (input.includes("district-hazards")) return Response.json([{ district_id: 545, n_piksel: null, kelas_dominan_v2: null }]);
    if (new URL(input).pathname.endsWith("/events")) return Response.json({ items: [], total: 0 });
    calls++;
    const query = new URL(input).searchParams;
    assert.equal(query.get("regency_id"), "14");
    const previous = query.get("start_date")?.startsWith("2025");
    return Response.json({
      summary: { total_events: previous ? 20 : 24 }, impacts: { affected_displaced: 100, houses_flooded: 12 },
      by_regency: [{ regency_id: 14, regency_name: "Kota Bogor", total_events: 24 }],
      by_year: [{ year: 2025, total_events: 20 }, { year: 2026, total_events: 24 }],
    });
  };
  try {
    const result = await getAnalysisSummary(2026, [14, 14]);
    assert.equal(calls, 3);
    assert.equal(result.metrics[0].value, "24");
    assert.equal(result.metrics[1].label, "Total Rumah Terpendam");
    assert.equal(result.metrics[1].value, "12 unit");
    assert.equal(result.metrics[3].value, "2");
    assert.equal(result.metrics[2].change, "0% dari tahun sebelumnya");
    assert.equal(result.annualEvents.at(-1).events, 24);
    assert.equal(result.distribution[0].value, 0);
  } finally { globalThis.fetch = originalFetch; }
});

test("failed spatial data and comparison preserve successful flood statistics", async () => {
  const original = globalThis.fetch;
  globalThis.fetch = async (input) => {
    assert.ok(!input.includes("/facilities") && !input.includes("/events"));
    if (input.includes("geography/catalog")) return Response.json({ regencies: [{ id: 14, name: "Kota Bogor" }], districts: [{ id: 545, name: "Tanah Sareal", regency_id: 14 }] });
    if (input.includes("district-hazards") || input.includes("2025-01-01")) return new Response(null, { status: 503 });
    return Response.json({ summary: { total_events: 24 }, impacts: { affected_displaced: 100 }, by_regency: [], by_year: [{ year: 2026, total_events: 24 }] });
  };
  try {
    const snapshot = await getAnalysisSummary(2026, [14]);
    assert.equal(snapshot.metrics[0].value, "24");
    assert.equal(snapshot.metrics[1].value, "—");
    assert.equal(snapshot.metrics[0].change, "—");
    assert.equal(snapshot.annualEvents.at(-1).events, 24);
    assert.equal(snapshot.distribution[0].value, null);
    assert.equal(snapshot.errors.length, 2);
    const overview = await getWorkspaceOverview(["14"], "", "");
    assert.equal(overview.metrics[0].value, "24");
    assert.match(overview.summary, /Parameter spasial gagal dimuat/);
  } finally { globalThis.fetch = original; }
});

test("malformed comparison responses do not break successful annual metrics", async () => {
  const original = globalThis.fetch;
  globalThis.fetch = async (input) => input.includes("2025-01-01") ? Response.json([]) : Response.json({
    summary: { total_events: 2 }, impacts: { affected_displaced: 0, houses_flooded: 0 }, by_year: [{ year: 2026, total_events: 2 }], by_regency: [],
  });
  try {
    const snapshot = await getAnalysisSummary(2026, [], [{ district_id: 1, n_piksel: 10, kelas_dominan_v2: 4 }]);
    assert.equal(snapshot.metrics[0].value, "2");
    assert.equal(snapshot.errors.length, 1);
    assert.match(snapshot.errors[0], /Perbandingan/);
  } finally { globalThis.fetch = original; }
});

test("Overview and Analysis compare impacts in the same region and clamp leap-day comparison", async () => {
  const original = globalThis.fetch;
  const dates = [];
  globalThis.fetch = async (input) => {
    const url = new URL(input);
    if (!url.pathname.endsWith("/statistics")) return new Response(null, { status: 503 });
    assert.equal(url.searchParams.get("regency_id"), "14");
    const date = url.searchParams.get("start_date");
    dates.push(date);
    const prior = date?.startsWith("2023");
    return Response.json({ summary: { total_events: prior ? 100 : 39 }, impacts: { houses_flooded: prior ? 200 : 78, affected_displaced: prior ? 300 : 117 }, by_year: [], by_regency: [] });
  };
  try {
    const overview = await getWorkspaceOverview(["14", "14"], "2024-02-29", "2024-02-29");
    assert.deepEqual(dates.sort(), ["2023-02-28T00:00:00", "2024-02-29T00:00:00"]);
    for (const index of [0, 1, 3]) {
      assert.equal(overview.metrics[index].change, "-61% dari tahun sebelumnya");
      assert.equal(overview.metrics[index].trend, "decrease");
    }
    const analysis = await getAnalysisSummary(2024, [14], []);
    for (const metric of analysis.metrics) assert.equal(metric.change, "-61% dari tahun sebelumnya");
  } finally { globalThis.fetch = original; }
});
