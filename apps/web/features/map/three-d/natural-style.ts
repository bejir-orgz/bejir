import type * as maplibregl from "maplibre-gl";
import type { Map as MapLibreMap } from "maplibre-gl";
import mlcontour from "maplibre-contour";
import { westJavaBasemap } from "../basemap";

export const OPENFREEMAP_LIBERTY_STYLE = "https://tiles.openfreemap.org/styles/liberty";
const AWS_TERRARIUM_URL = "https://elevation-tiles-prod.s3.amazonaws.com/terrarium/{z}/{x}/{y}.png";
const ESRI_WORLD_IMAGERY_URL =
  "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}";

export const MAPLIBRE_IDS = {
  demSource: "sibajawa-dem-source",
  hillshadeDemSource: "sibajawa-hillshade-dem-source",
  contourSource: "sibajawa-contour-source",
  satelliteSource: "sibajawa-satellite-source",
  satelliteLayer: "sibajawa-satellite-layer",
  streetLayer: "sibajawa-osm-streets",
  hillshadeLayer: "sibajawa-hillshade-layer",
  contourLinesLayer: "sibajawa-contour-lines",
  contourLabelsLayer: "sibajawa-contour-labels",
  buildings3dLayer: "sibajawa-3d-buildings",
  thematicSource: "sibajawa-thematic-source",
  thematicFillLayer: "sibajawa-thematic-fill",
  thematicLineLayer: "sibajawa-thematic-line",
  riversSource: "sibajawa-rivers-source",
  riversLineLayer: "sibajawa-rivers-line",
  simHitSource: "sibajawa-sim-hit-source",
  simHitFillLayer: "sibajawa-sim-hit-fill",
  simHitLineLayer: "sibajawa-sim-hit-line",
  simCanvasSource: "sibajawa-sim-canvas-source",
  simCanvasLayer: "sibajawa-sim-canvas-layer",
  simOutlineSource: "sibajawa-sim-outline-source",
  simOutlineCasingLayer: "sibajawa-sim-outline-casing",
  simOutlineStrokeLayer: "sibajawa-sim-outline-stroke",
  simPointSource: "sibajawa-sim-point-source",
  simPointLayer: "sibajawa-sim-point-layer",
  boundarySource: "sibajawa-boundary-source",
  boundaryFillLayer: "sibajawa-boundary-fill",
  boundaryLineLayer: "sibajawa-boundary-line",
  evacRouteSource: "sibajawa-evac-route-source",
  evacRouteCasingLayer: "sibajawa-evac-route-casing",
  evacRouteLineLayer: "sibajawa-evac-route-line",
  evacRoutePointsSource: "sibajawa-evac-route-points-source",
  evacRoutePointsLayer: "sibajawa-evac-route-points-layer",
  evacSitesSource: "sibajawa-evac-sites-source",
  evacSitesLayer: "sibajawa-evac-sites-layer",
} as const;

let sharedDemSource: InstanceType<typeof mlcontour.DemSource> | null = null;
let protocolRegistered = false;

export function ensureContourProtocol(lib: typeof maplibregl): InstanceType<typeof mlcontour.DemSource> {
  lib.setWorkerUrl("/maplibre/maplibre-gl-worker.mjs");
  if (!sharedDemSource) {
    sharedDemSource = new mlcontour.DemSource({
      url: AWS_TERRARIUM_URL,
      encoding: "terrarium",
      maxzoom: 13,
      worker: false,
    });
  }
  if (!protocolRegistered) {
    lib.addProtocol(sharedDemSource.sharedDemProtocolId, sharedDemSource.sharedDemProtocolV4);
    lib.addProtocol(sharedDemSource.contourProtocolId, sharedDemSource.contourProtocolV4);
    protocolRegistered = true;
  }
  return sharedDemSource;
}

/** Finds the first text symbol layer so buildings and contours stay cleanly beneath place/road labels. */
export function findFirstLabelLayerId(map: MapLibreMap): string | undefined {
  const layers = map.getStyle().layers;
  for (const layer of layers) {
    if (layer.type === "symbol" && layer.layout && "text-field" in layer.layout) {
      return layer.id;
    }
  }
  return undefined;
}

