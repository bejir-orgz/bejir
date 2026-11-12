import assert from "node:assert/strict";
import test from "node:test";
import "../../lib/api/test-setup.mjs";
const { emptyAnalysisData, getAnalysisData } = await import("./analysis-api.ts");

test("regency totals join by district ID, preserve zero and retain unknown coverage", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (input) => {
    const url = new URL(input);
    if (url.pathname.includes("/geography/")) return Response.json([
      { id: 4, name: "Bogor" }, { id: 14, name: "Kota Bogor" }, { id: 1, name: "Bandung" },
    ]);
    if (url.pathname.endsWith("/population-exposures")) return Response.json([
      { district_id: 545, penduduk_est: 0 }, { district_id: 109, penduduk_est: 100 },
      { district_id: 110, penduduk_est: 250 },
    ]);
    const hazards = {
      4: [{ district_id: 109, luas_km2: 2.25 }, { district_id: 110, luas_km2: 3.5 }],
      14: [{ district_id: 545, luas_km2: 0 }],
      1: [{ district_id: 557, luas_km2: null }],
    };
    return Response.json(hazards[url.searchParams.get("regency_id")]);
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
    await assert.rejects(getAnalysisData(), /gagal dimuat/);
    assert.equal(emptyAnalysisData("Gagal").error, "Gagal");
    assert.deepEqual(emptyAnalysisData("Gagal").rows, []);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
