import "../../lib/api/test-setup.mjs";
import assert from "node:assert/strict";
import test from "node:test";
import { mkdtemp, writeFile, unlink, rmdir } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
const { getCatalog } = await import("./catalog.ts");
const { getThematicCollection } = await import("./thematic-geometry.ts");
const { readPrepared } = await import("./prepared-data.ts");

const catalog = { regencies: [{ id: 14, name: "Kota Bogor" }], districts: [{ id: 545, name: "Tanah Sareal", regency_id: 14 }] };
const geometry = { type: "Polygon", coordinates: [[[106, -7], [106.1, -7], [106.1, -6.9], [106, -7]]] };
const feature = { type: "Feature", id: 545, geometry, properties: { id: 545, name: "Tanah Sareal", regency_id: 14 } };
const boundaries = (overrides = {}) => ({ type: "FeatureCollection", level: "district", truncated: false, features: [feature], ...overrides });

test("district themes read generalized boundaries from the backend viewport endpoint", async () => {
  const original = globalThis.fetch;
  const requested = [];
  globalThis.fetch = async (url) => {
    requested.push(String(url));
    if (url.endsWith("/geography/catalog")) return Response.json(catalog);
    if (url.includes("/geography/boundaries")) return Response.json(boundaries());
    return Response.json([{ district_id: 545, mean_elevasi_m: 178.5, kelas_dominan_v2: 5 }]);
  };
  try {
    assert.equal((await getCatalog()).regencies[0].id, 14);
    const data = await getThematicCollection();
    assert.deepEqual(data.features[0].geometry, geometry);
    assert.equal(data.features[0].properties.kelas_dominan_v2, 5);
    const boundaryCalls = requested.filter((url) => url.includes("/geography/boundaries"));
    assert.equal(boundaryCalls.length, 1);
    assert.match(boundaryCalls[0], /level=district/);
    assert.match(boundaryCalls[0], /simplify_m=100/);
    assert.ok(!requested.some((url) => /\/geography\/districts\?/.test(url)));
  } finally { globalThis.fetch = original; }
});

test("district themes reject truncated coverage and parameters that do not line up", async () => {
  const original = globalThis.fetch;
  try {
    globalThis.fetch = async (url) => Response.json(url.endsWith("/geography/catalog") ? catalog
      : url.includes("/geography/boundaries") ? boundaries({ truncated: true })
        : [{ district_id: 545 }]);
    await assert.rejects(getThematicCollection(), /terpotong/);
    globalThis.fetch = async (url) => Response.json(url.endsWith("/geography/catalog") ? catalog
      : url.includes("/geography/boundaries") ? boundaries()
        : [{ district_id: 545 }, { district_id: 545 }]);
    await assert.rejects(getThematicCollection(), /Cakupan/);
  } finally { globalThis.fetch = original; }
});

test("prepared rivers refuse a read model built against a different backend", async () => {
  const previous = process.env.BEJIR_PREPARED_DATA_DIR;
  const directory = await mkdtemp(join(tmpdir(), "bejir-rivers-"));
  process.env.BEJIR_PREPARED_DATA_DIR = directory;
  try {
    await writeFile(join(directory, "rivers.json"), JSON.stringify({ source: "http://another-api.invalid", prepared_at: "2026-11-13T00:00:00Z" }));
    await assert.rejects(readPrepared("rivers"), /Sumber data olahan tidak cocok/);
  } finally {
    if (previous === undefined) delete process.env.BEJIR_PREPARED_DATA_DIR; else process.env.BEJIR_PREPARED_DATA_DIR = previous;
    await unlink(join(directory, "rivers.json")); await rmdir(directory);
  }
});
