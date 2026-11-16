import "../../lib/api/test-setup.mjs";
import assert from "node:assert/strict";
import test from "node:test";
import { resolve } from "node:path";
const { getCatalog } = await import("./catalog.ts");
const { regionSelectionIndex } = await import("../regions/selection.ts");

test("the repository catalog supports fresh clones without a metadata API request", async () => {
  const originalFetch = globalThis.fetch;
  const previousDirectory = process.env.BEJIR_PREPARED_DATA_DIR;
  const previousOrigin = process.env.BEJIR_API_URL;
  process.env.BEJIR_PREPARED_DATA_DIR = resolve(import.meta.dirname, "../../../../data/processed/web");
  process.env.BEJIR_API_URL = "http://80.43.0.180:8000";
  globalThis.fetch = async () => { throw new Error("must not fetch metadata"); };
  try {
    const catalog = await getCatalog();
    assert.equal(catalog.regencies.length, 27);
    assert.equal(catalog.districts.length, 627);
    assert.equal(regionSelectionIndex(catalog).length, 654);
    assert.ok(catalog.districts.every((row) => catalog.regencies.some((parent) => parent.id === row.regency_id)));
  } finally {
    globalThis.fetch = originalFetch;
    if (previousDirectory === undefined) delete process.env.BEJIR_PREPARED_DATA_DIR;
    else process.env.BEJIR_PREPARED_DATA_DIR = previousDirectory;
    if (previousOrigin === undefined) delete process.env.BEJIR_API_URL;
    else process.env.BEJIR_API_URL = previousOrigin;
  }
});
