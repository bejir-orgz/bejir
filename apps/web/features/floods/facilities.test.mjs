import "../../lib/api/test-setup.mjs";
import assert from "node:assert/strict";
import test from "node:test";
const { getFacilityTotals } = await import("./facilities.ts");

test("facilities use one aggregate request with canonical scope and never load event details", async () => {
  const original = globalThis.fetch;
  let calls = 0;
  globalThis.fetch = async (input) => {
    calls++;
    const url = new URL(input);
    assert.equal(url.pathname, "/api/v1/flood/impacts");
    assert.deepEqual(url.searchParams.getAll("regency_id"), ["4", "14"]);
    assert.equal(url.searchParams.get("start_date"), "2010-01-01T00:00:00");
    assert.equal(url.searchParams.get("end_date"), "2010-12-31T23:59:59.999999");
    return Response.json({ overall: { schools_damaged: 3, health_facilities_damaged: 0, religious_facilities_damaged: 3, bridges_damaged: 7 }, by_regency: [{ schools_damaged: 3 }] });
  };
  try {
    assert.deepEqual(await getFacilityTotals([14, 4, 14], "2010-01-01", "2010-12-31"), { health: 0, education: 3, worship: 3, bridges: 7, public: null, data_kind: "historical_damage" });
    assert.equal(calls, 1);
    globalThis.fetch = async () => new Response(null, { status: 503 });
    await assert.rejects(getFacilityTotals([]));
  } finally { globalThis.fetch = original; }
});

test("impacts reject malformed counts and keep the province scope unfiltered", async () => {
  const original = globalThis.fetch;
  try {
    const valid = { health_facilities_damaged: 0, schools_damaged: 0, religious_facilities_damaged: 0, bridges_damaged: 0 };
    for (const overall of [undefined, {}, { ...valid, health_facilities_damaged: -1 }, { ...valid, schools_damaged: "3" }, { ...valid, bridges_damaged: -1 }, { ...valid, bridges_damaged: undefined }]) {
      globalThis.fetch = async (input) => {
        assert.equal(new URL(input).search, "");
        return Response.json({ overall });
      };
      await assert.rejects(getFacilityTotals([]), /Respons fasilitas/);
    }
    globalThis.fetch = async () => Response.json({ overall: { health_facilities_damaged: 0, schools_damaged: 0, religious_facilities_damaged: 0, bridges_damaged: 0 }, by_regency: [] });
    assert.equal((await getFacilityTotals([])).bridges, 0);
  } finally { globalThis.fetch = original; }
});

test("unavailable aggregates fail without falling back to saved facility data", async () => {
  const original = globalThis.fetch;
  try {
    for (const status of [404, 501, 503]) {
      globalThis.fetch = async () => new Response(null, { status });
      await assert.rejects(getFacilityTotals([]), /gagal dimuat/);
    }
  } finally { globalThis.fetch = original; }
});