/** Finds the first road/transportation layer so satellite & hillshade sit beneath roads and labels. */
function findFirstRoadLayerId(map: MapLibreMap): string | undefined {
  const layers = map.getStyle().layers;
  for (const layer of layers) {
    if (
      layer.type === "line" &&
      (layer.id.includes("road") || layer.id.includes("highway") || layer.id.includes("tunnel"))
    ) {
      return layer.id;
    }
  }
  return findFirstLabelLayerId(map);
}

/** Installs 3D terrain mesh, hillshade, dynamic elevation contours, satellite toggle, atmospheric sky, and 3D buildings. */
export function installNatural3DLayers(
  map: MapLibreMap,
  demSource: InstanceType<typeof mlcontour.DemSource>,
  options: {
    satellite: boolean;
    showContours: boolean;
    showBuildings3d: boolean;
  },
): string | undefined {
  const firstLabelId = findFirstLabelLayerId(map);
  const firstRoadId = findFirstRoadLayerId(map);

  // Hide any default building-3d layer from Liberty style so our styled extrusion layer owns z-order above simulation.
  for (const layer of map.getStyle().layers) {
    if (layer.id === "building-3d" || (layer.type === "fill-extrusion" && layer.id.includes("building"))) {
      map.setLayoutProperty(layer.id, "visibility", "none");
    }
  }

  if (!map.getSource(MAPLIBRE_IDS.demSource)) {
    map.addSource(MAPLIBRE_IDS.demSource, {
      type: "raster-dem",
      encoding: "terrarium",
      tiles: [demSource.sharedDemProtocolUrl],
      maxzoom: 13,
      tileSize: 256,
    });
  }

  // Separate raster-dem source pointing to the same cached sharedDemProtocolUrl avoids MapLibre's terrain/hillshade sharing warning.
  if (!map.getSource(MAPLIBRE_IDS.hillshadeDemSource)) {
    map.addSource(MAPLIBRE_IDS.hillshadeDemSource, {
      type: "raster-dem",
      encoding: "terrarium",
      tiles: [demSource.sharedDemProtocolUrl],
      maxzoom: 13,
      tileSize: 256,
    });
  }

  if (!map.getSource(MAPLIBRE_IDS.contourSource)) {
    map.addSource(MAPLIBRE_IDS.contourSource, {
      type: "vector",
      tiles: [
        demSource.contourProtocolUrl({
          multiplier: 1,
          thresholds: {
            9: [250, 1000],
            11: [100, 500],
            12: [50, 250],
            14: [20, 100],
          },
          elevationKey: "ele",
          levelKey: "level",
          contourLayer: "contours",
          overzoom: 1,
        }),
      ],
      maxzoom: 16,
    });
  }

  if (!map.getSource(MAPLIBRE_IDS.satelliteSource)) {
    map.addSource(MAPLIBRE_IDS.satelliteSource, {
      type: "raster",
      tiles: [ESRI_WORLD_IMAGERY_URL],
      tileSize: 256,
      maxzoom: 18,
      attribution: "Tiles &copy; Esri, Maxar, Earthstar Geographics",
    });
  }

  if (!map.getLayer(MAPLIBRE_IDS.satelliteLayer)) {
    map.addLayer(
      {
        id: MAPLIBRE_IDS.satelliteLayer,
        type: "raster",
        source: MAPLIBRE_IDS.satelliteSource,
        layout: {
          visibility: options.satellite ? "visible" : "none",
        },
        paint: {
          "raster-saturation": -0.08,
          "raster-contrast": 0.06,
        },
      },
      firstRoadId,
    );
  }

  if (!map.getLayer(MAPLIBRE_IDS.hillshadeLayer)) {
    map.addLayer(
      {
        id: MAPLIBRE_IDS.hillshadeLayer,
        type: "hillshade",
        source: MAPLIBRE_IDS.hillshadeDemSource,
        paint: {
          "hillshade-exaggeration": 0.38,
          "hillshade-shadow-color": "#1e293b",
          "hillshade-highlight-color": "#fefce8",
          "hillshade-accent-color": "#334155",
          "hillshade-illumination-direction": 315,
        },
      },
      firstRoadId,
    );
  }

  if (!map.getLayer(MAPLIBRE_IDS.contourLinesLayer)) {
    map.addLayer(
      {
        id: MAPLIBRE_IDS.contourLinesLayer,
        type: "line",
        source: MAPLIBRE_IDS.contourSource,
        "source-layer": "contours",
        minzoom: 9,
        layout: {
          visibility: options.showContours ? "visible" : "none",
          "line-join": "round",
          "line-cap": "round",
        },
        paint: {
          "line-color": [
            "match",
            ["get", "level"],
            1,
            "rgba(92, 68, 44, 0.56)",
            "rgba(120, 92, 64, 0.28)",
          ],
          "line-width": ["match", ["get", "level"], 1, 1.1, 0.55],
        },
      },
      firstLabelId,
    );
  }

  map.addSource(MAPLIBRE_IDS.streetLayer, {
    type: "raster",
    tiles: [westJavaBasemap.tileUrl],
    tileSize: 256,
    maxzoom: westJavaBasemap.maxZoom,
    attribution: westJavaBasemap.attribution,
  });
  map.addLayer(
    {
      id: MAPLIBRE_IDS.streetLayer,
      type: "raster",
      source: MAPLIBRE_IDS.streetLayer,
      layout: { visibility: "none" },
    },
    MAPLIBRE_IDS.contourLinesLayer,
  );

  if (!map.getLayer(MAPLIBRE_IDS.buildings3dLayer) && map.getSource("openmaptiles")) {
    map.addLayer(
      {
        id: MAPLIBRE_IDS.buildings3dLayer,
        type: "fill-extrusion",
        source: "openmaptiles",
        "source-layer": "building",
        minzoom: 13.0,
        filter: ["!=", ["get", "hide_3d"], true],
        layout: {
          visibility: options.showBuildings3d ? "visible" : "none",
        },
        paint: {
          "fill-extrusion-color": [
            "interpolate",
            ["linear"],
            ["coalesce", ["get", "render_height"], 6],
            0,
            "#f5f5f4",
            12,
            "#e7e5e4",
            32,
            "#cbd5e1",
            75,
            "#94a3b8",
          ],
          "fill-extrusion-height": [
            "interpolate",
            ["linear"],
            ["zoom"],
            13.0,
            0,
            13.6,
            ["coalesce", ["get", "render_height"], 6],
          ],
          "fill-extrusion-base": [
            "interpolate",
            ["linear"],
            ["zoom"],
            13.0,
            0,
            13.6,
            ["coalesce", ["get", "render_min_height"], 0],
          ],
          "fill-extrusion-opacity": 0.88,
          "fill-extrusion-vertical-gradient": true,
        },
      },
      firstLabelId,
    );
  }

  if (!map.getLayer(MAPLIBRE_IDS.contourLabelsLayer)) {
    map.addLayer({
      id: MAPLIBRE_IDS.contourLabelsLayer,
      type: "symbol",
      source: MAPLIBRE_IDS.contourSource,
      "source-layer": "contours",
      minzoom: 11,
      filter: [">", ["get", "level"], 0],
      layout: {
        visibility: options.showContours ? "visible" : "none",
        "symbol-placement": "line",
        "text-size": 10,
        "text-field": ["concat", ["number-format", ["get", "ele"], {}], " m"],
        "text-font": ["Noto Sans Regular"],
        "text-max-angle": 25,
      },
      paint: {
        "text-color": "#574330",
        "text-halo-color": "rgba(255, 255, 255, 0.88)",
        "text-halo-width": 1.2,
      },
    });
  }

  map.setTerrain({ source: MAPLIBRE_IDS.demSource, exaggeration: 1.35 });
  map.setSky({
    "sky-color": "#bfdbfe",
    "sky-horizon-blend": 0.55,
    "horizon-color": "#f8fafc",
    "horizon-fog-blend": 0.45,
    "fog-color": "#e2e8f0",
    "fog-ground-blend": 0.35,
  });

  return map.getLayer(MAPLIBRE_IDS.buildings3dLayer) ? MAPLIBRE_IDS.buildings3dLayer : firstLabelId;
}
