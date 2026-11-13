import { resolve } from "node:path";
process.env.BEJIR_PREPARED_DATA_DIR = resolve(import.meta.dirname, "missing-prepared");
import "../../lib/api/test-setup.mjs";
import assert from "node:assert/strict";
import test from "node:test";
const { getWorkspaceOverview } = await import("./overview-api.ts");
const { getAnalysisSummary } = await import("./analysis-api.ts");

test("overview scopes history by regency and date and preserves explicit zero", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (input) => {
    if (input.includes("geography/catalog")) return Response.json({ regencies: [{ id: 14, name: "Kota Bogor" }], districts: [{ id: 545, name: "Tanah Sareal", regency_id: 14 }] });
    if (input.includes("district-hazards")) return Response.json([{ district_id: 545, n_piksel: null, kelas_dominan_v2: null }]);
    const query = new URL(input).searchParams;
    assert.equal(query.get("regency_id"), "14");
    assert.equal(query.get("start_date"), "2026-01-01T00:00:00");
    assert.equal(query.get("end_date"), "2026-01-31T23:59:59.999999");
    return Response.json({ summary: { total_events: 0 }, impacts: { affected_displaced: 0 }, by_year: [], by_regency: [] });
  };
  try {
    const result = await getWorkspaceOverview(["14"], "2026-01-01", "2026-01-31");
    assert.equal(result.metrics[0].value, "0");
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
    return Response.json([{ district_id: 545, n_piksel: 100, kelas_dominan_v2: 4, landcover_dominan: "Pemukiman", mean_elevasi_m: 265, mean_hujan_mm: 3000 }]);
  };
  try {
    const result = await getWorkspaceOverview(["14/545"], "", "");
    assert.equal(result.metrics[0].value, "—");
    assert.equal(result.elevation, "265 meter");
    assert.deepEqual(result.landCover, ["Pemukiman"]);
    assert.equal(result.metrics[2].value, "—");
    assert.match(result.susceptibility.notes.at(-1), /Periode belum tersedia/);
  } finally { globalThis.fetch = originalFetch; }
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
      summary: { total_events: previous ? 20 : 24 }, impacts: { affected_displaced: 100 },
      by_regency: [{ regency_id: 14, regency_name: "Kota Bogor", total_events: 24 }],
      by_year: [{ year: 2025, total_events: 20 }, { year: 2026, total_events: 24 }],
    });
  };
  try {
    const result = await getAnalysisSummary(2026, [14, 14]);
    assert.equal(calls, 3);
    assert.equal(result.metrics[0].value, "24");
    assert.equal(result.metrics[3].value, "2");
    assert.equal(result.metrics[2].change, "Akumulasi terdampak/mengungsi");
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
    summary: { total_events: 2 }, impacts: { affected_displaced: 0 }, by_year: [{ year: 2026, total_events: 2 }], by_regency: [],
  });
  try {
    const snapshot = await getAnalysisSummary(2026, [], [{ district_id: 1, n_piksel: 10, kelas_dominan_v2: 4 }]);
    assert.equal(snapshot.metrics[0].value, "2");
    assert.equal(snapshot.errors.length, 1);
    assert.match(snapshot.errors[0], /Perbandingan/);
  } finally { globalThis.fetch = original; }
});
