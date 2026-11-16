import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile, rename } from "node:fs/promises";
import { resolve } from "node:path";
import { createDistrictIndex, prepareRiver } from "../features/rivers/preparation.ts";

const source = (process.env.BEJIR_API_URL || "http://80.43.0.180:8000").replace(/\/+$/, "");
const directory = process.env.BEJIR_PREPARED_DATA_DIR || resolve(import.meta.dirname, "../../../data/processed/web");
const work = resolve(directory, "rivers-preparation");
await mkdir(work, { recursive: true });
async function read(path) {
  for (let attempt = 0; ; attempt++) {
    try {
      const response = await fetch(`${source}/api/v1/${path}`, { signal: AbortSignal.timeout(path.startsWith("geography/") ? 300_000 : 45_000) });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.json();
    } catch (error) { if (attempt === 2) throw error; }
  }
}
const catalog = JSON.parse(await readFile(resolve(directory, "catalog.json"), "utf8"));
if (catalog.source !== source) throw new Error("Catalog source mismatch");
console.log("Reading original district boundaries for exact river intersections");
const districts = await read("geography/districts?limit=1000");
const expected = new Map(catalog.districts.map((row) => [row.id, row.regency_id]));
if (districts.length !== expected.size || new Set(districts.map((row) => row.id)).size !== expected.size || districts.some((row) => expected.get(row.id) !== row.regency_id)) throw new Error("Incomplete district boundaries");
const index = createDistrictIndex(districts);
const first = await read("rivers?limit=1000&offset=0");
const total = first.total;
if (!Number.isSafeInteger(total) || total < 0 || !Array.isArray(first.items)) throw new Error("Invalid rivers page");
const fingerprint = JSON.stringify({ source, total, districts: createHash("sha256").update(JSON.stringify(districts)).digest("hex") });
let resume = false;
try { resume = process.argv.includes("--resume") && await readFile(resolve(work, "metadata.json"), "utf8") === fingerprint; } catch {}
await writeFile(resolve(work, "metadata.json"), fingerprint, "utf8");
const pages = Array.from({ length: Math.ceil(total / 1000) }, (_, page) => page * 1000);
let completed = 0;
for (let start = 0; start < pages.length; start += 4) {
  const batch = await Promise.all(pages.slice(start, start + 4).map(async (offset) => {
    if (resume) {
      try {
        const features = JSON.parse(await readFile(resolve(work, `${offset}.json`), "utf8"));
        if (features.length === Math.min(1000, total - offset)) return { offset, features };
      } catch {}
    }
    const page = offset === 0 ? first : await read(`rivers?limit=1000&offset=${offset}`);
    if (page.total !== total || page.items.length !== Math.min(1000, total - offset)) throw new Error("Changing or incomplete river coverage");
    return { offset, page };
  }));
  for (const entry of batch) {
    const { offset } = entry;
    const features = entry.features || entry.page.items.map((row) => prepareRiver(row, index));
    await writeFile(resolve(work, `${offset}.json`), JSON.stringify(features), "utf8");
    completed += features.length;
    console.log(`Rivers ${completed}/${total}`);
  }
}
const features = [];
for (const offset of pages) features.push(...JSON.parse(await readFile(resolve(work, `${offset}.json`), "utf8")));
if (features.length !== total || new Set(features.map((row) => row.id)).size !== total) throw new Error("Duplicate river IDs");
const check = await read("rivers?limit=1");
if (check.total !== total) throw new Error("Rivers changed during preparation");
const result = { source, prepared_at: new Date().toISOString(), source_crs: "EPSG:4326", display_tolerance_m_3857: 50, total, features };
await writeFile(resolve(directory, "rivers.json.tmp"), JSON.stringify(result), "utf8");
await rename(resolve(directory, "rivers.json.tmp"), resolve(directory, "rivers.json"));
console.log(`Published ${total} rivers; ${features.filter((row) => !row.properties.district_paths.length).length} records do not intersect administrative districts`);
