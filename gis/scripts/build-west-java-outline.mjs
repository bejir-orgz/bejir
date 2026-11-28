import assert from "node:assert/strict";
import { readFile, writeFile } from "node:fs/promises";
import GeoJSONReader from "../../apps/web/node_modules/jsts/org/locationtech/jts/io/GeoJSONReader.js";
import GeoJSONWriter from "../../apps/web/node_modules/jsts/org/locationtech/jts/io/GeoJSONWriter.js";
import UnaryUnionOp from "../../apps/web/node_modules/jsts/org/locationtech/jts/operation/union/UnaryUnionOp.js";
import IsValidOp from "../../apps/web/node_modules/jsts/org/locationtech/jts/operation/valid/IsValidOp.js";
import TopologyPreservingSimplifier from "../../apps/web/node_modules/jsts/org/locationtech/jts/simplify/TopologyPreservingSimplifier.js";

// Source: Bejir GET /api/v1/geography/regencies?province_code=32, acquired 2026-11-28.
// Usage: node gis/scripts/build-west-java-outline.mjs <regencies.json>
// Source and output are EPSG:4326. Dissolve and simplify in EPSG:3857 for display.
const source = JSON.parse(await readFile(process.argv[2], "utf8"));
assert.equal(source.length, 27);
assert.equal(new Set(source.map(({ id }) => id)).size, 27);
assert.ok(source.every(({ province_code, geom }) => province_code === "32" && geom?.type === "MultiPolygon"));

const degreesToRadians = Math.PI / 180;
const radius = 6378137;
const project = ([lng, lat]) => [
  radius * lng * degreesToRadians,
  radius * Math.log(Math.tan(Math.PI / 4 + lat * degreesToRadians / 2)),
];
const unproject = ([x, y]) => [
  x / radius / degreesToRadians,
  (2 * Math.atan(Math.exp(y / radius)) - Math.PI / 2) / degreesToRadians,
].map((value) => Number(value.toFixed(5)));
const transform = (polygons, convert) => polygons.map((polygon) => polygon.map((ring) => ring.map(convert)));

const reader = new GeoJSONReader();
const geometry = reader.read({
  type: "MultiPolygon",
  coordinates: transform(source.flatMap(({ geom }) => geom.coordinates), project),
});
const merged = UnaryUnionOp.union(geometry);
const simplified = TopologyPreservingSimplifier.simplify(merged, 100);
const outline = new GeoJSONWriter().write(simplified);
const polygons = outline.type === "Polygon" ? [outline.coordinates] : outline.coordinates;
const result = { type: "MultiPolygon", coordinates: transform(polygons, unproject) };
assert.ok(result.coordinates.length && IsValidOp.isValid(reader.read(result)));
assert.ok(Math.abs(simplified.getArea() - merged.getArea()) / merged.getArea() < 0.01);
await writeFile(new URL("../../apps/web/features/map/west-java-outline.json", import.meta.url), JSON.stringify(result) + "\n");
