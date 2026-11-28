import "../../lib/api/test-setup.mjs";
import test from "node:test";
import assert from "node:assert/strict";
const { parseRiverBounds, parseRiverRegions, riverViewportStatusMessage } = await import("./data.ts");
const { riverScope } = await import("./filter.ts");
const { getRiverSummary } = await import("./api.ts");
const { riverTileTemplate } = await import("./tiles.ts");
const { riverViewportLoader } = await import("./viewport.ts");

// Two regencies: 17 has districts 1 and 2, 18 has district 3.
const catalog = {
  regencies: [
    { id: 17, name: "Kota Bogor" },
    { id: 18, name: "Bogor" },
  ],
  districts: [
    { id: 1, name: "A", regency_id: 17 },
    { id: 2, name: "B", regency_id: 17 },
    { id: 3, name: "C", regency_id: 18 },
  ],
};
const withCatalog = (handler) => async (input) => {
  const url = new URL(input, "http://localhost");
  if (url.pathname.endsWith("/geography/catalog")) return Response.json(catalog);
  return handler(url);
};

test("a selection resolves to the district ids the API accepts, exclusions included", async () => {
  const original = globalThis.fetch;
  globalThis.fetch = withCatalog(() => new Response(null, { status: 503 }));
  try {
    assert.deepEqual(await riverScope([]), { kind: "all", query: "" });
    assert.equal((await riverScope(["17"])).query, "district_id=1&district_id=2");
    assert.equal((await riverScope(["17/2"])).query, "district_id=2");
    // An excluded child must drop out of the resolved list, not just out of the label.
    assert.equal((await riverScope(["17", "!17/1"])).query, "district_id=2");
    assert.equal((await riverScope(["17", "18"])).query, "district_id=1&district_id=2&district_id=3");
    assert.equal((await riverScope(["17/1/99"])).kind, "village");
    assert.equal((await riverScope(["!17", "!18"])).kind, "empty");
  } finally {
    globalThis.fetch = original;
  }
});

test("summary keeps per-regency totals and counts a selection without double counting", async () => {
  const original = globalThis.fetch;
  const counted = [];
  globalThis.fetch = withCatalog((url) => {
    if (url.pathname.endsWith("/rivers/summary")) {
      return Response.json([
        { regency_id: 17, regency_name: "Kota Bogor", total: 40 },
        { regency_id: 18, regency_name: "Bogor", total: 25 },
      ]);
    }
    counted.push(url.searchParams.getAll("district_id").join(","));
    // Fewer than 40 + 25: a river crossing both regencies is one river.
    return Response.json({ items: [], total: 60 });
  });
  try {
    const all = await getRiverSummary([]);
    assert.deepEqual(all.by_regency, { 17: 40, 18: 25 });
    assert.equal(all.total, 60);
    const scoped = await getRiverSummary(["17"]);
    assert.equal(scoped.total, 60);
    assert.deepEqual(scoped.by_regency, { 17: 40, 18: 25 });
    assert.deepEqual(counted.at(-1), "1,2");
    // Village scope has no count, but the table still needs its per-regency column.
    const village = await getRiverSummary(["17/1/99"]);
    assert.equal(village.total, null);
    assert.deepEqual(village.by_regency, { 17: 40, 18: 25 });
  } finally {
    globalThis.fetch = original;
  }
});

test("a malformed summary row is rejected rather than shown as a count", async () => {
  const original = globalThis.fetch;
  try {
    globalThis.fetch = withCatalog((url) =>
      url.pathname.endsWith("/rivers/summary")
        ? Response.json([{ regency_id: 17, total: -4 }])
        : Response.json({ items: [], total: 0 }),
    );
    await assert.rejects(getRiverSummary([]), /ringkasan sungai/i);
    globalThis.fetch = withCatalog((url) =>
      url.pathname.endsWith("/rivers/summary")
        ? Response.json([])
        : Response.json({ items: [], total: 0 }),
    );
    await assert.rejects(getRiverSummary([]), /Ringkasan sungai tidak valid/);
  } finally {
    globalThis.fetch = original;
  }
});

test("map filter inputs and status messages are validated cleanly", () => {
  assert.throws(() => parseRiverBounds("1,2,0,3"));
  assert.throws(() => parseRiverBounds("0,0,NaN,3"));
  assert.throws(() => parseRiverRegions(new URLSearchParams("region=17;DROP")));
  assert.deepEqual(parseRiverRegions(new URLSearchParams("region=17&region=17")), ["17"]);
  assert.match(
    riverViewportStatusMessage({ returned: 0, total_matching: 0, truncated: false, scope_unsupported: "village" })?.message ?? "",
    /kelurahan\/desa/,
  );
  assert.match(
    riverViewportStatusMessage({ returned: 1000, total_matching: 5000, truncated: true, scope_unsupported: null })?.message ?? "",
    /1.000 dari 5.000 segmen/,
  );
  assert.equal(
    riverViewportStatusMessage({ returned: 120, total_matching: 120, truncated: false, scope_unsupported: null }),
    undefined,
  );
});

test("tile URLs are stable for a selection and province requests omit region filters", () => {
  const base = "/backend/web/rivers/tiles/{z}/{x}/{y}";
  assert.equal(riverTileTemplate([]), base);
  assert.equal(riverTileTemplate(["17/2", "4", "4"]), `${base}?region=17%2F2&region=4`);
  assert.equal(riverTileTemplate(["17/2/9"]), null);
});

test("tile scopes filter whole regencies by their own boundaries and keep district exclusions", async (t) => {
  t.mock.method(globalThis, "fetch", withCatalog(() => new Response(null, { status: 503 })));
  assert.deepEqual(await riverScope(["17"], { tiles: true }), { kind: "regencies", query: "regency_id=17" });
  assert.deepEqual(await riverScope(["17", "!17/1"], { tiles: true }), { kind: "districts", query: "district_id=2" });
});

test("the GeoJSON path accepts a complete province selection and reuses nearby results", async (t) => {
  t.mock.method(globalThis, "fetch", withCatalog(() => Response.json({
    type: "FeatureCollection", features: [], returned: 1, total_matching: 1, truncated: false,
  })));
  assert.deepEqual(await riverScope(["17", "18"], { viewport: true }), { kind: "all", query: "" });
  assert.deepEqual(await riverScope(["17"], { viewport: true }), { kind: "regencies", query: "regency_id=17" });

  const render = t.mock.fn();
  const loader = riverViewportLoader(["17/2"], render, () => {});
  await loader.load([106, -8, 109, -5]);
  await loader.load([106.1, -8, 109.1, -5]);
  assert.equal(render.mock.callCount(), 1);
  const request = globalThis.fetch.mock.calls.at(-1).arguments[0];
  assert.match(request, /^\/backend\/web\/rivers\/layers\?bbox=.*&region=17%2F2$/);
});
