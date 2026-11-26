"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type {
  CanvasSource,
  GeoJSONSource,
  LngLatBoundsLike,
  Map as MapLibreMap,
  MapMouseEvent,
  Popup,
} from "maplibre-gl";
import type { Feature, FeatureCollection, Geometry, MultiLineString, MultiPolygon, Polygon } from "geojson";
import {
  IconCompass,
  IconCurrentLocation,
  IconMinus,
  IconPlus,
} from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { westJavaBasemap } from "../basemap";
import type { MapEngineMode } from "./webgl-support";
import {
  ensureContourProtocol,
  installNatural3DLayers,
  MAPLIBRE_IDS,
  OPENFREEMAP_LIBERTY_STYLE,
} from "./natural-style";
import type { ThematicCollection, ThematicProperties } from "@/features/geography/thematic-geometry";
import { isRegionSelected } from "@/features/webgis/region-tree";
import { landCoverColor } from "@/features/geography/land-cover-colors";
import { classColors, classLabels } from "@/features/geography/aggregation";
import type { EvacuationSite } from "@/features/evacuation/types";
import { fetchNearestEvacuationSite, formatStraightDistance } from "@/features/evacuation/nearby-fallback";
import { riverViewportStatusMessage, type RiverViewportStatus } from "@/features/rivers/data";
import type { RiverProperties } from "@/features/rivers/types";
import { requestBackend } from "@/lib/api/client";
import type { RouteRequest, RouteResponse } from "@/lib/api/schemas";
import { useRegionSelection } from "@/features/regions/region-selection";
import type { SelectedSimRegion } from "@/features/simulation/map-simulation-layer";
import {
  computeSimulationStats,
  findNearestSafeEvacuationSite,
  geometryBounds,
  loadTerrainPack,
  pointInGeometry,
  rasterizeGeometryMask,
  renderSimulationToImageData,
  samplePointMetrics,
  type DebrisSeed,
  type RegionRasterMask,
  type SimulationMode,
  type SimulationParams,
  type SimulationScope,
  type SimulationStats,
  type TerrainPack,
} from "@/features/simulation/terrain-pack";
import "maplibre-gl/dist/maplibre-gl.css";

const thematicLabels: Record<string, string> = {
  rainfall: "Parameter rata-rata hujan",
  dem: "Rata-rata elevasi",
  susceptibility: "Kelas kerawanan",
  "land-cover": "Tutupan lahan dominan",
};

const emptyCollection: FeatureCollection = { type: "FeatureCollection", features: [] };
const simMaskCache3d = new Map<string, RegionRasterMask>();

interface ProjectedRouteOverlay {
  lines: [number, number][][];
  origin: [number, number];
  dest: [number, number];
  color: string;
  dashed: boolean;
  destLabel: string;
}

/** Extracts coordinate chains from GeoJSON route geometry for screen-space 3D projection above buildings. */
function extractLineChains(geometry: Geometry): [number, number][][] {
  if (geometry.type === "LineString") {
    return [geometry.coordinates.map((pt) => [pt[0], pt[1]])];
  }
  if (geometry.type === "MultiLineString") {
    return geometry.coordinates.map((line) => line.map((pt) => [pt[0], pt[1]]));
  }
  return [];
}

/** Subdivides a straight guide line so map.project() follows 3D hill curvature cleanly above rooftops. */
function sampleGuideLine(origin: [number, number], dest: [number, number], steps = 16): [number, number][] {
  const pts: [number, number][] = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    pts.push([origin[0] + (dest[0] - origin[0]) * t, origin[1] + (dest[1] - origin[1]) * t]);
  }
  return pts;
}

function thematicFillColor(id: string, row: ThematicProperties, range: [number, number]): string {
  if (id === "susceptibility") {
    return row.kelas_dominan_v2 == null ? "#a3a3a3" : classColors[row.kelas_dominan_v2 - 1] ?? "#a3a3a3";
  }
  if (id === "land-cover") return landCoverColor(row.landcover_dominan);
  const value = id === "dem" ? row.mean_elevasi_m : row.mean_hujan_mm;
  if (value == null) return "#a3a3a3";
  const [min, max] = range;
  const ratio = max === min ? 0.5 : (value - min) / (max - min);
  return id === "dem"
    ? `hsl(${120 - ratio * 100} 45% ${80 - ratio * 45}%)`
    : `hsl(215 80% ${92 - ratio * 57}%)`;
}

function thematicTooltipText(id: string, row: ThematicProperties): string {
  const value =
    id === "susceptibility"
      ? classLabels[(row.kelas_dominan_v2 ?? 0) - 1] ?? "—"
      : id === "land-cover"
        ? row.landcover_dominan || "—"
        : id === "dem"
          ? row.mean_elevasi_m == null
            ? "—"
            : `${row.mean_elevasi_m.toLocaleString("id-ID", { maximumFractionDigits: 1 })} m`
          : row.mean_hujan_mm == null
            ? "—"
            : `${row.mean_hujan_mm.toLocaleString("id-ID", { maximumFractionDigits: 1 })} mm`;
  return `Kecamatan ${row.district_name || row.district_id} · ${thematicLabels[id]}: ${value}`;
}

function isGeoJsonSource(source: unknown): source is GeoJSONSource {
  return typeof source === "object" && source !== null && "setData" in source;
}

function isCanvasSource(source: unknown): source is CanvasSource {
  return (
    typeof source === "object" &&
    source !== null &&
    "play" in source &&
    "pause" in source &&
    "getCanvas" in source
  );
}

function isGeometry(value: unknown): value is Geometry {
  return (
    typeof value === "object" &&
    value !== null &&
    "type" in value &&
    typeof value.type === "string" &&
    ["Point", "MultiPoint", "LineString", "MultiLineString", "Polygon", "MultiPolygon"].includes(value.type)
  );
}

function boundsOfGeometry(geometry: Geometry): [[number, number], [number, number]] | null {
  let minLng = Infinity;
  let maxLng = -Infinity;
  let minLat = Infinity;
  let maxLat = -Infinity;
  const visitCoord = (coord: number[]) => {
    if (coord.length < 2) return;
    if (coord[0] < minLng) minLng = coord[0];
    if (coord[0] > maxLng) maxLng = coord[0];
    if (coord[1] < minLat) minLat = coord[1];
    if (coord[1] > maxLat) maxLat = coord[1];
  };
  if (geometry.type === "Point") visitCoord(geometry.coordinates);
  else if (geometry.type === "MultiPoint" || geometry.type === "LineString") {
    for (const c of geometry.coordinates) visitCoord(c);
  } else if (geometry.type === "MultiLineString" || geometry.type === "Polygon") {
    for (const ring of geometry.coordinates) for (const c of ring) visitCoord(c);
  } else if (geometry.type === "MultiPolygon") {
    for (const poly of geometry.coordinates) for (const ring of poly) for (const c of ring) visitCoord(c);
  }
  if (!Number.isFinite(minLng) || !Number.isFinite(minLat)) return null;
  return [
    [minLng, minLat],
    [maxLng, maxLat],
  ];
}

interface DebrisParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  tier: 2 | 3;
}

