import GeoJSONReader from "jsts/org/locationtech/jts/io/GeoJSONReader.js";
import GeoJSONWriter from "jsts/org/locationtech/jts/io/GeoJSONWriter.js";
import GeometryFactory from "jsts/org/locationtech/jts/geom/GeometryFactory.js";
import type Geometry from "jsts/org/locationtech/jts/geom/Geometry.js";
import IsValidOp from "jsts/org/locationtech/jts/operation/valid/IsValidOp.js";
import TopologyPreservingSimplifier from "jsts/org/locationtech/jts/simplify/TopologyPreservingSimplifier.js";
import type { MultiPolygon, Polygon, Position } from "geojson";

export type AdministrativeGeometry = Polygon | MultiPolygon;
const radius = 6378137;
const radians = Math.PI / 180;

function transform(geometry: AdministrativeGeometry, inverse: boolean, round = false): AdministrativeGeometry {
  const point = (position: Position): Position => {
    const [x, y] = position;
    if (!Number.isFinite(x) || !Number.isFinite(y)) throw new Error("Koordinat batas tidak valid.");
    if (inverse) return [x / radius / radians, (2 * Math.atan(Math.exp(y / radius)) - Math.PI / 2) / radians].map((value) => round ? Math.round(value * 1e6) / 1e6 : value);
    if (Math.abs(x) > 180 || Math.abs(y) >= 85.051129) throw new Error("CRS batas wilayah tidak sesuai EPSG:4326.");
    return [radius * x * radians, radius * Math.log(Math.tan(Math.PI / 4 + y * radians / 2))];
  };
  const polygon = (rings: Position[][]) => rings.map((ring) => ring.map(point));
  if (geometry.type === "Polygon") return { type: "Polygon", coordinates: polygon(geometry.coordinates) };
  if (geometry.type === "MultiPolygon") return { type: "MultiPolygon", coordinates: geometry.coordinates.map(polygon) };
  throw new Error("Geometri administratif tidak didukung.");
}

/** EPSG:4326 → EPSG:3857, display generalization at 100 projected metres, then validated EPSG:4326 at six decimals. */
export function simplifyBoundary(geometry: AdministrativeGeometry): AdministrativeGeometry {
  const reader = new GeoJSONReader(new GeometryFactory());
  const projected = reader.read(transform(geometry, false)) as Geometry;
  if (!IsValidOp.isValid(projected)) throw new Error("Geometri sumber tidak valid.");
  const simplified = TopologyPreservingSimplifier.simplify(projected, 100) as Geometry;
  if (!IsValidOp.isValid(simplified)) throw new Error("Generalisasi geometri tidak valid.");
  const projectedJSON = new GeoJSONWriter().write(simplified) as AdministrativeGeometry;
  const rounded = transform(projectedJSON, true, true);
  const geographic = IsValidOp.isValid(reader.read(rounded)) ? rounded : transform(projectedJSON, true);
  if (!IsValidOp.isValid(reader.read(geographic))) throw new Error("Geometri hasil transformasi tidak valid.");
  return geographic;
}

