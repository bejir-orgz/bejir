import "../../lib/api/test-setup.mjs";
import assert from "node:assert/strict";
import test from "node:test";
const { getWorkspaceOverview } = await import("./overview-api.ts");
const { getAnalysisSummary } = await import("./analysis-api.ts");

test("overview scopes history by regency and date and preserves explicit zero", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (input) => {
    const query = new URL(input).searchParams;
    assert.equal(query.get("regency_id"), "14");
    assert.equal(query.get("start_date"), "2026-01-01T00:00:00");
    assert.equal(query.get("end_date"), "2026-01-31T23:59:59.999999");
    return Response.json({ summary: { total_events: 0 }, impacts: { affected_displaced: 0 } });
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
    assert.match(input, /district-hazards\/district\/545$/);
    return Response.json({ landcover_dominan: "Pemukiman", mean_elevasi_m: 265, mean_hujan_mm: 3000 });
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
    assert.equal(result.distribution[0].value, null);
  } finally { globalThis.fetch = originalFetch; }
});
