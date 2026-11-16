import GeoJSONReader from "jsts/org/locationtech/jts/io/GeoJSONReader.js";
import GeoJSONWriter from "jsts/org/locationtech/jts/io/GeoJSONWriter.js";
import GeometryFactory from "jsts/org/locationtech/jts/geom/GeometryFactory.js";
import IndexedPointInAreaLocator from "jsts/org/locationtech/jts/algorithm/locate/IndexedPointInAreaLocator.js";
import FastSegmentSetIntersectionFinder from "jsts/org/locationtech/jts/noding/FastSegmentSetIntersectionFinder.js";
import SegmentStringUtil from "jsts/org/locationtech/jts/noding/SegmentStringUtil.js";
import Coordinate from "jsts/org/locationtech/jts/geom/Coordinate.js";
import Location from "jsts/org/locationtech/jts/geom/Location.js";
import STRtree from "jsts/org/locationtech/jts/index/strtree/STRtree.js";
import IsValidOp from "jsts/org/locationtech/jts/operation/valid/IsValidOp.js";
import TopologyPreservingSimplifier from "jsts/org/locationtech/jts/simplify/TopologyPreservingSimplifier.js";
import type Geometry from "jsts/org/locationtech/jts/geom/Geometry.js";
import type { LineString, MultiLineString, Polygon, MultiPolygon } from "geojson";
import type { RiverFeature } from "./types";

const reader = new GeoJSONReader(new GeometryFactory());
export function createDistrictIndex(rows: { id: number; regency_id: number; geom: Polygon | MultiPolygon }[]) {
  const index = new STRtree();
  for (const row of rows) {
    const geometry = reader.read(row.geom) as Geometry;
    if (!IsValidOp.isValid(geometry)) throw new Error(`Invalid district geometry ${row.id}`);
    index.insert(geometry.getEnvelopeInternal(), { id: row.id, regency_id: row.regency_id, geometry, locator: new IndexedPointInAreaLocator(geometry), finder: null });
  }
  return index;
}
export function prepareRiver(row: { id: number; name: string | null; river_type: string | null; geom: MultiLineString }, index: STRtree): RiverFeature {
  if (!Number.isSafeInteger(row.id) || row.id < 1 || row.geom?.type !== "MultiLineString" || !row.geom.coordinates.length || (row.name !== null && typeof row.name !== "string") || (row.river_type !== null && typeof row.river_type !== "string")) throw new Error("Invalid river record");
  const coordinates = row.geom.coordinates.map((line) => {
    if (line.length < 2) throw new Error("Empty river line");
    return line.map(([lng, lat]) => {
      if (!Number.isFinite(lng) || !Number.isFinite(lat) || Math.abs(lng) > 180 || Math.abs(lat) >= 85.051129) throw new Error("Invalid EPSG:4326 river coordinates");
      return [lng, lat];
    });
  });
  const raw = reader.read({ type: "MultiLineString", coordinates }) as Geometry;
  if (!IsValidOp.isValid(raw)) throw new Error(`Invalid river geometry ${row.id}`);
  const segments = SegmentStringUtil.extractSegmentStrings(raw);
  const matches = index.query(raw.getEnvelopeInternal()).toArray().filter((district: { geometry: Geometry; locator: IndexedPointInAreaLocator; finder: FastSegmentSetIntersectionFinder | null }) => {
    if (coordinates.some((line) => district.locator.locate(new Coordinate(...line[0])) !== Location.EXTERIOR)) return true;
    district.finder ??= new FastSegmentSetIntersectionFinder(SegmentStringUtil.extractSegmentStrings(district.geometry));
    return district.finder.intersects(segments);
  });
  const projected = reader.read({ type: "MultiLineString", coordinates: coordinates.map((line) => line.map(([lng, lat]) => [6378137 * lng * Math.PI / 180, 6378137 * Math.log(Math.tan(Math.PI / 4 + lat * Math.PI / 360))])) }) as Geometry;
  const simplified = TopologyPreservingSimplifier.simplify(projected, 50) as Geometry;
  const json = new GeoJSONWriter().write(simplified) as LineString | MultiLineString;
  const lines = json.type === "LineString" ? [json.coordinates] : json.coordinates;
  const geographic = lines.map((line) => line.map(([x, y]) => [x / 6378137 * 180 / Math.PI, (2 * Math.atan(Math.exp(y / 6378137)) - Math.PI / 2) * 180 / Math.PI]));
  let geometry: MultiLineString = { type: "MultiLineString", coordinates: geographic.map((line) => line.map((point) => point.map((n) => Math.round(n * 1e6) / 1e6))) };
  if (!IsValidOp.isValid(reader.read(geometry))) geometry = { type: "MultiLineString", coordinates: geographic };
  if (!IsValidOp.isValid(reader.read(geometry))) throw new Error(`Invalid river display geometry ${row.id}`);
  const envelope = raw.getEnvelopeInternal();
  return { type: "Feature", id: row.id, bbox: [envelope.getMinX(), envelope.getMinY(), envelope.getMaxX(), envelope.getMaxY()], properties: { id: row.id, name: row.name?.trim() || null, river_type: row.river_type, district_paths: matches.map((district: { id: number; regency_id: number }) => `${district.regency_id}/${district.id}`) }, geometry };
}
