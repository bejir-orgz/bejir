import "../../lib/api/test-setup.mjs";
import assert from "node:assert/strict";
import test from "node:test";
import { mkdtemp, writeFile, unlink, rmdir } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
const { getCatalog } = await import("./catalog.ts");
const { getThematicCollection } = await import("./thematic-geometry.ts");
const { readPrepared } = await import("./prepared-data.ts");

test("prepared geography avoids raw polygon requests and rejects overlapping or mismatched parameters", async () => {
  const original = globalThis.fetch, previous = process.env.BEJIR_PREPARED_DATA_DIR;
  const directory = await mkdtemp(join(tmpdir(), "bejir-geography-"));
  process.env.BEJIR_PREPARED_DATA_DIR = directory;
  const metadata = { source: process.env.BEJIR_API_URL || "http://80.43.0.180:8000", prepared_at: "2026-11-13T00:00:00Z" };
  const catalog = { ...metadata, regencies: [{ id: 14, name: "Kota Bogor" }], districts: [{ id: 545, name: "Tanah Sareal", regency_id: 14 }] };
  const geometry = { type: "Polygon", coordinates: [[[106, -7], [106.1, -7], [106.1, -6.9], [106, -7]]] };
  const feature = { type: "Feature", id: 545, geometry, properties: { id: 545, name: "Tanah Sareal", regency_id: 14 } };
  await writeFile(join(directory, "catalog.json"), JSON.stringify(catalog));
  await writeFile(join(directory, "boundaries.json"), JSON.stringify({ ...metadata, crs: "EPSG:4326", districts: { type: "FeatureCollection", features: [feature] } }));
  let calls = 0;
  globalThis.fetch = async (url) => {
    calls++;
    assert.match(url, /spatial-analysis\/district-hazards$/);
    return Response.json([{ district_id: 545, mean_elevasi_m: 178.5, kelas_dominan_v2: 5 }]);
  };
  try {
    assert.equal((await getCatalog()).regencies[0].id, 14);
    assert.equal(calls, 0);
    const data = await getThematicCollection();
    assert.equal(calls, 1);
    assert.deepEqual(data.features[0].geometry, geometry);
    assert.equal(data.features[0].properties.kelas_dominan_v2, 5);
    globalThis.fetch = async () => Response.json([{ district_id: 545 }, { district_id: 545 }]);
    await assert.rejects(getThematicCollection(), /Cakupan/);
    await writeFile(join(directory, "catalog.json"), JSON.stringify({ ...catalog, source: "http://another-api.invalid" }));
    await assert.rejects(readPrepared("catalog"), /Sumber data olahan tidak cocok/);
  } finally {
    globalThis.fetch = original;
    if (previous === undefined) delete process.env.BEJIR_PREPARED_DATA_DIR; else process.env.BEJIR_PREPARED_DATA_DIR = previous;
    await unlink(join(directory, "catalog.json")); await unlink(join(directory, "boundaries.json")); await rmdir(directory);
  }
});
