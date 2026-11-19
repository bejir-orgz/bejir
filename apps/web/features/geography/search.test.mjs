import "../../lib/api/test-setup.mjs";
import assert from "node:assert/strict";
import test from "node:test";
import { resolve } from "node:path";
const { getRegionSearchTree } = await import("./search.ts");
const { filterRegionTree, toggleRegionSelection, isRegionSelected } = await import("../webgis/region-tree.ts");

test("search finds unopened districts and villages with parent context using paged metadata only", async () => {
  const original = globalThis.fetch, directory = process.env.BEJIR_PREPARED_DATA_DIR;
  process.env.BEJIR_PREPARED_DATA_DIR = resolve(import.meta.dirname, "missing-prepared");
  const calls = [];
  globalThis.fetch = async (input) => {
    const url = new URL(input); calls.push(url);
    if (url.pathname.endsWith("/catalog")) return Response.json({ regencies: [{ id: 14, name: "Kota Bogor" }, { id: 4, name: "Bogor" }], districts: [{ id: 545, regency_id: 14, name: "Tanah Sareal" }, { id: 109, regency_id: 4, name: "Cibinong" }] });
    assert.equal(url.pathname, "/api/v1/geography/villages");
    assert.equal(url.searchParams.get("include_geometry"), "false");
    assert.equal(url.searchParams.get("limit"), "1000");
    return Response.json(url.searchParams.get("offset") === "0"
      ? Array.from({ length: 1000 }, (_, i) => ({ id: i + 1, name: "Kelurahan Contoh", district_id: 109 }))
      : [{ id: 1001, name: "Kedung Waringin", district_id: 545 }]);
  };
  try {
    const tree = await getRegionSearchTree();
    const district = filterRegionTree(tree, "  TANAH SAREAL  ");
    assert.equal(district.length, 1);
    assert.equal(district[0].children[0].id, "14/545");
    const village = filterRegionTree(tree, "kedung waringin");
    assert.equal(village[0].name, "Kota Bogor");
    assert.equal(village[0].children[0].children[0].id, "14/545/1001");
    assert.equal(isRegionSelected(toggleRegionSelection([], "14"), "14/545/1001"), true);
    assert.equal(filterRegionTree(tree, "Cibinong")[0].name, "Kabupaten Bogor");
    assert.deepEqual(filterRegionTree(tree, "tidak ada"), []);
    assert.equal(filterRegionTree(tree, " "), tree);
    assert.deepEqual(calls.slice(1).map((url) => url.searchParams.get("offset")), ["0", "1000"]);
  } finally {
    globalThis.fetch = original;
    if (directory === undefined) delete process.env.BEJIR_PREPARED_DATA_DIR; else process.env.BEJIR_PREPARED_DATA_DIR = directory;
  }
});

test("failed or invalid village metadata never becomes an empty successful search", async () => {
  const original = globalThis.fetch, directory = process.env.BEJIR_PREPARED_DATA_DIR;
  process.env.BEJIR_PREPARED_DATA_DIR = resolve(import.meta.dirname, "missing-prepared");
  try {
    for (const response of [new Response(null, { status: 503 }), Response.json({}), Response.json([{ id: -1, name: "Salah", district_id: 545 }])]) {
      globalThis.fetch = async (input) => input.includes("/catalog")
        ? Response.json({ regencies: [{ id: 14, name: "Kota Bogor" }], districts: [{ id: 545, regency_id: 14, name: "Tanah Sareal" }] }) : response;
      await assert.rejects(getRegionSearchTree(), /Metadata kelurahan/);
    }
  } finally {
    globalThis.fetch = original;
    if (directory === undefined) delete process.env.BEJIR_PREPARED_DATA_DIR; else process.env.BEJIR_PREPARED_DATA_DIR = directory;
  }
});
