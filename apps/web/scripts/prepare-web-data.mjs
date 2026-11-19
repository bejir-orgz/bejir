import { mkdir, writeFile, rename } from "node:fs/promises";
import { resolve } from "node:path";
import { simplifyBoundary } from "../features/geography/display-geometry.ts";

const source = (process.env.BEJIR_API_URL || "http://80.43.0.180:8000").replace(/\/+$/, "");
const directory = process.env.BEJIR_PREPARED_DATA_DIR || resolve(import.meta.dirname, "../../../data/processed/web");
async function read(path) {
  for (let attempt = 0; ; attempt++) {
    try {
      const response = await fetch(`${source}/api/v1/${path}`, { signal: AbortSignal.timeout(path.startsWith("geography/") ? 300_000 : 30_000) });
      if (!response.ok) throw new Error(`${path}: HTTP ${response.status}`);
      return await response.json();
    } catch (error) {
      if (attempt >= 2) throw error;
      await new Promise((done) => setTimeout(done, 500 * (attempt + 1)));
    }
  }
}
async function save(name, data) {
  await mkdir(directory, { recursive: true });
  const path = resolve(directory, `${name}.json`);
  await writeFile(`${path}.tmp`, JSON.stringify({ source, prepared_at: new Date().toISOString(), ...data }), "utf8");
  await rename(`${path}.tmp`, path);
  console.log(`${name} ready`);
}
async function geography() {
  console.log("Fetching source geography once for offline preparation");
  const [regencies, districts] = await Promise.all([
    read("geography/regencies?province_code=32&limit=1000"), read("geography/districts?limit=1000"),
  ]);
  if (!Array.isArray(regencies) || !regencies.length || regencies.length >= 1000 || !Array.isArray(districts) || !districts.length || districts.length >= 1000) throw new Error("Incomplete geography pagination");
  const parents = new Set(regencies.map((row) => row.id));
  if (parents.size !== regencies.length || new Set(districts.map((row) => row.id)).size !== districts.length) throw new Error("Duplicate geography IDs");
  for (const row of [...regencies, ...districts]) {
    if (!Number.isSafeInteger(row.id) || row.id < 1 || typeof row.name !== "string" || !row.geom) throw new Error("Invalid geography record");
    if (row.regency_id !== undefined && !parents.has(row.regency_id)) throw new Error("Unknown administrative parent");
  }
  const collection = (rows) => ({ type: "FeatureCollection", features: rows.map((row) => ({
    type: "Feature", id: row.id, properties: { id: row.id, name: row.name, ...(row.regency_id === undefined ? {} : { regency_id: row.regency_id }) }, geometry: simplifyBoundary(row.geom),
  })) });
  // Validate every geometry before replacing either published boundary collection.
  const boundaries = { crs: "EPSG:4326", tolerance_m_3857: 100, regencies: collection(regencies), districts: collection(districts) };
  await save("boundaries", boundaries);
  console.log(`Validated ${regencies.length} regencies and ${districts.length} districts`);
}
const task = process.argv[2];
if (task !== "geography" && task !== "all") throw new Error("Choose geography or all");
await geography();
