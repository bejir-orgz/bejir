import type { Feature, MultiPolygon } from "geojson";
import outline from "./west-java-outline.json";

export const westJavaBoundary: Feature<MultiPolygon> = {
  type: "Feature",
  geometry: { type: "MultiPolygon", coordinates: outline.coordinates },
  properties: { name: "Jawa Barat" },
};

export const westJavaBoundaryColor = "#155DFC";
export const westJavaBoundaryWidth = 2.5;
