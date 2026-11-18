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
    if (url.includes("district-rainfall-monthly")) return new Response(null, { status: 503 });
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

test("monthly rainfall is pixel weighted, region/district scoped, and never assigned a fabricated year", async () => {
  const original = globalThis.fetch;
  const catalog = { regencies: [{ id: 1, name: "Bandung" }, { id: 14, name: "Kota Bogor" }], districts: [{ id: 1, name: "A", regency_id: 1 }, { id: 2, name: "B", regency_id: 1 }, { id: 3, name: "C", regency_id: 14 }] };
  let monthly = [
    { district_id: 1, year: null, month: 1, n_piksel: 100, hujan_mm: 100 },
    { district_id: 2, year: null, month: 1, n_piksel: 300, hujan_mm: 300 },
    { district_id: 3, year: null, month: 1, n_piksel: 200, hujan_mm: 0 },
    { district_id: 1, year: null, month: 2, n_piksel: 100, hujan_mm: null },
    { district_id: 2, year: null, month: 2, n_piksel: 300, hujan_mm: 0 },
  ];
  let requests = 0;
  globalThis.fetch = async (url) => {
    if (url.includes("/catalog")) return Response.json(catalog);
    if (url.includes("/district-rainfall-monthly")) { requests++; return Response.json(monthly); }
    assert.match(url, /district-hazards$/);
    return Response.json(catalog.districts.map((row) => ({ district_id: row.id, n_piksel: 100, mean_hujan_mm: 2000 })));
  };
  try {
    const data = await getRainfallPageData();
    assert.equal(requests, 1);
    assert.deepEqual(data.years, []);
    const all = filterRainfallRows(data.rows, 0, emptyRainfallFilters);
    const chart = rainfallSnapshot(all).distribution;
    assert.equal(chart.length, 12);
    assert.equal(chart[0].rainfallMm, 100000 / 600);
    assert.equal(chart[1].rainfallMm, 0);
    assert.equal(chart[2].rainfallMm, null);
    const january = filterRainfallRows(data.rows, 0, { ...emptyRainfallFilters, month: "01", regionIds: ["region:Kabupaten%20Bandung"] });
    assert.equal(january.length, 1);
    assert.equal(january[0].rainfallMm, 250);
    assert.equal(january[0].month, 1);
    assert.equal(january[0].year, undefined);
    assert.equal(january[0].minimumMm, 100);
    assert.equal(january[0].maximumMm, 300);
    const district = filterRainfallRows(data.rows, 0, { ...emptyRainfallFilters, regionIds: ["region:Kabupaten%20Bandung/district:A"] });
    assert.equal(rainfallSnapshot(district).distribution[0].rainfallMm, 100);
    assert.equal(rainfallSnapshot(district).distribution[1].rainfallMm, null);
    assert.deepEqual(filterRainfallRows(data.rows, 2026, emptyRainfallFilters), []);
    monthly = monthly.map((row) => ({ ...row, year: 2025 }));
    const dated = await getRainfallPageData();
    assert.deepEqual(dated.years, [2025]);
    assert.equal(filterRainfallRows(dated.rows, 2025, { ...emptyRainfallFilters, month: "01" })[0].rainfallMm, 250);
    monthly = [monthly[0], monthly[0]];
    await assert.rejects(getRainfallPageData(), /berulang/);
    monthly = [{ ...monthly[0], hujan_mm: -1 }];
    await assert.rejects(getRainfallPageData(), /tidak valid/);
  } finally { globalThis.fetch = original; }
});

test("rainfall aggregation preserves unknown values and rejects invalid source values", () => {
  assert.deepEqual(aggregateRainfall([{ n_piksel: 100, mean_hujan_mm: null }]), { average: null, minimum: null, maximum: null, known: 0, total: 1 });
  assert.equal(aggregateRainfall([{ n_piksel: null, mean_hujan_mm: 10 }]).average, null);
  assert.throws(() => aggregateRainfall([{ n_piksel: 100, mean_hujan_mm: -1 }]));
});
