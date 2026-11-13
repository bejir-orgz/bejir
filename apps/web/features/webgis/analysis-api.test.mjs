import { resolve } from "node:path";
process.env.BEJIR_PREPARED_DATA_DIR = resolve(import.meta.dirname, "missing-prepared");
import assert from "node:assert/strict";
import test from "node:test";
import "../../lib/api/test-setup.mjs";
const { emptyAnalysisData, getAnalysisData } = await import("./analysis-api.ts");

test("regency totals join by district ID, preserve zero and retain unknown coverage", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (input) => {
    const url = new URL(input);
    if (url.pathname.endsWith("/catalog")) return Response.json({ regencies: [
      { id: 4, name: "Bogor" }, { id: 14, name: "Kota Bogor" }, { id: 1, name: "Bandung" },
    ], districts: [
      { id: 109, name: "A", regency_id: 4 }, { id: 110, name: "B", regency_id: 4 },
      { id: 545, name: "C", regency_id: 14 }, { id: 557, name: "D", regency_id: 1 },
    ] });
    if (url.pathname.endsWith("/population-exposures")) return Response.json([
      { district_id: 545, penduduk_est: 0 }, { district_id: 109, penduduk_est: 100 },
      { district_id: 110, penduduk_est: 250 },
    ]);
    const hazards = {
      4: [{ district_id: 109, luas_km2: 2.25 }, { district_id: 110, luas_km2: 3.5 }],
      14: [{ district_id: 545, luas_km2: 0 }],
      1: [{ district_id: 557, luas_km2: null }],
    };
    if (url.pathname.endsWith("/district-hazards")) return Response.json(Object.values(hazards).flat());
    return new Response(null, { status: 503 });
  };
  try {
    const data = await getAnalysisData();
    assert.equal(data.rows.length, 3);
    assert.equal(data.rows[0].region, "Kabupaten Bogor");
    assert.equal(data.rows[0].population, 350);
    assert.equal(data.rows[0].areaKm2, 5.75);
    assert.equal(data.rows[1].region, "Kota Bogor");
    assert.equal(data.rows[1].population, 0);
    assert.equal(data.rows[1].areaKm2, 0);
    assert.equal(data.rows[2].population, null);
    assert.equal(data.rows[2].areaKm2, null);
    assert.equal(data.rows[0].susceptibility, null);
    assert.equal(data.rows[0].elevationM, null);
    assert.equal(data.rows[0].year, null);
    assert.deepEqual(data.years, []);
    assert.equal(data.snapshots[0].metrics[2].value, "—");
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("failed upstream requests never produce a successful empty dataset", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => new Response(null, { status: 503 });
  try {
    const result = await getAnalysisData();
    assert.deepEqual(result.rows, []);
    assert.match(result.error, /gagal dimuat/);
    assert.equal(emptyAnalysisData("Gagal").error, "Gagal");
    assert.deepEqual(emptyAnalysisData("Gagal").rows, []);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("a failed population source preserves hazard rows and reuses global statistics", async () => {
  const original = globalThis.fetch;
  const paths = [];
  globalThis.fetch = async (input) => {
    const url = new URL(input); paths.push(url.pathname);
    if (url.pathname.endsWith("/catalog")) return Response.json({ regencies: [{ id: 14, name: "Kota Bogor" }], districts: [{ id: 545, name: "Tanah Sareal", regency_id: 14 }] });
    if (url.pathname.endsWith("/district-hazards")) return Response.json([{ district_id: 545, n_piksel: 100, luas_km2: 2, mean_elevasi_m: 20, kelas_dominan_v2: 4 }]);
    if (url.pathname.endsWith("/population-exposures")) return new Response(null, { status: 503 });
    assert.ok(url.pathname.endsWith("/statistics"));
    return Response.json({ summary: { total_events: 1 }, impacts: { affected_displaced: 10 }, by_year: [{ year: 2026, total_events: 1 }], by_regency: [{ regency_id: 14, regency_name: "Kota Bogor", total_events: 1 }] });
  };
  try {
    const data = await getAnalysisData();
    assert.equal(data.rows[0].population, null);
    assert.equal(data.rows[0].areaKm2, 2);
    assert.equal(data.rows[0].elevationM, 20);
    assert.equal(data.rows[0].susceptibility, "Tinggi");
    assert.match(data.error, /penduduk/);
    assert.equal(data.snapshots[2026].metrics[0].value, "1");
    assert.equal(paths.filter((path) => path.endsWith("/statistics")).length, 3);
    assert.equal(paths.filter((path) => path.endsWith("/district-hazards")).length, 1);
    assert.ok(!paths.some((path) => /events|facilities|geography\/regencies/.test(path)));
  } finally { globalThis.fetch = original; }
});

test("a failed hazard source is not requested again while assembling the summary", async () => {
  const original = globalThis.fetch;
  let hazards = 0;
  globalThis.fetch = async (input) => {
    if (input.includes("/catalog")) return Response.json({ regencies: [{ id: 14, name: "Kota Bogor" }], districts: [{ id: 545, name: "Tanah Sareal", regency_id: 14 }] });
    if (input.includes("/district-hazards")) { hazards++; return new Response(null, { status: 503 }); }
    if (input.includes("/population-exposures")) return Response.json([{ district_id: 545, penduduk_est: 100 }]);
    return Response.json({ summary: { total_events: 1 }, impacts: { affected_displaced: 0 }, by_year: [{ year: 2026, total_events: 1 }], by_regency: [] });
  };
  try {
    const data = await getAnalysisData();
    assert.equal(hazards, 1);
    assert.equal(data.rows[0].population, 100);
    assert.equal(data.rows[0].areaKm2, null);
    assert.equal(data.snapshots[2026].metrics[0].value, "1");
    assert.equal(data.snapshots[2026].distribution[0].value, null);
  } finally { globalThis.fetch = original; }
});
