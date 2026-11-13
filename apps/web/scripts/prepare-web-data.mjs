import { mkdir, readFile, writeFile, rename } from "node:fs/promises";
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
  await save("catalog", {
    regencies: regencies.map(({ id, name }) => ({ id, name })),
    districts: districts.map(({ id, name, regency_id }) => ({ id, name, regency_id })),
  });
  console.log(`Validated ${regencies.length} regencies and ${districts.length} districts`);
}
async function facilities() {
  const aggregate = await fetch(`${source}/api/v1/flood/facilities`, { signal: AbortSignal.timeout(15_000) });
  if (aggregate.ok && (await aggregate.json()).data_kind === "historical_damage") {
    console.log("Live facility aggregate available; offline facility projection is unnecessary");
    return;
  }
  if (aggregate.status !== 404 && aggregate.status !== 501) throw new Error("Facility aggregate contract unavailable");
  const statistics = await read("flood/statistics");
  const total = statistics.summary.total_events;
  if (statistics.by_year.reduce((sum, row) => sum + row.total_events, 0) !== total) throw new Error("Undated events require stable backend pagination");
  const { regencies } = JSON.parse(await readFile(resolve(directory, "catalog.json"), "utf8"));
  // The old API has no ID tie-breaker. Partition dates before requesting more than one page.
  async function interval(from, to, regency) {
    const query = new URLSearchParams({ start_date: from + "T00:00:00", end_date: to + "T23:59:59.999999", limit: "100" });
    if (regency !== undefined) query.set("regency_id", String(regency));
    const page = await read(`flood/events?${query}`);
    if (!Array.isArray(page.items) || !Number.isSafeInteger(page.total) || page.total < 0) throw new Error("Invalid event list");
    if (page.total <= 100) {
      if (page.items.length !== page.total || new Set(page.items.map((row) => row.id)).size !== page.total) throw new Error("Incomplete event interval");
      return page.items;
    }
    if (from === to) {
      if (regency !== undefined) throw new Error("More than 100 same-day events require updated backend pagination");
      const rows = [];
      for (const row of regencies) rows.push(...await interval(from, to, row.id));
      if (rows.length !== page.total) throw new Error("Unlocated events require stable backend pagination");
      return rows;
    }
    const start = Date.parse(from), end = Date.parse(to);
    const middle = start + Math.floor((end - start) / 86400000 / 2) * 86400000;
    const left = await interval(from, new Date(middle).toISOString().slice(0, 10), regency);
    const right = await interval(new Date(middle + 86400000).toISOString().slice(0, 10), to, regency);
    if (left.length + right.length !== page.total) throw new Error("Events changed during preparation");
    return [...left, ...right];
  }
  const events = [];
  for (const { year, total_events } of statistics.by_year) {
    const rows = await interval(`${year}-01-01`, `${year}-12-31`);
    if (rows.length !== total_events) throw new Error("Year coverage changed");
    events.push(...rows);
  }
  if (events.length !== total || new Set(events.map((row) => row.id)).size !== total) throw new Error("Incomplete event coverage");
  if (events.some((event) => !Number.isSafeInteger(event.id) || event.id < 1 || (event.regency_id != null && (!Number.isSafeInteger(event.regency_id) || event.regency_id < 1)) || (event.event_datetime != null && !Number.isFinite(Date.parse(event.event_datetime))))) throw new Error("Invalid event metadata");
  let checkpoint;
  try { checkpoint = JSON.parse(await readFile(resolve(directory, "facilities-progress.json"), "utf8")); }
  catch (error) { if (error.code !== "ENOENT") throw error; }
  const reusable = process.argv.includes("--resume") && checkpoint?.done?.length < total && checkpoint?.source === source && checkpoint.total_events === total && checkpoint.last_event === statistics.summary.last_event;
  const done = new Set(reusable ? checkpoint.done : []);
  const expected = new Set(events.map((row) => row.id));
  if ([...done].some((id) => !expected.has(id))) throw new Error("Invalid checkpoint coverage");
  const groups = new Map(reusable ? checkpoint.groups : []);
  const remaining = events.filter((row) => !done.has(row.id));
  const fields = { health: "health_facilities_damaged", education: "schools_damaged", worship: "religious_facilities_damaged" };
  for (let offset = 0; offset < remaining.length; offset += 4) {
    const batch = remaining.slice(offset, offset + 4);
    const details = await Promise.all(batch.map((event) => read(`flood/events/${event.id}`)));
    for (let index = 0; index < batch.length; index++) {
      const event = batch[index], detail = details[index];
      if (detail.id !== event.id || !Array.isArray(detail.impacts)) throw new Error("Invalid event detail");
      const date = event.event_datetime?.slice(0, 10) ?? null;
      const key = JSON.stringify([event.regency_id, date]);
      const group = groups.get(key) || { regency_id: event.regency_id ?? null, date, health: 0, education: 0, worship: 0 };
      for (const [key, field] of Object.entries(fields)) {
        if (!detail.impacts.length) group[key] = null;
        for (const impact of detail.impacts) {
          const value = impact[field];
          if (value == null) group[key] = null;
          else if (!Number.isSafeInteger(value) || value < 0) throw new Error("Invalid facility count");
          else if (group[key] !== null) group[key] += value;
        }
      }
      groups.set(key, group);
      done.add(event.id);
    }
    if (offset % 100 === 0 || done.size === total) {
      await save("facilities-progress", { total_events: total, last_event: statistics.summary.last_event, done: [...done], groups: [...groups] });
      console.log(`Facilities ${done.size}/${total}`);
    }
  }
  const check = await read("flood/statistics");
  if (check.summary.total_events !== total) throw new Error("Events changed during preparation");
  await save("facilities", { data_kind: "historical_damage", total_events: total, last_event: check.summary.last_event, groups: [...groups.values()] });
}
const task = process.argv[2];
if (task === "geography" || task === "all") await geography();
if (task === "facilities" || task === "all") await facilities();
if (!["all", "geography", "facilities"].includes(task)) throw new Error("Choose geography, facilities or all");
