import { resolve } from "node:path";
process.env.BEJIR_PREPARED_DATA_DIR = resolve(import.meta.dirname, "missing-prepared");
import "../../lib/api/test-setup.mjs";
import assert from "node:assert/strict";
import test from "node:test";
const { getRainfallPageData, emptyRainfallData } = await import("./api.ts");
const { aggregateRainfall, rainfallSnapshot, rainfallClassification } = await import("./summary.ts");
const { buildRainfallView } = await import("./view.ts");
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
    assert.equal(data.snapshots[0].metrics[0].change, "—");
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
    if (url.includes("/district-rainfall-monthly")) {
      requests++;
      const id = Number(new URL(url).searchParams.get("regency_id"));
      assert.ok(id > 0);
      return Response.json(monthly.filter((row) => catalog.districts.find((district) => district.id === row.district_id)?.regency_id === id));
    }
    assert.match(url, /district-hazards$/);
    return Response.json(catalog.districts.map((row) => ({ district_id: row.id, n_piksel: 100, mean_hujan_mm: 2000 })));
  };
  try {
    const data = await getRainfallPageData();
    assert.equal(requests, 2);
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


test("monthly API supplies years and pixel-weighted classifications with region and month scope", async () => {
  const original = globalThis.fetch;
  let monthly = [
    { district_id: 1, year: 2023, month: 1, n_piksel: 100, hujan_mm: 100, kelas_hujan: 2, label_hujan: "Rendah" },
    { district_id: 1, year: 2024, month: 1, n_piksel: 100, hujan_mm: 200, kelas_hujan: 3, label_hujan: "Sedang" },
    { district_id: 2, year: 2024, month: 1, n_piksel: 300, hujan_mm: 400, kelas_hujan: 5, label_hujan: "Sangat Tinggi" },
    { district_id: 1, year: 2024, month: 2, n_piksel: 100, hujan_mm: 300, kelas_hujan: 2, label_hujan: "Rendah" },
  ];
  globalThis.fetch = async (url) => {
    if (url.includes("/catalog")) return Response.json({ regencies: [{ id: 1, name: "Bandung" }], districts: [{ id: 1, name: "A", regency_id: 1 }, { id: 2, name: "B", regency_id: 1 }] });
    if (url.includes("district-rainfall-monthly")) return Response.json(monthly);
    assert.match(url, /district-hazards$/);
    return Response.json([{ district_id: 1, n_piksel: 100, mean_hujan_mm: 2000 }, { district_id: 2, n_piksel: 100, mean_hujan_mm: 4000 }]);
  };
  try {
    const data = await getRainfallPageData();
    assert.equal(data.error, undefined);
    assert.deepEqual(data.years, [2024, 2023]);
    assert.equal(filterRainfallRows(data.rows, 2024, emptyRainfallFilters)[0].classification, "Sangat Tinggi");
    assert.equal(filterRainfallRows(data.rows, 2023, emptyRainfallFilters)[0].classification, "Rendah");
    assert.equal(filterRainfallRows(data.rows, 2024, { ...emptyRainfallFilters, month: "02" })[0].classification, "Rendah");
    assert.equal(filterRainfallRows(data.rows, 2024, { ...emptyRainfallFilters, month: "01", regionIds: ["region:Kabupaten%20Bandung/district:A"] })[0].classification, "Sedang");
    assert.equal(filterRainfallRows(data.rows, 2024, { ...emptyRainfallFilters, classifications: ["Sangat Tinggi"] }).length, 1);
    for (const invalid of [{ ...monthly[0], kelas_hujan: 6 }, { ...monthly[0], label_hujan: 3 }, { ...monthly[0], label_hujan: " " }]) {
      monthly = [invalid];
      await assert.rejects(getRainfallPageData(), /tidak valid/);
    }
  } finally { globalThis.fetch = original; }
});

test("rainfall classification preserves ties, skips unmeasured districts and never invents labels", () => {
  const a = { year: 2024, month: 1, n_piksel: 100, kelas_hujan: 2, label_hujan: "Rendah", mean_hujan_mm: 100 };
  const b = { ...a, kelas_hujan: 3, label_hujan: "Sedang" };
  assert.equal(rainfallClassification([a, b]), null, "an exact tie stays unresolved");
  assert.equal(rainfallClassification([a, { ...b, n_piksel: 300 }]), "Sedang", "heavier class wins");
  // A district outside the rainfall raster is a gap, not a contradiction: classify the rest.
  assert.equal(rainfallClassification([a, { ...b, label_hujan: null }]), "Rendah");
  assert.equal(rainfallClassification([a, { ...b, kelas_hujan: null }]), "Rendah");
  assert.equal(rainfallClassification([a, { ...b, n_piksel: 0 }]), "Rendah");
  // One class with two different labels is contradictory, so it still refuses.
  assert.equal(rainfallClassification([a, { ...a, label_hujan: "Other" }]), null);
  // Nothing measured anywhere leaves no class to report.
  assert.equal(rainfallClassification([{ ...a, kelas_hujan: null, label_hujan: null }]), null);
  assert.equal(rainfallClassification([]), null);
});

test("rainfall card comparisons use dated regional data and retain missing previous years", () => {
  const row = { id: "1", region: "Kabupaten Bandung", period: null, classification: null, parameters: [], monthly: [
    { district_name: "A", year: 2025, month: 1, n_piksel: 100, mean_hujan_mm: 100 },
    { district_name: "A", year: 2026, month: 1, n_piksel: 100, mean_hujan_mm: 39 },
  ] };
  const current = filterRainfallRows([row], 2026, emptyRainfallFilters);
  const previous = filterRainfallRows([row], 2025, emptyRainfallFilters);
  for (const metric of rainfallSnapshot(current, previous).metrics) assert.equal(metric.change, "-61% dari tahun sebelumnya");
  for (const metric of rainfallSnapshot(current).metrics) assert.equal(metric.change, "—");
});


test("multi-year rainfall stays in bounded regional cache requests even when combined data exceeds 2 MB", async () => {
  const original = globalThis.fetch;
  const catalog = { regencies: Array.from({ length: 20 }, (_, i) => ({ id: i + 1, name: `Wilayah ${i + 1}` })), districts: Array.from({ length: 20 }, (_, i) => ({ id: i + 1, name: `Kecamatan ${i + 1}`, regency_id: i + 1 })) };
  let active = 0, peak = 0;
  const seen = new Set();
  globalThis.fetch = async (input, init) => {
    const url = new URL(input);
    if (url.pathname.endsWith("/catalog")) return Response.json(catalog);
    if (url.pathname.endsWith("/district-hazards")) return Response.json(catalog.districts.map((d) => ({ district_id: d.id, n_piksel: 100, mean_hujan_mm: 100 })));
    const id = Number(url.searchParams.get("regency_id"));
    assert.ok(id > 0);
    assert.equal(init.next.revalidate, 300);
    assert.equal(seen.has(id), false);
    seen.add(id);
    active++; peak = Math.max(peak, active);
    await new Promise(setImmediate);
    active--;
    const response = Response.json(Array.from({ length: 1200 }, (_, index) => ({ district_id: id, year: 1900 + Math.floor(index / 12), month: index % 12 + 1, n_piksel: 100, hujan_mm: 100, kelas_hujan: 3, label_hujan: "Sedang" })));
    assert.ok(Buffer.byteLength(await response.clone().text()) < 2 * 1024 * 1024);
    return response;
  };
  try {
    const data = await getRainfallPageData();
    assert.equal(data.error, undefined);
    assert.equal(seen.size, 20);
    assert.ok(peak <= 6);
    assert.equal(data.rows.flatMap((row) => row.monthly).length, 24000);
    assert.ok(Buffer.byteLength(JSON.stringify(data)) > 2 * 1024 * 1024);
    const view = buildRainfallView(data);
    assert.ok(Buffer.byteLength(JSON.stringify(view)) < 20000);
    assert.equal(view.rows.length, 20);
    assert.equal(view.snapshot.distribution.length, 12);
    assert.ok(view.rows.every((row) => !row.monthly && !row.parameters.length));
  } finally { globalThis.fetch = original; }
});


test("rainfall legend exposes the supplied annual thresholds independently of monthly observations", () => {
  const data = emptyRainfallData();
  assert.deepEqual(data.legend.map(({ label, range }) => [label, range]), [
    ["Sangat Rendah", "< 2.500 mm/tahun"],
    ["Rendah", "2.500\u2013<3.000 mm/tahun"],
    ["Sedang", "3.000\u2013<3.400 mm/tahun"],
    ["Tinggi", "3.400\u2013<3.900 mm/tahun"],
    ["Sangat Tinggi", "\u2265 3.900 mm/tahun"],
  ]);
  assert.deepEqual(buildRainfallView(data).legend, data.legend);
  assert.equal(rainfallClassification([{ year: 2024, month: 1, mean_hujan_mm: 511, n_piksel: 100, kelas_hujan: 5, label_hujan: "Sangat Tinggi" }]), "Sangat Tinggi");
});