export function MapLibreWorkspaceMap({
  engineMode,
  onEngineModeChange,
  layerIds,
  regionIds,
  evacuationSites,
  evacuationEnabled,
  simulationOpen,
  simMode,
  simScope,
  simParams,
  simPaused,
  simTarget,
  focusRequest,
  safeEvacRequestNonce,
  onSafeEvacNoteChange,
  dataStatus,
  onSelectSimTarget,
  onSimRegionResolved,
  onSimStatsChange,
  onThematicStatus,
  onRegionStatus,
  onRiverStatus,
  onRouteStatus,
  onSimStatus,
}: {
  engineMode: "3d-natural" | "3d-satellite";
  onEngineModeChange: (mode: MapEngineMode) => void;
  layerIds: string[];
  regionIds: string[];
  evacuationSites: EvacuationSite[];
  evacuationEnabled: boolean;
  simulationOpen: boolean;
  simMode: SimulationMode;
  simScope: SimulationScope;
  simParams: SimulationParams;
  simPaused: boolean;
  simTarget: { regencyId: number; districtId: number | null; point: { lat: number; lng: number } | null } | null;
  focusRequest: { lat: number; lng: number; nonce: number } | null;
  safeEvacRequestNonce: number;
  onSafeEvacNoteChange: (note: string | null) => void;
  dataStatus?: { message: string; retry?: () => void };
  onSelectSimTarget: (target: { regencyId: number; districtId: number | null; point: { lat: number; lng: number } | null }) => void;
  onSimRegionResolved: (region: SelectedSimRegion | null) => void;
  onSimStatsChange: (stats: SimulationStats | null) => void;
  onThematicStatus: (status: { message: string; retry?: () => void } | undefined) => void;
  onRegionStatus: (status: { message: string } | undefined) => void;
  onRiverStatus: (status: { message: string; retry?: () => void } | undefined) => void;
  onRouteStatus: (status: { message: string } | undefined) => void;
  onSimStatus: (status: { message: string; retry?: () => void } | undefined) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const popupRef = useRef<Popup | null>(null);
  const simCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const routeOverlayRef = useRef<ProjectedRouteOverlay | null>(null);
  const routeCasingPathRef = useRef<SVGPathElement | null>(null);
  const routeStrokePathRef = useRef<SVGPathElement | null>(null);
  const routeOriginCircleRef = useRef<SVGCircleElement | null>(null);
  const routeDestGroupRef = useRef<SVGGElement | null>(null);
  const routeDestCircleRef = useRef<SVGCircleElement | null>(null);
  const routeDestLabelRef = useRef<SVGTextElement | null>(null);
  const routeDestPillRef = useRef<SVGRectElement | null>(null);
  const syncRouteOverlayRef = useRef<() => void>(() => {});
  const revealStartRef = useRef<number>(0);
  const lastRegionKeyRef = useRef<string | null>(null);

  const [mapReady, setMapReady] = useState(false);
  const [mapError, setMapError] = useState(false);
  const [zoom, setZoom] = useState(8);
  const [pitch, setPitch] = useState(32);
  const [bearing, setBearing] = useState(0);
  const [showContours, setShowContours] = useState(true);
  const [showBuildings3d, setShowBuildings3d] = useState(true);

  const [thematicCollection, setThematicCollection] = useState<ThematicCollection | null>(null);
  const [thematicAttempt, setThematicAttempt] = useState(0);
  const [pack, setPack] = useState<TerrainPack | null>(null);
  const [simAttempt, setSimAttempt] = useState(0);

  const { tree, toMapIds } = useRegionSelection();
  const regencyNames = useMemo(() => {
    const names = new Map<number, string>();
    const regencyNodes = tree.flatMap((root) => (root.children?.length ? root.children : [root]));
    for (const node of regencyNodes) {
      const mapped = toMapIds([node.id])[0];
      const id = Number(mapped);
      if (Number.isSafeInteger(id) && id > 0) names.set(id, node.name);
    }
    return names;
  }, [tree, toMapIds]);

  const activeThematicIds = useMemo(
    () => layerIds.filter((id) => id in thematicLabels),
    [layerIds],
  );
  const needsDistrictCollection = activeThematicIds.length > 0 || simulationOpen;
  const riversEnabled = layerIds.includes("rivers");

  // 1) Initialize MapLibre GL JS with Natural 3D Terrain, Contours, Sky, and 3D Buildings.
  useEffect(() => {
    let cancelled = false;
    let map: MapLibreMap | undefined;
    let observer: ResizeObserver | undefined;

    async function init() {
      if (!containerRef.current) return;
      try {
        const maplibregl = await import("maplibre-gl");
        if (cancelled || !containerRef.current) return;

        const demSource = ensureContourProtocol(maplibregl);
        const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        const initialPitch = reduced ? 0 : 32;

        const instance = new maplibregl.Map({
          container: containerRef.current,
          style: OPENFREEMAP_LIBERTY_STYLE,
          center: [107.62, -6.92],
          zoom: 8.2,
          minZoom: 6,
          maxZoom: 18.5,
          pitch: initialPitch,
          maxPitch: 68,
          bearing: 0,
          attributionControl: false,
          canvasContextAttributes: { antialias: true },
        });
        map = instance;
        mapRef.current = instance;

        instance.addControl(new maplibregl.AttributionControl({ compact: true }), "bottom-right");
        popupRef.current = new maplibregl.Popup({
          closeButton: false,
          closeOnClick: false,
          maxWidth: "280px",
          offset: 10,
        });

        instance.on("error", () => {
          // Individual tile timeouts are non-fatal; only fail if style never loads.
        });

        instance.on("load", () => {
          if (cancelled) return;
          const belowBuildingsId = installNatural3DLayers(instance, demSource, {
            satellite: engineMode === "3d-satellite",
            showContours: true,
            showBuildings3d: true,
          });

          // Install Sibajawa domain sources & layers in strict Z-order.
          const addGeoSource = (id: string) => {
            if (!instance.getSource(id)) instance.addSource(id, { type: "geojson", data: emptyCollection });
          };
          addGeoSource(MAPLIBRE_IDS.thematicSource);
          addGeoSource(MAPLIBRE_IDS.riversSource);
          addGeoSource(MAPLIBRE_IDS.simHitSource);
          addGeoSource(MAPLIBRE_IDS.simOutlineSource);
          addGeoSource(MAPLIBRE_IDS.simPointSource);
          addGeoSource(MAPLIBRE_IDS.boundarySource);
          addGeoSource(MAPLIBRE_IDS.evacRouteSource);
          addGeoSource(MAPLIBRE_IDS.evacRoutePointsSource);
          addGeoSource(MAPLIBRE_IDS.evacSitesSource);

          // Offscreen simulation canvas mounted directly underneath 3D buildings so water wraps 3D terrain around houses.
          const simCanvas = document.createElement("canvas");
          simCanvas.width = 768;
          simCanvas.height = 615;
          simCanvasRef.current = simCanvas;

          instance.addSource(MAPLIBRE_IDS.simCanvasSource, {
            type: "canvas",
            canvas: simCanvas,
            animate: false,
            coordinates: [
              [106.35, -5.88],
              [108.86, -5.88],
              [108.86, -7.85],
              [106.35, -7.85],
            ],
          });

          instance.addLayer(
            {
              id: MAPLIBRE_IDS.thematicFillLayer,
              type: "fill",
              source: MAPLIBRE_IDS.thematicSource,
              paint: {
                "fill-color": ["coalesce", ["get", "fillColor"], "#a3a3a3"],
                "fill-opacity": 0.68,
              },
            },
            belowBuildingsId,
          );
          instance.addLayer(
            {
              id: MAPLIBRE_IDS.thematicLineLayer,
              type: "line",
              source: MAPLIBRE_IDS.thematicSource,
              paint: {
                "line-color": "#475569",
                "line-width": 0.6,
                "line-opacity": 0.65,
              },
            },
            belowBuildingsId,
          );
          instance.addLayer(
            {
              id: MAPLIBRE_IDS.riversLineLayer,
              type: "line",
              source: MAPLIBRE_IDS.riversSource,
              paint: {
                "line-color": "#0284c7",
                "line-width": 2,
                "line-opacity": 0.88,
              },
            },
            belowBuildingsId,
          );
          instance.addLayer(
            {
              id: MAPLIBRE_IDS.simHitFillLayer,
              type: "fill",
              source: MAPLIBRE_IDS.simHitSource,
              paint: {
                "fill-color": "#2563eb",
                "fill-opacity": 0.02,
              },
            },
            belowBuildingsId,
          );
          instance.addLayer(
            {
              id: MAPLIBRE_IDS.simHitLineLayer,
              type: "line",
              source: MAPLIBRE_IDS.simHitSource,
              paint: {
                "line-color": "#334155",
                "line-width": 0.65,
                "line-opacity": 0.32,
              },
            },
            belowBuildingsId,
          );
          instance.addLayer(
            {
              id: MAPLIBRE_IDS.simCanvasLayer,
              type: "raster",
              source: MAPLIBRE_IDS.simCanvasSource,
              paint: {
                "raster-opacity": 0.88,
                "raster-fade-duration": 0,
              },
            },
            belowBuildingsId,
          );
          instance.addLayer(
            {
              id: MAPLIBRE_IDS.boundaryFillLayer,
              type: "fill",
              source: MAPLIBRE_IDS.boundarySource,
              paint: {
                "fill-color": "#3b82f6",
                "fill-opacity": 0.08,
              },
            },
            belowBuildingsId,
          );

          // Upper overlay layers (above 3D buildings so outlines, evacuation routes, and pins remain crisp).
          instance.addLayer({
            id: MAPLIBRE_IDS.boundaryLineLayer,
            type: "line",
            source: MAPLIBRE_IDS.boundarySource,
            paint: { "line-color": "#1d4ed8", "line-width": 2.4 },
          });
          instance.addLayer({
            id: MAPLIBRE_IDS.simOutlineCasingLayer,
            type: "line",
            source: MAPLIBRE_IDS.simOutlineSource,
            paint: { "line-color": "#ffffff", "line-width": 3, "line-opacity": 0.72 },
          });
          instance.addLayer({
            id: MAPLIBRE_IDS.simOutlineStrokeLayer,
            type: "line",
            source: MAPLIBRE_IDS.simOutlineSource,
            paint: { "line-color": "#1d4ed8", "line-width": 1.6, "line-opacity": 0.96 },
          });
          instance.addLayer({
            id: MAPLIBRE_IDS.evacSitesLayer,
            type: "circle",
            source: MAPLIBRE_IDS.evacSitesSource,
            paint: {
              "circle-radius": ["interpolate", ["linear"], ["zoom"], 8, 3.5, 13, 6, 16, 8],
              "circle-color": "#ffffff",
              "circle-stroke-color": "#15803d",
              "circle-stroke-width": 2,
              "circle-opacity": 0.96,
            },
          });
          instance.addLayer({
            id: MAPLIBRE_IDS.simPointLayer,
            type: "circle",
            source: MAPLIBRE_IDS.simPointSource,
            paint: {
              "circle-radius": 6,
              "circle-color": "#1d4ed8",
              "circle-stroke-color": "#ffffff",
              "circle-stroke-width": 2.5,
            },
          });
          instance.addLayer({
            id: MAPLIBRE_IDS.evacRouteCasingLayer,
            type: "line",
            source: MAPLIBRE_IDS.evacRouteSource,
            layout: { "line-join": "round", "line-cap": "round" },
            paint: { "line-color": "#ffffff", "line-width": 8, "line-opacity": 0.9 },
          });
          instance.addLayer({
            id: MAPLIBRE_IDS.evacRouteLineLayer,
            type: "line",
            source: MAPLIBRE_IDS.evacRouteSource,
            layout: { "line-join": "round", "line-cap": "round" },
            paint: { "line-color": "#2563eb", "line-width": 4.5, "line-opacity": 0.96 },
          });
          instance.addLayer({
            id: MAPLIBRE_IDS.evacRoutePointsLayer,
            type: "circle",
            source: MAPLIBRE_IDS.evacRoutePointsSource,
            paint: {
              "circle-radius": 7.5,
              "circle-color": ["match", ["get", "role"], "dest", "#16a34a", "#ffffff"],
              "circle-stroke-color": ["match", ["get", "role"], "dest", "#ffffff", "#111827"],
              "circle-stroke-width": 2.5,
            },
          });

          instance.resize();
          const bounds: LngLatBoundsLike = [
            [westJavaBasemap.bounds[0][1], westJavaBasemap.bounds[0][0]],
            [westJavaBasemap.bounds[1][1], westJavaBasemap.bounds[1][0]],
          ];
          instance.fitBounds(bounds, { padding: 28, pitch: initialPitch, duration: 0 });
          setZoom(instance.getZoom());
          setPitch(instance.getPitch());
          setBearing(instance.getBearing());
          setMapReady(true);
        });

        const syncRouteOverlay = () => {
          const data = routeOverlayRef.current;
          const casingEl = routeCasingPathRef.current;
          const strokeEl = routeStrokePathRef.current;
          const originEl = routeOriginCircleRef.current;
          const destGroupEl = routeDestGroupRef.current;
          const destCircleEl = routeDestCircleRef.current;
          const destLabelEl = routeDestLabelRef.current;
          const destPillEl = routeDestPillRef.current;
          if (!casingEl || !strokeEl || !originEl || !destGroupEl || !destCircleEl) return;

          if (!data || !data.lines.length) {
            casingEl.setAttribute("d", "");
            strokeEl.setAttribute("d", "");
            originEl.style.display = "none";
            destGroupEl.style.display = "none";
            return;
          }

          const isProjectable = (pt: { x: number; y: number }) =>
            Number.isFinite(pt.x) && Number.isFinite(pt.y) && Math.abs(pt.x) < 8000 && Math.abs(pt.y) < 8000;

          let d = "";
          for (const chain of data.lines) {
            let penDown = false;
            for (let i = 0; i < chain.length; i++) {
              const p = instance.project(chain[i]);
              if (!isProjectable(p)) {
                penDown = false;
                continue;
              }
              d += `${penDown ? "L" : "M"}${p.x.toFixed(1)},${p.y.toFixed(1)}`;
              penDown = true;
            }
          }
          casingEl.setAttribute("d", d);
          strokeEl.setAttribute("d", d);
          strokeEl.setAttribute("stroke", data.color);
          if (data.dashed) {
            strokeEl.setAttribute("stroke-dasharray", "8 6");
          } else {
            strokeEl.removeAttribute("stroke-dasharray");
          }

          const oPt = instance.project(data.origin);
          if (isProjectable(oPt)) {
            originEl.style.display = "";
            originEl.setAttribute("cx", oPt.x.toFixed(1));
            originEl.setAttribute("cy", oPt.y.toFixed(1));
          } else {
            originEl.style.display = "none";
          }

          const dPt = instance.project(data.dest);
          if (isProjectable(dPt)) {
            destGroupEl.style.display = "";
            destGroupEl.setAttribute("transform", `translate(${dPt.x.toFixed(1)},${dPt.y.toFixed(1)})`);
            destCircleEl.setAttribute("fill", data.color);

            if (destLabelEl && destPillEl) {
              if (destLabelEl.textContent !== data.destLabel) {
                destLabelEl.textContent = data.destLabel;
              }
              const measured = destLabelEl.getComputedTextLength();
              const pillW = Math.min(240, Math.max(64, (measured > 0 ? measured : data.destLabel.length * 6.5) + 16));
              destPillEl.setAttribute("x", (-pillW / 2).toFixed(1));
              destPillEl.setAttribute("width", pillW.toFixed(1));
            }
          } else {
            destGroupEl.style.display = "none";
          }
        };
        syncRouteOverlayRef.current = syncRouteOverlay;

        const syncCamera = () => {
          if (cancelled) return;
          setZoom(instance.getZoom());
          setPitch(instance.getPitch());
          setBearing(instance.getBearing());
          syncRouteOverlay();
        };
        instance.on("render", syncRouteOverlay);
        instance.on("move", syncRouteOverlay);
        instance.on("resize", syncRouteOverlay);
        instance.on("moveend", syncCamera);
        instance.on("pitchend", syncCamera);
        instance.on("rotateend", syncCamera);

        observer = new ResizeObserver(() => instance.resize());
        observer.observe(containerRef.current);
      } catch {
        if (!cancelled) setMapError(true);
      }
    }

    void init();
    return () => {
      cancelled = true;
      observer?.disconnect();
      popupRef.current?.remove();
      popupRef.current = null;
      map?.remove();
      mapRef.current = null;
      simCanvasRef.current = null;
      setMapReady(false);
    };
    // MapLibre instance mounts once; satellite/contour/building visibility toggles dynamically below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 2) Toggle Satellite, Contours, and 3D Buildings visibility cleanly without reloading the WebGL style.
  useEffect(() => {
    const map = mapRef.current;
    if (!mapReady || !map) return;
    if (map.getLayer(MAPLIBRE_IDS.satelliteLayer)) {
      map.setLayoutProperty(
        MAPLIBRE_IDS.satelliteLayer,
        "visibility",
        engineMode === "3d-satellite" ? "visible" : "none",
      );
    }
    const contourVis = showContours ? "visible" : "none";
    if (map.getLayer(MAPLIBRE_IDS.contourLinesLayer)) {
      map.setLayoutProperty(MAPLIBRE_IDS.contourLinesLayer, "visibility", contourVis);
    }
    if (map.getLayer(MAPLIBRE_IDS.contourLabelsLayer)) {
      map.setLayoutProperty(MAPLIBRE_IDS.contourLabelsLayer, "visibility", contourVis);
    }
    if (map.getLayer(MAPLIBRE_IDS.buildings3dLayer)) {
      map.setLayoutProperty(
        MAPLIBRE_IDS.buildings3dLayer,
        "visibility",
        showBuildings3d ? "visible" : "none",
      );
    }
  }, [mapReady, engineMode, showContours, showBuildings3d]);

  // 3) Fetch 627 district collection once when thematic layers or simulation are enabled.
  useEffect(() => {
    if (!needsDistrictCollection || thematicCollection) return;
    const controller = new AbortController();
    const report = simulationOpen ? onSimStatus : onThematicStatus;
    report({ message: "Memuat batas 627 kecamatan Jawa Barat..." });
    fetch("/backend/web/spatial/layers", { signal: controller.signal })
      .then(async (res) => {
        if (!res.ok) throw new Error("Layer parameter kecamatan belum dapat dimuat.");
        const data: ThematicCollection = await res.json();
        if (!controller.signal.aborted) {
          setThematicCollection(data);
          report(undefined);
        }
      })
      .catch(() => {
        if (!controller.signal.aborted) {
          report({
            message: "Layer parameter kecamatan belum dapat dimuat.",
            retry: () => setThematicAttempt((v) => v + 1),
          });
        }
      });
    return () => {
      controller.abort();
      report(undefined);
    };
  }, [needsDistrictCollection, thematicCollection, thematicAttempt, simulationOpen, onSimStatus, onThematicStatus]);

  // 4) Load terrain & building PNG pack once when simulation opens.
  useEffect(() => {
    if (!simulationOpen || pack) return;
    let active = true;
    onSimStatus({ message: "Memuat data kontur DEM, lereng, dan bangunan 3D..." });
    loadTerrainPack()
      .then((loaded) => {
        if (active) {
          setPack(loaded);
          onSimStatus(undefined);
        }
      })
      .catch(() => {
        if (active) {
          onSimStatus({
            message: "Data kontur simulasi belum dapat dimuat.",
            retry: () => setSimAttempt((v) => v + 1),
          });
        }
      });
    return () => {
      active = false;
    };
  }, [simulationOpen, pack, simAttempt, onSimStatus]);

  // 5) Render Thematic Layers (DEM, Rainfall, Susceptibility, Land Cover) on 3D terrain.
  useEffect(() => {
    const map = mapRef.current;
    if (!mapReady || !map) return;
    const source = map.getSource(MAPLIBRE_IDS.thematicSource);
    if (!isGeoJsonSource(source)) return;

    const topLayerId = activeThematicIds[activeThematicIds.length - 1];
    if (!topLayerId || !thematicCollection) {
      source.setData(emptyCollection);
      return;
    }

    const field = topLayerId === "dem" ? "mean_elevasi_m" : "mean_hujan_mm";
    const values =
      topLayerId === "dem" || topLayerId === "rainfall"
        ? thematicCollection.features
            .map((f) => f.properties[field])
            .filter((v): v is number => v != null)
        : [0, 1];
    const range: [number, number] = [Math.min(...values), Math.max(...values)];

    const features: Feature[] = thematicCollection.features
      .filter(
        ({ properties }) =>
          !regionIds.length || isRegionSelected(regionIds, `${properties.regency_id}/${properties.district_id}`),
      )
      .map((f) => ({
        type: "Feature",
        geometry: f.geometry,
        properties: {
          fillColor: thematicFillColor(topLayerId, f.properties, range),
          tooltip: thematicTooltipText(topLayerId, f.properties),
        },
      }));

    source.setData({ type: "FeatureCollection", features });
  }, [mapReady, activeThematicIds, thematicCollection, regionIds]);

  // 6) Render Selected Administrative Boundary Layer + FlyTo.
  useEffect(() => {
    const map = mapRef.current;
    if (!mapReady || !map) return;
    const source = map.getSource(MAPLIBRE_IDS.boundarySource);
    if (!isGeoJsonSource(source)) return;

    const ids = regionIds.filter((id) => !id.startsWith("!"));
    if (!ids.length) {
      source.setData(emptyCollection);
      return;
    }

    const controller = new AbortController();
    onRegionStatus({ message: "Memuat batas wilayah..." });

    Promise.all(
      ids.map(async (id) => {
        const res = await fetch(`/backend/web/geography/boundary?region=${encodeURIComponent(id)}`, {
          signal: controller.signal,
        });
        if (!res.ok) throw new Error("Batas wilayah gagal dimuat.");
        const json: { name: string; geom: unknown } = await res.json();
        return json;
      }),
    )
      .then((rows) => {
        if (controller.signal.aborted) return;
        const features: Feature[] = [];
        let minLng = Infinity;
        let maxLng = -Infinity;
        let minLat = Infinity;
        let maxLat = -Infinity;

        for (const row of rows) {
          if (!isGeometry(row.geom)) continue;
          features.push({ type: "Feature", geometry: row.geom, properties: { name: row.name } });
          const b = boundsOfGeometry(row.geom);
          if (b) {
            minLng = Math.min(minLng, b[0][0]);
            minLat = Math.min(minLat, b[0][1]);
            maxLng = Math.max(maxLng, b[1][0]);
            maxLat = Math.max(maxLat, b[1][1]);
          }
        }
        source.setData({ type: "FeatureCollection", features });
        if (Number.isFinite(minLng) && Number.isFinite(minLat)) {
          const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
          map.fitBounds(
            [
              [minLng, minLat],
              [maxLng, maxLat],
            ],
            { padding: 52, duration: reduced ? 0 : 800, pitch: reduced ? 0 : Math.max(36, map.getPitch()) },
          );
        }
        onRegionStatus(undefined);
      })
      .catch(() => {
        if (!controller.signal.aborted) {
          source.setData(emptyCollection);
          onRegionStatus({ message: "Batas wilayah belum dapat dimuat. Pilih ulang wilayah untuk mencoba lagi." });
        }
      });

    return () => {
      controller.abort();
      onRegionStatus(undefined);
    };
  }, [mapReady, regionIds, onRegionStatus]);

  // 7) Render Evacuation Sites (14,338 points on GPU WebGL circle layer).
  useEffect(() => {
    const map = mapRef.current;
    if (!mapReady || !map) return;
    const source = map.getSource(MAPLIBRE_IDS.evacSitesSource);
    if (!isGeoJsonSource(source)) return;
    if (!evacuationEnabled || !evacuationSites.length) {
      source.setData(emptyCollection);
      return;
    }
    const features: Feature[] = evacuationSites.map((site) => ({
      type: "Feature",
      geometry: { type: "Point", coordinates: [site.longitude, site.latitude] },
      properties: {
        tooltip: `${site.name || "Lokasi tanpa nama"} · ${site.category || "Kategori tidak tersedia"}`,
      },
    }));
    source.setData({ type: "FeatureCollection", features });
  }, [mapReady, evacuationEnabled, evacuationSites]);

  // 8) Render Rivers per viewport bbox when enabled.
  useEffect(() => {
    const map = mapRef.current;
    if (!mapReady || !map) return;
    const source = map.getSource(MAPLIBRE_IDS.riversSource);
    if (!isGeoJsonSource(source)) return;
    if (!riversEnabled) {
      source.setData(emptyCollection);
      return;
    }
    let controller: AbortController | undefined;
    let closed = false;
    const scope = regionIds.join(",");

    const loadRivers = () => {
      controller?.abort();
      const active = new AbortController();
      controller = active;
      const b = map.getBounds();
      const bbox = [
        Math.max(-180, b.getWest()),
        Math.max(-90, b.getSouth()),
        Math.min(180, b.getEast()),
        Math.min(90, b.getNorth()),
      ]
        .map((n) => n.toFixed(6))
        .join(",");
      const query = new URLSearchParams({ bbox });
      for (const id of scope.split(",").filter(Boolean)) query.append("region", id);
      onRiverStatus({ message: "Memuat jaringan sungai..." });
      fetch(`/backend/web/rivers/layers?${query}`, { signal: active.signal })
        .then(async (res) => {
          if (!res.ok) throw new Error("Jaringan sungai belum dapat dimuat.");
          const json: FeatureCollection<MultiLineString, RiverProperties> & RiverViewportStatus = await res.json();
          if (!closed && !active.signal.aborted) {
            source.setData({
              type: "FeatureCollection",
              features: json.features.map((feature) => ({
                ...feature,
                properties: {
                  ...feature.properties,
                  tooltip: `${feature.properties.name || "Sungai tanpa nama"} · ${feature.properties.river_type || "Jenis belum tersedia"}`,
                },
              })),
            });
            onRiverStatus(riverViewportStatusMessage(json));
          }
        })
        .catch((err) => {
          if (!closed && !active.signal.aborted) {
            source.setData(emptyCollection);
            onRiverStatus({
              message: err instanceof Error ? err.message : "Layer sungai gagal.",
              retry: () => loadRivers(),
            });
          }
        });
    };

    loadRivers();
    map.on("moveend", loadRivers);
    return () => {
      closed = true;
      controller?.abort();
      map.off("moveend", loadRivers);
      source.setData(emptyCollection);
      onRiverStatus(undefined);
    };
  }, [mapReady, riversEnabled, regionIds, onRiverStatus]);

  // 9) Resolve Simulation Target into Raster Mask + Stats.
  const resolvedSim = useMemo<{ region: SelectedSimRegion; geometries: (Polygon | MultiPolygon)[] } | null>(() => {
    if (!simulationOpen || !thematicCollection || !pack || !simTarget) return null;

    const matching =
      simScope === "district" && simTarget.districtId !== null
        ? thematicCollection.features.filter((f) => f.properties.district_id === simTarget.districtId)
        : thematicCollection.features.filter((f) => f.properties.regency_id === simTarget.regencyId);

    if (!matching.length) return null;

    const effectiveScope: SimulationScope =
      simScope === "district" && simTarget.districtId !== null ? "district" : "regency";
    const key =
      effectiveScope === "district"
        ? `district:${simTarget.districtId}`
        : `regency:${simTarget.regencyId}`;

    const geometries = matching.map((f) => f.geometry);
    let raster = simMaskCache3d.get(key);
    if (!raster) {
      raster = rasterizeGeometryMask(geometries, pack);
      simMaskCache3d.set(key, raster);
    }

    const regencyName = regencyNames.get(simTarget.regencyId) ?? `Kabupaten #${simTarget.regencyId}`;
    const firstProps = matching[0].properties;
    const title =
      effectiveScope === "district"
        ? `Kecamatan ${firstProps.district_name || firstProps.district_id}`
        : regencyName;
    const subtitle =
      effectiveScope === "district"
        ? regencyName
        : `${matching.length} kecamatan · Jawa Barat`;

    const pointSample = simTarget.point
      ? samplePointMetrics(pack, simTarget.point.lat, simTarget.point.lng)
      : null;

    return {
      geometries,
      region: {
        key,
        scope: effectiveScope,
        title,
        subtitle,
        regencyId: simTarget.regencyId,
        districtId: effectiveScope === "district" ? simTarget.districtId : null,
        landcoverLabel: firstProps.landcover_dominan,
        clickedPoint: simTarget.point,
        pointSample,
        raster,
      },
    };
  }, [simulationOpen, thematicCollection, pack, simTarget, simScope, regencyNames]);

  useEffect(() => {
    onSimRegionResolved(resolvedSim ? resolvedSim.region : null);
  }, [resolvedSim, onSimRegionResolved]);

  useEffect(() => {
    if (!resolvedSim || !pack) {
      onSimStatsChange(null);
      return;
    }
    const stats = computeSimulationStats(pack, resolvedSim.region.raster, simMode, simParams);
    onSimStatsChange(stats);
  }, [resolvedSim, pack, simMode, simParams, onSimStatsChange]);

  // 10) Sync simulation selectable outlines + selected region highlight + 3D cinematic camera fly-to.
  useEffect(() => {
    const map = mapRef.current;
    if (!mapReady || !map) return;
    const hitSource = map.getSource(MAPLIBRE_IDS.simHitSource);
    const outlineSource = map.getSource(MAPLIBRE_IDS.simOutlineSource);
    const pointSource = map.getSource(MAPLIBRE_IDS.simPointSource);

    if (isGeoJsonSource(hitSource)) {
      hitSource.setData(simulationOpen && thematicCollection ? thematicCollection : emptyCollection);
    }

    if (!simulationOpen || !resolvedSim) {
      if (isGeoJsonSource(outlineSource)) outlineSource.setData(emptyCollection);
      if (isGeoJsonSource(pointSource)) pointSource.setData(emptyCollection);
      if (!simulationOpen) lastRegionKeyRef.current = null;
      return;
    }

    const accent = simMode === "flood" ? "#1d4ed8" : "#c2410c";
    const isRegencyScope = resolvedSim.region.scope === "regency";
    if (map.getLayer(MAPLIBRE_IDS.simOutlineCasingLayer)) {
      map.setPaintProperty(MAPLIBRE_IDS.simOutlineCasingLayer, "line-width", isRegencyScope ? 2 : 4);
      map.setPaintProperty(MAPLIBRE_IDS.simOutlineCasingLayer, "line-opacity", isRegencyScope ? 0.5 : 0.85);
    }
    if (map.getLayer(MAPLIBRE_IDS.simOutlineStrokeLayer)) {
      map.setPaintProperty(MAPLIBRE_IDS.simOutlineStrokeLayer, "line-color", accent);
      map.setPaintProperty(MAPLIBRE_IDS.simOutlineStrokeLayer, "line-width", isRegencyScope ? 1.15 : 2.2);
    }
    if (map.getLayer(MAPLIBRE_IDS.simPointLayer)) {
      map.setPaintProperty(MAPLIBRE_IDS.simPointLayer, "circle-color", accent);
    }

    if (isGeoJsonSource(outlineSource)) {
      outlineSource.setData({
        type: "FeatureCollection",
        features: resolvedSim.geometries.map((geometry) => ({ type: "Feature", geometry, properties: {} })),
      });
    }

    if (isGeoJsonSource(pointSource)) {
      if (resolvedSim.region.clickedPoint) {
        pointSource.setData({
          type: "FeatureCollection",
          features: [
            {
              type: "Feature",
              geometry: {
                type: "Point",
                coordinates: [resolvedSim.region.clickedPoint.lng, resolvedSim.region.clickedPoint.lat],
              },
              properties: {},
            },
          ],
        });
      } else {
        pointSource.setData(emptyCollection);
      }
    }

    if (lastRegionKeyRef.current !== resolvedSim.region.key) {
      lastRegionKeyRef.current = resolvedSim.region.key;
      revealStartRef.current = performance.now();
      const bbox = geometryBounds(resolvedSim.geometries);
      if (Number.isFinite(bbox.minLng) && Number.isFinite(bbox.minLat)) {
        const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        const padBottom = window.innerWidth < 1000 ? 250 : 215;
        map.fitBounds(
          [
            [bbox.minLng, bbox.minLat],
            [bbox.maxLng, bbox.maxLat],
          ],
          {
            padding: { top: 76, left: 52, right: 52, bottom: padBottom },
            pitch: reduced ? 0 : 48,
            bearing: reduced ? 0 : -12,
            duration: reduced ? 0 : 950,
          },
        );
      }
    }
  }, [mapReady, simulationOpen, thematicCollection, resolvedSim, simMode]);

  // 11) Respond to "Lihat Dekat 3D (Gedung & Kontur)" button request.
  useEffect(() => {
    const map = mapRef.current;
    if (!mapReady || !map || !focusRequest) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    setShowBuildings3d(true);
    map.flyTo({
      center: [focusRequest.lng, focusRequest.lat],
      zoom: 15.2,
      pitch: reduced ? 0 : 58,
      bearing: reduced ? 0 : -20,
      duration: reduced ? 0 : 1200,
    });
  }, [mapReady, focusRequest]);

  // 11b) Respond to "Evakuasi Aman" button inside active simulation (finds nearest site outside flood/landslide zone).
  useEffect(() => {
    const map = mapRef.current;
    if (!mapReady || !map) return;
    const rSrc = map.getSource(MAPLIBRE_IDS.evacRouteSource);
    const pSrc = map.getSource(MAPLIBRE_IDS.evacRoutePointsSource);

    const clearSafeGuide = () => {
      routeOverlayRef.current = null;
      syncRouteOverlayRef.current();
      if (isGeoJsonSource(rSrc)) rSrc.setData(emptyCollection);
      if (isGeoJsonSource(pSrc)) pSrc.setData(emptyCollection);
    };

    if (!simulationOpen || !safeEvacRequestNonce || !pack || !resolvedSim) {
      clearSafeGuide();
      onSafeEvacNoteChange(null);
      return;
    }

    if (!evacuationSites.length) {
      onSafeEvacNoteChange("Memuat titik evakuasi untuk mencari lokasi aman terdekat...");
      return;
    }

    const stats = computeSimulationStats(pack, resolvedSim.region.raster, simMode, simParams);
    const origin = resolvedSim.region.clickedPoint ?? stats.focusCenter;
    if (!origin) return;

    const match = findNearestSafeEvacuationSite(
      pack,
      resolvedSim.region.raster.p10DemM,
      simMode,
      simParams,
      origin,
      evacuationSites,
    );

    if (!match) {
      clearSafeGuide();
      onSafeEvacNoteChange("Tidak ditemukan titik evakuasi aman pada kategori aktif saat ini.");
      return;
    }

    // Render active safe-evacuation guide in screen-projected SVG so 3D extruded buildings never occlude it.
    if (isGeoJsonSource(rSrc)) rSrc.setData(emptyCollection);
    if (isGeoJsonSource(pSrc)) pSrc.setData(emptyCollection);
    const originCoord: [number, number] = [origin.lng, origin.lat];
    const destCoord: [number, number] = [match.longitude, match.latitude];
    routeOverlayRef.current = {
      lines: [sampleGuideLine(originCoord, destCoord, 16)],
      origin: originCoord,
      dest: destCoord,
      color: "#15803d",
      dashed: true,
      destLabel: match.name.length > 28 ? `${match.name.slice(0, 27)}...` : match.name,
    };
    syncRouteOverlayRef.current();

    const minLng = Math.min(origin.lng, match.longitude);
    const maxLng = Math.max(origin.lng, match.longitude);
    const minLat = Math.min(origin.lat, match.latitude);
    const maxLat = Math.max(origin.lat, match.latitude);
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const padBottom = window.innerWidth < 1000 ? 250 : 250;
    map.fitBounds(
      [
        [minLng, minLat],
        [maxLng, maxLat],
      ],
      {
        padding: { top: 84, left: 64, right: 64, bottom: padBottom },
        maxZoom: 15.5,
        pitch: reduced ? 0 : 45,
        duration: reduced ? 0 : 850,
      },
    );

    const elevLabel = match.elevationM !== null ? ` (${match.elevationM.toLocaleString("id-ID")} mdpl)` : "";
    const away = formatStraightDistance(match.distanceM);
    onSafeEvacNoteChange(`Evakuasi aman terdekat: ${match.name}${elevLabel} · ${away} garis lurus, di luar zona simulasi.`);

    return () => {
      clearSafeGuide();
    };
  }, [
    mapReady,
    simulationOpen,
    safeEvacRequestNonce,
    pack,
    resolvedSim,
    simMode,
    simParams,
    evacuationSites,
    onSafeEvacNoteChange,
  ]);

  // 12) Draped 3D Simulation Canvas Renderer (Flood DEM ripples + Landslide slope particles directly on 3D terrain).
  useEffect(() => {
    const map = mapRef.current;
    const canvas = simCanvasRef.current;
    if (!mapReady || !map || !canvas) return;
    const ctx = canvas.getContext("2d");
    const canvasSource = map.getSource(MAPLIBRE_IDS.simCanvasSource);
    if (!ctx || !isCanvasSource(canvasSource)) return;

    const flushOnce = () => {
      canvasSource.play();
      map.triggerRepaint();
      window.requestAnimationFrame(() => canvasSource.pause());
    };

    if (!simulationOpen || !pack || !resolvedSim) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      flushOnce();
      return;
    }

    if (canvas.width !== pack.meta.width || canvas.height !== pack.meta.height) {
      canvas.width = pack.meta.width;
      canvas.height = pack.meta.height;
    }

    const imgData = ctx.createImageData(pack.meta.width, pack.meta.height);
    const seeds: DebrisSeed[] = [];
    const particles: DebrisParticle[] = [];
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const animateMotion = !reduced && !simPaused;

    const spawnParticle = (seedIdx: number): DebrisParticle => {
      const seed = seeds[seedIdx % seeds.length];
      const speed = seed.tier === 3 ? 0.34 : 0.24;
      return {
        x: seed.x,
        y: seed.y,
        vx: Math.cos(seed.rad) * speed,
        vy: Math.sin(seed.rad) * speed,
        life: Math.random() * 24,
        maxLife: 24 + Math.random() * 18,
        tier: seed.tier,
      };
    };

    let rafId = 0;
    let lastTime = 0;
    let phase = 0;

    const draw = (now: number) => {
      const elapsed = now - revealStartRef.current;
      const revealRaw = reduced || revealStartRef.current === 0 ? 1 : Math.min(1, elapsed / 620);
      const revealProgress = 1 - Math.pow(1 - revealRaw, 3);

      renderSimulationToImageData(
        pack,
        resolvedSim.region.raster,
        simMode,
        simParams,
        revealProgress,
        phase,
        imgData,
        seeds,
      );
      ctx.putImageData(imgData, 0, 0);

      // Draw downslope debris streaks directly onto the draped 3D canvas in landslide mode.
      if (simMode === "landslide" && seeds.length > 0 && revealProgress > 0.45) {
        const targetCount = Math.min(90, seeds.length);
        if (particles.length !== targetCount) {
          particles.length = 0;
          for (let i = 0; i < targetCount; i++) {
            particles.push(spawnParticle(Math.floor((i * seeds.length) / targetCount)));
          }
        }
        ctx.lineCap = "round";
        for (let i = 0; i < particles.length; i++) {
          const p = particles[i];
          if (animateMotion) {
            p.x += p.vx;
            p.y += p.vy;
            p.life += 1;
            if (p.life >= p.maxLife) {
              particles[i] = spawnParticle(Math.floor(Math.random() * seeds.length));
              continue;
            }
          }
          const alpha = animateMotion ? Math.sin((p.life / p.maxLife) * Math.PI) * 0.95 : 0.78;
          ctx.strokeStyle =
            p.tier === 3
              ? `rgba(127, 29, 29, ${alpha.toFixed(2)})`
              : `rgba(154, 52, 18, ${alpha.toFixed(2)})`;
          ctx.lineWidth = p.tier === 3 ? 1.8 : 1.3;
          ctx.beginPath();
          ctx.moveTo(p.x - p.vx * 5, p.y - p.vy * 5);
          ctx.lineTo(p.x, p.y);
          ctx.stroke();
        }
      }

      map.triggerRepaint();
    };

    const tick = (now: number) => {
      const stillRevealing = !reduced && revealStartRef.current > 0 && now - revealStartRef.current < 650;
      if (now - lastTime >= 48 || stillRevealing) {
        lastTime = now;
        if (animateMotion) phase += 0.24;
        draw(now);
      }
      if (animateMotion || stillRevealing) {
        rafId = window.requestAnimationFrame(tick);
      } else {
        canvasSource.pause();
      }
    };

    canvasSource.play();
    draw(performance.now());
    if (animateMotion || (!reduced && performance.now() - revealStartRef.current < 650)) {
      rafId = window.requestAnimationFrame(tick);
    } else {
      window.requestAnimationFrame(() => canvasSource.pause());
    }

    return () => {
      window.cancelAnimationFrame(rafId);
      canvasSource.pause();
    };
  }, [mapReady, simulationOpen, pack, resolvedSim, simMode, simParams, simPaused]);

  // 13) Unified Map Click & Hover Tooltips (Simulation Region Picker OR Evacuation Routing).
  useEffect(() => {
    const map = mapRef.current;
    if (!mapReady || !map) return;

    const canvasEl = map.getCanvas();
    const prevCursor = canvasEl.style.cursor;
    if (simulationOpen) canvasEl.style.cursor = "crosshair";

    let routeController: AbortController | undefined;
    const clearRoute = () => {
      routeOverlayRef.current = null;
      syncRouteOverlayRef.current();
      const rSrc = map.getSource(MAPLIBRE_IDS.evacRouteSource);
      const pSrc = map.getSource(MAPLIBRE_IDS.evacRoutePointsSource);
      if (isGeoJsonSource(rSrc)) rSrc.setData(emptyCollection);
      if (isGeoJsonSource(pSrc)) pSrc.setData(emptyCollection);
    };

    if (evacuationEnabled && !simulationOpen) {
      onRouteStatus({
        message: "Mode Evakuasi aktif: klik titik mana saja pada peta untuk menghitung rute berkendara terdekat.",
      });
    } else {
      clearRoute();
      onRouteStatus(undefined);
    }

    const handleClick = (event: MapMouseEvent) => {
      if (simulationOpen && thematicCollection) {
        const { lat, lng } = event.lngLat;
        for (const feature of thematicCollection.features) {
          if (pointInGeometry(lng, lat, feature.geometry)) {
            onSelectSimTarget({
              regencyId: feature.properties.regency_id,
              districtId: feature.properties.district_id,
              point: { lat, lng },
            });
            return;
          }
        }
        return;
      }

      if (evacuationEnabled && !simulationOpen) {
        routeController?.abort();
        const active = new AbortController();
        routeController = active;
        clearRoute();
        onRouteStatus({ message: "Mencari rute evakuasi terdekat..." });

        const payload: RouteRequest = {
          origin_longitude: event.lngLat.lng,
          origin_latitude: event.lngLat.lat,
          travel_mode: "driving",
          limit: 1,
        };
        requestBackend<RouteResponse>("/api/v1/evacuation/routes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
          signal: active.signal,
        })
          .then((result) => {
            if (active.signal.aborted) return;
            const route = result.routes[0];
            if (!route || !isGeometry(route.geometry)) {
              throw new Error("Tidak ada tujuan evakuasi yang dapat dijangkau.");
            }
            const name = route.evacuation_site.name || "Titik evakuasi";
            const chains = extractLineChains(route.geometry);
            const originCoord: [number, number] = [event.lngLat.lng, event.lngLat.lat];
            const destCoord: [number, number] = [route.evacuation_site.longitude, route.evacuation_site.latitude];
            routeOverlayRef.current = {
              lines: chains.length ? chains : [sampleGuideLine(originCoord, destCoord, 16)],
              origin: originCoord,
              dest: destCoord,
              color: "#2563eb",
              dashed: false,
              destLabel: name.length > 28 ? `${name.slice(0, 27)}...` : name,
            };
            syncRouteOverlayRef.current();
            const b = boundsOfGeometry(route.geometry);
            if (b) {
              const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
              map.fitBounds(b, { padding: 64, maxZoom: 16.5, duration: reduced ? 0 : 850 });
            }
            onRouteStatus({
              message: `Rute berkendara ke ${name} · ${(route.distance_m / 1000).toLocaleString("id-ID", { maximumFractionDigits: 2 })} km · ${route.duration_minutes.toLocaleString("id-ID", { maximumFractionDigits: 1 })} menit`,
            });
          })
          .catch(async (error) => {
            if (active.signal.aborted) return;
            const reason = error instanceof Error ? error.message : "Pencarian rute gagal.";
            try {
              const site = await fetchNearestEvacuationSite(event.lngLat.lng, event.lngLat.lat, active.signal);
              if (active.signal.aborted) return;
              if (!site) {
                onRouteStatus({ message: `${reason} Tidak ada titik evakuasi di sekitar sini.` });
                return;
              }
              const siteLabel = site.name || "Titik evakuasi terdekat";
              const originCoord: [number, number] = [event.lngLat.lng, event.lngLat.lat];
              const destCoord: [number, number] = [site.longitude, site.latitude];
              routeOverlayRef.current = {
                lines: [sampleGuideLine(originCoord, destCoord, 16)],
                origin: originCoord,
                dest: destCoord,
                color: "#b45309",
                dashed: true,
                destLabel: siteLabel.length > 28 ? `${siteLabel.slice(0, 27)}...` : siteLabel,
              };
              syncRouteOverlayRef.current();
              const minLng = Math.min(event.lngLat.lng, site.longitude);
              const maxLng = Math.max(event.lngLat.lng, site.longitude);
              const minLat = Math.min(event.lngLat.lat, site.latitude);
              const maxLat = Math.max(event.lngLat.lat, site.latitude);
              const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
              map.fitBounds(
                [
                  [minLng, minLat],
                  [maxLng, maxLat],
                ],
                { padding: 64, maxZoom: 16.5, duration: reduced ? 0 : 750 },
              );
              const away = formatStraightDistance(site.distance_m);
              onRouteStatus({
                message: `${reason} Titik terdekat: ${site.name || "tanpa nama"} · ${away} garis lurus, bukan jarak berkendara. Klik lagi untuk mencoba rute.`,
              });
            } catch {
              if (!active.signal.aborted) onRouteStatus({ message: reason });
            }
          });
      }
    };

    const handleMouseMove = (event: MapMouseEvent) => {
      const popup = popupRef.current;
      if (!popup) return;
      const queryLayers: string[] = [];
      if (evacuationEnabled && map.getLayer(MAPLIBRE_IDS.evacSitesLayer)) queryLayers.push(MAPLIBRE_IDS.evacSitesLayer);
      if (riversEnabled && map.getLayer(MAPLIBRE_IDS.riversLineLayer)) queryLayers.push(MAPLIBRE_IDS.riversLineLayer);
      if (activeThematicIds.length > 0 && map.getLayer(MAPLIBRE_IDS.thematicFillLayer)) {
        queryLayers.push(MAPLIBRE_IDS.thematicFillLayer);
      }
      if (!queryLayers.length) {
        popup.remove();
        return;
      }
      const hits = map.queryRenderedFeatures(event.point, { layers: queryLayers });
      const first = hits[0];
      const text = first?.properties && typeof first.properties.tooltip === "string" ? first.properties.tooltip : "";
      if (text) {
        popup.setLngLat(event.lngLat).setText(text).addTo(map);
      } else {
        popup.remove();
      }
    };

    const handleMouseOut = () => popupRef.current?.remove();

    map.on("click", handleClick);
    map.on("mousemove", handleMouseMove);
    map.on("mouseout", handleMouseOut);
    return () => {
      routeController?.abort();
      canvasEl.style.cursor = prevCursor;
      map.off("click", handleClick);
      map.off("mousemove", handleMouseMove);
      map.off("mouseout", handleMouseOut);
      popupRef.current?.remove();
    };
  }, [
    mapReady,
    simulationOpen,
    thematicCollection,
    evacuationEnabled,
    riversEnabled,
    activeThematicIds,
    onSelectSimTarget,
    onRouteStatus,
  ]);

  if (mapError) {
    return (
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-[#e8eee6] p-4 text-center">
        <p className="text-sm font-medium text-neutral-800">Mode 3D WebGL tidak dapat dimuat pada perangkat ini.</p>
        <Button type="button" onClick={() => onEngineModeChange("2d-classic")}>
          Beralih ke Peta 2D Klasik
        </Button>
      </div>
    );
  }

  const isTilted = pitch >= 18;

  return (
    <section
      className="gis-map absolute inset-0 overflow-hidden bg-[#dce7f0]"
      aria-label="Peta 3D interaktif Jawa Barat dengan kontur dan bangunan"
    >
      <div
        ref={containerRef}
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
        className="gis-maplibre-map absolute! inset-0! z-0! h-full! w-full! [font-family:inherit]!"
        aria-label="Kanvas peta 3D Jawa Barat. Seret untuk menggeser, klik kanan dan seret untuk memiringkan sudut pandang 3D."
      />

      {/* Screen-projected 3D route/evacuation guide overlay so active routes and pins never clip under 3D buildings. */}
      <svg
        className="pointer-events-none absolute inset-0 z-1 h-full w-full overflow-visible"
        aria-hidden="true"
      >
        <path
          ref={routeCasingPathRef}
          fill="none"
          stroke="#ffffff"
          strokeWidth={7}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeOpacity={0.94}
        />
        <path
          ref={routeStrokePathRef}
          fill="none"
          stroke="#15803d"
          strokeWidth={3.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle
          ref={routeOriginCircleRef}
          r={6.5}
          fill="#ffffff"
          stroke="#111827"
          strokeWidth={2.5}
          style={{ display: "none" }}
        />
        <g ref={routeDestGroupRef} style={{ display: "none" }}>
          <circle ref={routeDestCircleRef} r={7.5} fill="#15803d" stroke="#ffffff" strokeWidth={2.5} />
          <rect
            ref={routeDestPillRef}
            y={-32}
            height={20}
            rx={6}
            fill="#ffffff"
            stroke="#d4d4d4"
            strokeWidth={1}
          />
          <text
            ref={routeDestLabelRef}
            y={-18}
            textAnchor="middle"
            fill="#171717"
            fontSize={11}
            fontWeight={600}
          />
        </g>
      </svg>

      {dataStatus || !mapReady ? (
        <div
          className="gis-map-status absolute z-1 left-[calc(var(--regions-width,0px)_+_16px)] right-16 bottom-16 flex items-center flex-wrap gap-2 rounded-xl border border-neutral-200 bg-white px-3 py-2 text-xs text-neutral-800 [transition:left_var(--gis-slide-duration)_var(--gis-slide-easing),right_var(--gis-slide-duration)_var(--gis-slide-easing)] motion-reduce:[transition:none]"
          role="status"
        >
          {dataStatus?.message ?? "Memuat peta 3D Jawa Barat..."}
          {dataStatus?.retry ? (
            <Button size="sm" variant="outline" className="h-7 rounded-lg text-xs" onClick={dataStatus.retry}>
              Coba lagi
            </Button>
          ) : null}
        </div>
      ) : null}

      {/* Unified Map View & 3D Overlay Switcher (Bottom Left) */}
      <div
        data-sim-open={simulationOpen}
        className={`gis-3d-switcher absolute z-2 left-[calc(var(--regions-width,0px)_+_16px)] bottom-4 inline-flex items-center rounded-xl border border-neutral-200 bg-white p-1 [transition:left_var(--gis-slide-duration)_var(--gis-slide-easing)] motion-reduce:[transition:none] ${
          simulationOpen ? "max-[1279.01px]:hidden" : "max-[639.01px]:hidden"
        }`}
        role="group"
        aria-label="Mode tampilan peta dan lapisan 3D"
      >
        <div className="inline-flex items-center gap-0.5">
          <button
            type="button"
            aria-pressed={engineMode === "3d-natural"}
            onClick={() => onEngineModeChange("3d-natural")}
            className={`h-7 cursor-pointer rounded-lg px-2.5 text-xs font-medium transition-colors ${
              engineMode === "3d-natural"
                ? "bg-[var(--gis-blue)] text-white"
                : "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900"
            }`}
          >
            3D
          </button>
          <button
            type="button"
            aria-pressed={engineMode === "3d-satellite"}
            onClick={() => onEngineModeChange("3d-satellite")}
            className={`h-7 cursor-pointer rounded-lg px-2.5 text-xs font-medium transition-colors ${
              engineMode === "3d-satellite"
                ? "bg-[var(--gis-blue)] text-white"
                : "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900"
            }`}
          >
            Satelit
          </button>
          <button
            type="button"
            aria-pressed={false}
            onClick={() => onEngineModeChange("2d-classic")}
            className="h-7 cursor-pointer rounded-lg px-2.5 text-xs font-medium text-neutral-600 transition-colors hover:bg-neutral-100 hover:text-neutral-900"
          >
            2D
          </button>
        </div>

        <span className="mx-1.5 h-4 w-px bg-neutral-200" aria-hidden="true" />

        <div className="inline-flex items-center gap-0.5">
          <button
            type="button"
            aria-pressed={showContours}
            onClick={() => setShowContours((prev) => !prev)}
            className={`inline-flex h-7 cursor-pointer items-center gap-1.5 rounded-lg px-2.5 text-xs font-medium transition-colors ${
              showContours
                ? "bg-neutral-100 text-neutral-900"
                : "text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900"
            }`}
          >
            <span
              aria-hidden="true"
              className={`size-1.5 rounded-full ${showContours ? "bg-[var(--gis-blue)]" : "bg-neutral-300"}`}
            />
            <span>Kontur</span>
          </button>

          <button
            type="button"
            aria-pressed={showBuildings3d}
            onClick={() => setShowBuildings3d((prev) => !prev)}
            className={`inline-flex h-7 cursor-pointer items-center gap-1.5 rounded-lg px-2.5 text-xs font-medium transition-colors ${
              showBuildings3d
                ? "bg-neutral-100 text-neutral-900"
                : "text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900"
            }`}
          >
            <span
              aria-hidden="true"
              className={`size-1.5 rounded-full ${showBuildings3d ? "bg-[var(--gis-blue)]" : "bg-neutral-300"}`}
            />
            <span>Bangunan</span>
          </button>
        </div>
      </div>

      {/* Camera & 3D Tilt Controls */}
      <div
        className="gis-map-controls absolute z-2 bottom-9 right-4 flex flex-col gap-2 text-[var(--gis-blue)] [transition:right_var(--gis-slide-duration)_var(--gis-slide-easing)] motion-reduce:[transition:none]"
        aria-label="Kontrol kamera peta 3D"
      >
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-pressed={isTilted}
          aria-label={isTilted ? "Ubah sudut pandang menjadi tegak 2D" : "Miringkan kamera ke sudut pandang 3D"}
          title={isTilted ? "Sudut tegak (0°)" : "Sudut 3D (55°)"}
          className={`h-9 w-9 rounded-xl border text-xs font-semibold transition-colors ${
            isTilted
              ? "border-neutral-200 bg-white text-[var(--gis-blue)] hover:bg-neutral-50"
              : "border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900"
          }`}
          onClick={() => {
            const map = mapRef.current;
            if (!map) return;
            const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
            map.easeTo({ pitch: isTilted ? 0 : 55, duration: reduced ? 0 : 500 });
          }}
        >
          {isTilted ? "3D" : "2D"}
        </Button>

        {Math.abs(bearing) > 2 && (
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label="Reset arah kompas ke utara"
            title="Reset arah ke utara"
            className="h-9 w-9 rounded-xl border border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50"
            onClick={() => {
              const map = mapRef.current;
              if (!map) return;
              const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
              map.easeTo({ bearing: 0, duration: reduced ? 0 : 400 });
            }}
          >
            <IconCompass
              className="size-5"
              style={{ transform: `rotate(${-bearing}deg)` }}
              aria-hidden="true"
            />
          </Button>
        )}

        <div className="gis-zoom-controls flex flex-col gap-1.5 rounded-xl border border-neutral-200 bg-white p-1.5">
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="h-6 w-6 p-0"
            aria-label="Perbesar peta"
            disabled={zoom >= 18}
            onClick={() => mapRef.current?.zoomIn()}
          >
            <IconPlus className="size-5" aria-hidden="true" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="h-6 w-6 p-0"
            aria-label="Perkecil peta"
            disabled={zoom <= 6}
            onClick={() => mapRef.current?.zoomOut()}
          >
            <IconMinus className="size-5" aria-hidden="true" />
          </Button>
        </div>

        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className="gis-reset-map h-9 w-9 rounded-xl border border-neutral-200 bg-white p-1.5 hover:bg-neutral-50"
          aria-label="Kembali ke Jawa Barat"
          title="Kembali ke Jawa Barat"
          onClick={() => {
            const map = mapRef.current;
            if (!map) return;
            const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
            map.fitBounds(
              [
                [westJavaBasemap.bounds[0][1], westJavaBasemap.bounds[0][0]],
                [westJavaBasemap.bounds[1][1], westJavaBasemap.bounds[1][0]],
              ],
              { padding: 28, pitch: reduced ? 0 : 32, bearing: 0, duration: reduced ? 0 : 750 },
            );
          }}
        >
          <IconCurrentLocation className="size-5" aria-hidden="true" />
        </Button>
      </div>
    </section>
  );
}
