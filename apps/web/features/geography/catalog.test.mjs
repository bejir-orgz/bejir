import "../../lib/api/test-setup.mjs";
import assert from "node:assert/strict";
import test from "node:test";
const { getCatalog } = await import("./catalog.ts");
const { regionSelectionIndex } = await import("../regions/selection.ts");

test("catalog uses live lightweight metadata and rejects failed or invalid responses", async () => {
  const original = globalThis.fetch;
  const catalog = { regencies: [{ id: 14, name: "Kota Bogor" }], districts: [{ id: 545, name: "Tanah Sareal", regency_id: 14 }] };
  globalThis.fetch = async (url) => { assert.ok(url.endsWith("/api/v1/geography/catalog")); return Response.json(catalog); };
  try {
    assert.deepEqual(await getCatalog(), catalog);
    assert.equal(regionSelectionIndex(await getCatalog()).length, 2);
    globalThis.fetch = async () => new Response(null, { status: 503 });
    await assert.rejects(getCatalog(), /gagal dimuat/);
    for (const value of [null, {}, { ...catalog, districts: [] }, { ...catalog, districts: [{ ...catalog.districts[0], regency_id: 99 }] }]) {
      globalThis.fetch = async () => Response.json(value);
      await assert.rejects(getCatalog(), /tidak valid/);
    }
  } finally { globalThis.fetch = original; }
});
