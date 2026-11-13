import { resolve } from "node:path";
process.env.BEJIR_PREPARED_DATA_DIR = resolve(import.meta.dirname, "missing-prepared");
import "../../lib/api/test-setup.mjs";
import assert from "node:assert/strict";
import test from "node:test";
const { getRainfallPageData } = await import("./api.ts");
const { aggregateRainfall, rainfallSnapshot } = await import("./summary.ts");
const { emptyRainfallFilters, filterRainfallRows } = await import("./filter.ts");

test("rainfall loads regional parameters, uses pixel weights and keeps missing periods and classification explicit", async () => {
  const original = globalThis.fetch;
  globalThis.fetch = async (url) => {
    if (url.includes("geography/catalog")) return Response.json({ regencies: [{ id: 1, name: "Bandung" }, { id: 14, name: "Kota Bogor" }], districts: [
      { id: 1, name: "A", regency_id: 1 }, { id: 2, name: "B", regency_id: 1 }, { id: 3, name: "C", regency_id: 1 }, { id: 4, name: "D", regency_id: 14 },
    ] });
    assert.match(url, /district-hazards$/);
    return Response.json([
      { district_id: 1, n_piksel: 100, mean_hujan_mm: 2000 },
      { district_id: 2, n_piksel: 300, mean_hujan_mm: 4000 },
      { district_id: 3, n_piksel: 10, mean_hujan_mm: null },
      { district_id: 4, n_piksel: 200, mean_hujan_mm: 0 }]);
  };
  try {
    const data = await getRainfallPageData();
    assert.deepEqual(data.regions, ["Kabupaten Bandung", "Kota Bogor"]);
    assert.deepEqual(data.years, []);
    assert.equal(data.rows.length, 2);
    assert.equal(data.rows[0].rainfallMm, 3500);
    assert.equal(data.rows[0].minimumMm, 2000);
    assert.equal(data.rows[0].maximumMm, 4000);
    assert.equal(data.rows[0].period, null);
    assert.equal(data.rows[0].classification, null);
    assert.equal(data.rows[1].rainfallMm, 0);
    assert.match(data.snapshots[0].metrics[0].change, /3\/4 kecamatan/);
    assert.equal(data.snapshots[0].metrics[0].value, "2.333,3 mm");
    assert.deepEqual(data.snapshots[0].distribution, []);
    const scoped = filterRainfallRows(data.rows, 0, { ...emptyRainfallFilters, regionIds: ["region:Kota%20Bogor"] });
    assert.equal(scoped.length, 1);
    assert.equal(rainfallSnapshot(scoped).metrics[0].value, "0 mm");
    assert.equal(filterRainfallRows(data.rows, 2026, emptyRainfallFilters).length, 0);
    assert.equal(filterRainfallRows(data.rows, 0, { ...emptyRainfallFilters, month: "01" }).length, 0);
    assert.equal(filterRainfallRows(data.rows, 0, { ...emptyRainfallFilters, query: "bandung" }).length, 1);
    globalThis.fetch = async () => new Response(null, { status: 503 });
    await assert.rejects(getRainfallPageData());
  } finally { globalThis.fetch = original; }
});

test("rainfall aggregation preserves unknown values and rejects invalid source values", () => {
  assert.deepEqual(aggregateRainfall([{ n_piksel: 100, mean_hujan_mm: null }]), { average: null, minimum: null, maximum: null, known: 0, total: 1 });
  assert.equal(aggregateRainfall([{ n_piksel: null, mean_hujan_mm: 10 }]).average, null);
  assert.throws(() => aggregateRainfall([{ n_piksel: 100, mean_hujan_mm: -1 }]));
});
