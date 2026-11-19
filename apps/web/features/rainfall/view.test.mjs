import "../../lib/api/test-setup.mjs";
import test from "node:test";
import assert from "node:assert/strict";
const { buildRainfallView } = await import("./view.ts");
const { rainfallQuery, parseRainfallQuery } = await import("./query.ts");
const { emptyRainfallFilters, filterRainfallRows } = await import("./filter.ts");
const { rainfallSnapshot } = await import("./summary.ts");

const monthly = [
  { district_name: "A", year: 2024, month: 1, n_piksel: 100, mean_hujan_mm: 100, kelas_hujan: 2, label_hujan: "Rendah" },
  { district_name: "B", year: 2024, month: 1, n_piksel: 300, mean_hujan_mm: 300, kelas_hujan: 3, label_hujan: "Sedang" },
  { district_name: "A", year: 2023, month: 1, n_piksel: 100, mean_hujan_mm: 200, kelas_hujan: 3, label_hujan: "Sedang" },
];
const data = { years: [2024, 2023], regions: ["Kabupaten Bandung"], legend: [], snapshots: {}, rows: [{ id: "1", region: "Kabupaten Bandung", period: null, classification: null, rainfallMm: null, averageMm: null, minimumMm: null, maximumMm: null, parameters: [], monthly }] };

test("server rainfall view preserves independent summary/table scope without shipping observations", () => {
  const request = { summaryYear: 2024, tableYear: 2023, summaryRegionIds: [], filters: { ...emptyRainfallFilters, month: "01" } };
  const view = buildRainfallView(data, request);
  assert.equal(view.rows[0].year, 2023);
  assert.equal(view.rows[0].rainfallMm, 200);
  assert.equal(view.rows[0].classification, "Sedang");
  assert.deepEqual(view.snapshot, rainfallSnapshot(filterRainfallRows(data.rows, 2024, emptyRainfallFilters), filterRainfallRows(data.rows, 2023, emptyRainfallFilters)));
  assert.equal(view.rows[0].monthly, undefined);
  assert.deepEqual(view.rows[0].parameters, []);
  assert.equal(buildRainfallView(data).rows[0].year, 2024);
  const district = ["region:Kabupaten%20Bandung/district:A"];
  const scoped = buildRainfallView(data, { ...request, tableYear: 2024, summaryRegionIds: district, filters: { ...request.filters, regionIds: district } });
  assert.equal(scoped.rows[0].rainfallMm, 100);
  assert.equal(scoped.rows[0].classification, "Rendah");
  assert.equal(scoped.snapshot.metrics[0].change, "-50% dari tahun sebelumnya");
  assert.equal(buildRainfallView(data, { ...request, filters: { ...request.filters, query: "bogor" } }).rows.length, 0);
});

test("rainfall request roundtrips region exclusions and rejects invalid query inputs", () => {
  const scope = { summaryYear: 2024, tableYear: 2023, summaryRegionIds: ["province:jawa-barat", "!region:Kota%20Depok"], filters: { query: "Bandung", regionIds: ["region:Kabupaten%20Bandung/district:A"], month: "02", classifications: ["Rendah"] } };
  assert.deepEqual(parseRainfallQuery(new URLSearchParams(rainfallQuery(scope))), scope);
  for (const change of [{ summaryYear: "bad" }, { tableYear: "10000" }, { month: "13" }, { q: "a".repeat(301) }]) {
    const query = new URLSearchParams(rainfallQuery(scope));
    for (const [key, value] of Object.entries(change)) query.set(key, value);
    assert.equal(parseRainfallQuery(query), null);
  }
  assert.equal(parseRainfallQuery(new URLSearchParams()), null);
});
