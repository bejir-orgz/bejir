import "../../lib/api/test-setup.mjs";
import assert from "node:assert/strict";
import test from "node:test";
import { mkdtemp, writeFile, unlink, rmdir } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
const { getFacilityTotals, sumFacilityGroups } = await import("./facilities.ts");

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
    return Response.json({ overall: { schools_damaged: 3, health_facilities_damaged: 0, religious_facilities_damaged: 3 }, by_regency: [{ schools_damaged: 3 }] });
  };
  try {
    assert.deepEqual(await getFacilityTotals([14, 4, 14], "2010-01-01", "2010-12-31"), { health: 0, education: 3, worship: 3, public: null, data_kind: "historical_damage" });
    assert.equal(calls, 1);
    globalThis.fetch = async () => new Response(null, { status: 503 });
    await assert.rejects(getFacilityTotals([]));
  } finally { globalThis.fetch = original; }
});

test("impacts reject malformed counts and keep the province scope unfiltered", async () => {
  const original = globalThis.fetch;
  try {
    const valid = { health_facilities_damaged: 0, schools_damaged: 0, religious_facilities_damaged: 0 };
    for (const overall of [undefined, {}, { ...valid, health_facilities_damaged: -1 }, { ...valid, schools_damaged: "3" }]) {
      globalThis.fetch = async (input) => {
        assert.equal(new URL(input).search, "");
        return Response.json({ overall });
      };
      await assert.rejects(getFacilityTotals([]), /Respons fasilitas/);
    }
    globalThis.fetch = async () => Response.json({ overall: { health_facilities_damaged: 0, schools_damaged: 0, religious_facilities_damaged: 0 }, by_regency: [] });
    assert.equal((await getFacilityTotals([])).education, 0);
  } finally { globalThis.fetch = original; }
});

test("legacy deployment reads a dated projection and preserves scope, zero and unknown counts", async () => {
  const original = globalThis.fetch, previous = process.env.BEJIR_PREPARED_DATA_DIR;
  const directory = await mkdtemp(join(tmpdir(), "bejir-facilities-"));
  process.env.BEJIR_PREPARED_DATA_DIR = directory;
  const groups = [
    { regency_id: 14, date: "2010-06-01", health: 0, education: 3, worship: 1 },
    { regency_id: 14, date: "2010-06-02", health: null, education: 0, worship: 2 },
    { regency_id: 4, date: "2025-01-01", health: 5, education: 10, worship: 4 },
  ];
  await writeFile(join(directory, "facilities.json"), JSON.stringify({ source: process.env.BEJIR_API_URL || "http://80.43.0.180:8000", prepared_at: "2026-11-13T00:00:00Z", data_kind: "historical_damage", groups }));
  globalThis.fetch = async (input) => { assert.match(input, /flood\/impacts/); return new Response(null, { status: 404 }); };
  try {
    const data = await getFacilityTotals([14, 14], "2010-01-01", "2010-12-31");
    assert.equal(data.health, null); assert.equal(data.education, 3); assert.equal(data.worship, 3);
    assert.equal(data.prepared_at, "2026-11-13T00:00:00Z");
    assert.equal(sumFacilityGroups(groups, [999], "", "").education, 0);
    assert.equal(sumFacilityGroups(groups, [14], "2010-06-01", "2010-06-01").health, 0);
    assert.throws(() => sumFacilityGroups([{ ...groups[0], health: -1 }], [], "", ""));
  } finally {
    globalThis.fetch = original;
    if (previous === undefined) delete process.env.BEJIR_PREPARED_DATA_DIR; else process.env.BEJIR_PREPARED_DATA_DIR = previous;
    await unlink(join(directory, "facilities.json")); await rmdir(directory);
  }
});
