import type { MultiPolygon, Polygon, Position } from "geojson";

export type SimulationMode = "flood" | "landslide";
export type SimulationScope = "district" | "regency";

export interface TerrainMeta {
  version: number;
  projection: string;
  width: number;
  height: number;
  bounds: {
    west: number;
    south: number;
    east: number;
    north: number;
  };
  mercNorth: number;
  mercSouth: number;
  cellAreaKm2: number;
  stats: {
    validPixels: number;
    totalBuildings?: number;
    totalPopulation?: number;
    minDemM: number;
    maxDemM: number;
    maxSlopeDeg: number;
  };
  files: {
    demHand: string;
    hazardParams: string;
    buildings?: string;
  };
}

export interface TerrainPack {
  meta: TerrainMeta;
  demHand: Uint8ClampedArray;
  hazard: Uint8ClampedArray;
  buildings: Uint8ClampedArray | null;
}

export interface RegionRasterMask {
  mask: Uint8Array;
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
  validPixels: number;
  totalAreaKm2: number;
  totalBuildings: number;
  totalPopulation: number;
  minDemM: number;
  p10DemM: number;
  maxDemM: number;
  meanSlopeDeg: number;
  maxSlopeDeg: number;
}

export interface PointTerrainSample {
  demM: number;
  handM: number;
  slopeDeg: number;
  rainMmYr: number;
  landcoverScore: number;
  buildingCount: number;
  populationCount: number;
}

export interface ClickedPointAssessment {
  status: "safe" | "hazard";
  summary: string;
}

export interface SafeEvacuationMatch {
  id: number;
  name: string;
  category: string | null;
  latitude: number;
  longitude: number;
  distanceM: number;
  elevationM: number | null;
}

export interface SimulationParams {
  waterRiseM: number;
  triggerRainMmDay: number;
  criticalSlopeDeg: number;
}

export interface SimulationStats {
  affectedPixels: number;
  affectedAreaKm2: number;
  affectedPct: number;
  affectedBuildings: number;
  affectedPopulation: number;
  tierCounts: [number, number, number];
  maxDepthM: number;
  maxRiskScore: number;
  focusCenter: { lat: number; lng: number } | null;
}

export interface DebrisSeed {
  x: number;
  y: number;
  rad: number;
  tier: 2 | 3;
}

function clamp(value: number, min: number, max: number): number {
  return value < min ? min : value > max ? max : value;
}

export function mercY(latDeg: number): number {
  return Math.log(Math.tan(Math.PI / 4 + (latDeg * Math.PI) / 360));
}

export function unmercY(y: number): number {
  return ((2 * Math.atan(Math.exp(y)) - Math.PI / 2) * 180) / Math.PI;
}

export function encodeDemMeters(demM: number): [number, number] {
  const u16 = clamp(Math.round((demM + 20) * 10), 1, 65535);
  return [u16 >> 8, u16 & 255];
}

export function decodeDemMeters(r: number, g: number): number {
  return ((r << 8) | g) / 10 - 20;
}

export function decodeBuildingCount(r: number, g: number): number {
  return (r << 8) | g;
}

export function encodePopulationCell(pop: number): number {
  const clamped = Math.max(0, pop);
  if (clamped <= 1000) return clamp(Math.round(clamped / 10), 0, 100);
  if (clamped <= 10000) return clamp(100 + Math.round((clamped - 1000) / 90), 100, 200);
  return clamp(200 + Math.round((clamped - 10000) / 700), 200, 255);
}

export function decodePopulationCell(b: number): number {
  if (b <= 100) return b * 10;
  if (b <= 200) return 1000 + (b - 100) * 90;
  return 10000 + (b - 200) * 700;
}

export function encodeHandMeters(handM: number): number {
  const clamped = Math.max(0, handM);
  if (clamped <= 15) return clamp(Math.round(clamped * 10), 0, 150);
  if (clamped <= 67) return clamp(150 + Math.round((clamped - 15) * 2), 150, 254);
  return 255;
}

export function decodeHandMeters(b: number): number {
  if (b <= 150) return b / 10;
  if (b < 255) return 15 + (b - 150) / 2;
  return 75;
}

export function decodeHazardPixel(r: number, g: number, b: number): {
  slopeDeg: number;
  rainMmYr: number;
  downslopeRad: number;
  landcoverScore: number;
} {
  const slopeDeg = r / 4;
  const rainMmYr = 1000 + g * 20;
  const dir32 = (b >> 3) & 31;
  const downslopeRad = ((dir32 + 0.5) / 32) * Math.PI * 2 - Math.PI;
  const landcoverScore = clamp(b & 7, 1, 5);
  return { slopeDeg, rainMmYr, downslopeRad, landcoverScore };
}

export function latLngToGrid(lat: number, lng: number, meta: TerrainMeta): { gx: number; gy: number } {
  const { bounds, mercNorth, mercSouth, width, height } = meta;
  const u = (lng - bounds.west) / (bounds.east - bounds.west);
  const v = (mercNorth - mercY(lat)) / (mercNorth - mercSouth);
  return {
    gx: Math.floor(u * width),
    gy: Math.floor(v * height),
  };
}

export function gridToLatLng(gx: number, gy: number, meta: TerrainMeta): { lat: number; lng: number } {
  const { bounds, mercNorth, mercSouth, width, height } = meta;
  const lng = bounds.west + ((gx + 0.5) / width) * (bounds.east - bounds.west);
  const lat = unmercY(mercNorth - ((gy + 0.5) / height) * (mercNorth - mercSouth));
  return { lat, lng };
}

export function pointInRing(lng: number, lat: number, ring: Position[]): boolean {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const xi = ring[i][0];
    const yi = ring[i][1];
    const xj = ring[j][0];
    const yj = ring[j][1];
    const intersects = yi > lat !== yj > lat && lng < ((xj - xi) * (lat - yi)) / (yj - yi + 1e-12) + xi;
    if (intersects) inside = !inside;
  }
  return inside;
}

function pointInPolygonRings(lng: number, lat: number, rings: Position[][]): boolean {
  if (!rings.length || !pointInRing(lng, lat, rings[0])) return false;
  for (let i = 1; i < rings.length; i++) {
    if (pointInRing(lng, lat, rings[i])) return false;
  }
  return true;
}

export function pointInGeometry(lng: number, lat: number, geometry: Polygon | MultiPolygon): boolean {
  if (geometry.type === "Polygon") {
    return pointInPolygonRings(lng, lat, geometry.coordinates);
  }
  for (const polygon of geometry.coordinates) {
    if (pointInPolygonRings(lng, lat, polygon)) return true;
  }
  return false;
}

export function geometryBounds(geometries: (Polygon | MultiPolygon)[]): {
  minLng: number;
  maxLng: number;
  minLat: number;
  maxLat: number;
} {
  let minLng = Infinity;
  let maxLng = -Infinity;
  let minLat = Infinity;
  let maxLat = -Infinity;
  const visitRing = (ring: Position[]) => {
    for (const pos of ring) {
      const lng = pos[0];
      const lat = pos[1];
      if (lng < minLng) minLng = lng;
      if (lng > maxLng) maxLng = lng;
      if (lat < minLat) minLat = lat;
      if (lat > maxLat) maxLat = lat;
    }
  };
  for (const geom of geometries) {
    if (geom.type === "Polygon") {
      if (geom.coordinates[0]) visitRing(geom.coordinates[0]);
    } else {
      for (const poly of geom.coordinates) {
        if (poly[0]) visitRing(poly[0]);
      }
    }
  }
  return { minLng, maxLng, minLat, maxLat };
}

/** Rasterizes one or more GeoJSON polygons into the terrain pack pixel space and collects terrain summary stats. */
export function rasterizeGeometryMask(
  geometries: (Polygon | MultiPolygon)[],
  pack: TerrainPack,
): RegionRasterMask {
  const { meta, demHand, hazard, buildings } = pack;
  const { width, height, cellAreaKm2 } = meta;
  const bbox = geometryBounds(geometries);

  const topLeft = latLngToGrid(bbox.maxLat, bbox.minLng, meta);
  const bottomRight = latLngToGrid(bbox.minLat, bbox.maxLng, meta);

  const minX = clamp(topLeft.gx - 1, 0, width - 1);
  const maxX = clamp(bottomRight.gx + 1, 0, width - 1);
  const minY = clamp(topLeft.gy - 1, 0, height - 1);
  const maxY = clamp(bottomRight.gy + 1, 0, height - 1);

  const boxWidth = maxX - minX + 1;
  const boxHeight = maxY - minY + 1;
  const mask = new Uint8Array(boxWidth * boxHeight);

  const dems: number[] = [];
  let minDemM = Infinity;
  let maxDemM = -Infinity;
  let slopeSum = 0;
  let maxSlopeDeg = 0;
  let validPixels = 0;
  let totalBuildings = 0;
  let totalPopulation = 0;

  for (let gy = minY; gy <= maxY; gy++) {
    const { lat } = gridToLatLng(minX, gy, meta);
    for (let gx = minX; gx <= maxX; gx++) {
      const idx4 = (gy * width + gx) * 4;
      if (demHand[idx4 + 3] < 128) continue;

      const { lng } = gridToLatLng(gx, gy, meta);
      let inside = false;
      for (const geom of geometries) {
        if (pointInGeometry(lng, lat, geom)) {
          inside = true;
          break;
        }
      }
      if (!inside) continue;

      mask[(gy - minY) * boxWidth + (gx - minX)] = 1;
      const dem = decodeDemMeters(demHand[idx4], demHand[idx4 + 1]);
      const slope = hazard[idx4] / 4;
      dems.push(dem);
      if (dem < minDemM) minDemM = dem;
      if (dem > maxDemM) maxDemM = dem;
      slopeSum += slope;
      if (slope > maxSlopeDeg) maxSlopeDeg = slope;
      if (buildings) {
        totalBuildings += decodeBuildingCount(buildings[idx4], buildings[idx4 + 1]);
        totalPopulation += decodePopulationCell(buildings[idx4 + 2]);
      }
      validPixels++;
    }
  }

  let p10DemM = 0;
  if (dems.length > 0) {
    dems.sort((a, b) => a - b);
    p10DemM = dems[Math.floor(dems.length * 0.1)];
  } else {
    minDemM = 0;
    maxDemM = 0;
  }

  return {
    mask,
    minX,
    minY,
    maxX,
    maxY,
    validPixels,
    totalAreaKm2: validPixels * cellAreaKm2,
    totalBuildings,
    totalPopulation,
    minDemM,
    p10DemM,
    maxDemM,
    meanSlopeDeg: validPixels > 0 ? slopeSum / validPixels : 0,
    maxSlopeDeg,
  };
}

/** Evaluates educational inundation state for a single DEM+HAND terrain pixel. */
export function evaluateFloodCell(
  demM: number,
  handM: number,
  basinFloorDemM: number,
  waterRiseM: number,
): { flooded: boolean; depthM: number; tier: 0 | 1 | 2 | 3 } {
  if (waterRiseM <= 0) return { flooded: false, depthM: 0, tier: 0 };
  const relativeBasin = Math.max(0, (demM - basinFloorDemM) * 0.55);
  const effectiveHeight = Math.min(handM, relativeBasin);
  const depthM = waterRiseM - effectiveHeight;
  if (depthM <= 0) return { flooded: false, depthM: 0, tier: 0 };
  const tier = depthM >= 2.0 ? 3 : depthM >= 0.5 ? 2 : 1;
  return { flooded: true, depthM, tier };
}

/** Evaluates educational landslide susceptibility score (0..100) for a single terrain pixel. */
export function evaluateLandslideCell(
  slopeDeg: number,
  rainMmYr: number,
  landcoverScore: number,
  triggerRainMmDay: number,
  criticalSlopeDeg: number,
): { score: number; tier: 0 | 1 | 2 | 3 } {
  const minSlope = Math.max(6, criticalSlopeDeg * 0.55);
  if (slopeDeg < minSlope) return { score: 0, tier: 0 };

  const slopeFactor = clamp((slopeDeg - minSlope) / Math.max(8, 42 - minSlope), 0, 1.35);
  const rainFactor =
    0.42 +
    clamp((triggerRainMmDay - 40) / 180, 0, 1.2) * 0.78 +
    clamp((rainMmYr - 1500) / 3500, 0, 1) * 0.25;
  const coverFactor = 0.72 + (clamp(landcoverScore, 1, 5) - 1) * 0.14;
  const score = Math.round(clamp(slopeFactor * rainFactor * coverFactor * 100, 0, 100));

  const tier = score >= 75 ? 3 : score >= 52 ? 2 : score >= 32 ? 1 : 0;
  return { score, tier };
}

export function computeSimulationStats(
  pack: TerrainPack,
  region: RegionRasterMask,
  mode: SimulationMode,
  params: SimulationParams,
): SimulationStats {
  const { width, cellAreaKm2 } = pack.meta;
  const { demHand, hazard, buildings } = pack;
  const boxWidth = region.maxX - region.minX + 1;

  let affectedPixels = 0;
  let affectedBuildings = 0;
  let affectedPopulation = 0;
  let maxDepthM = 0;
  let maxRiskScore = 0;
  const tierCounts: [number, number, number] = [0, 0, 0];

  // Track the highest-impact inhabited cell so "Lihat Dekat 3D" lands on visible 3D buildings in the hazard zone.
  let bestFocusScore = -1;
  let bestFocusGx = -1;
  let bestFocusGy = -1;

  for (let gy = region.minY; gy <= region.maxY; gy++) {
    const maskRow = (gy - region.minY) * boxWidth;
    for (let gx = region.minX; gx <= region.maxX; gx++) {
      if (region.mask[maskRow + (gx - region.minX)] === 0) continue;
      const idx4 = (gy * width + gx) * 4;
      const cellBuildings = buildings ? decodeBuildingCount(buildings[idx4], buildings[idx4 + 1]) : 0;
      const cellPopulation = buildings ? decodePopulationCell(buildings[idx4 + 2]) : 0;

      if (mode === "flood") {
        const demM = decodeDemMeters(demHand[idx4], demHand[idx4 + 1]);
        const handM = decodeHandMeters(demHand[idx4 + 2]);
        const res = evaluateFloodCell(demM, handM, region.p10DemM, params.waterRiseM);
        if (res.tier > 0) {
          affectedPixels++;
          affectedBuildings += cellBuildings;
          affectedPopulation += cellPopulation;
          tierCounts[res.tier - 1]++;
          if (res.depthM > maxDepthM) maxDepthM = res.depthM;
          const focusScore = res.tier * 40 + Math.min(200, cellBuildings) * 2;
          if (focusScore > bestFocusScore) {
            bestFocusScore = focusScore;
            bestFocusGx = gx;
            bestFocusGy = gy;
          }
        }
      } else {
        const { slopeDeg, rainMmYr, landcoverScore } = decodeHazardPixel(
          hazard[idx4],
          hazard[idx4 + 1],
          hazard[idx4 + 2],
        );
        const res = evaluateLandslideCell(
          slopeDeg,
          rainMmYr,
          landcoverScore,
          params.triggerRainMmDay,
          params.criticalSlopeDeg,
        );
        if (res.tier > 0) {
          affectedPixels++;
          affectedBuildings += cellBuildings;
          affectedPopulation += cellPopulation;
          tierCounts[res.tier - 1]++;
          if (res.score > maxRiskScore) maxRiskScore = res.score;
          const focusScore = res.score + Math.min(120, cellBuildings) * 1.5;
          if (focusScore > bestFocusScore) {
            bestFocusScore = focusScore;
            bestFocusGx = gx;
            bestFocusGy = gy;
          }
        }
      }
    }
  }

  const focusCenter =
    bestFocusGx >= 0 && bestFocusGy >= 0 ? gridToLatLng(bestFocusGx, bestFocusGy, pack.meta) : null;

  return {
    affectedPixels,
    affectedAreaKm2: affectedPixels * cellAreaKm2,
    affectedPct: region.validPixels > 0 ? (affectedPixels / region.validPixels) * 100 : 0,
    affectedBuildings,
    affectedPopulation,
    tierCounts,
    maxDepthM,
    maxRiskScore,
    focusCenter,
  };
}

/** Shared pixel renderer used identically by both the 2D Leaflet canvas overlay and the 3D MapLibre draped canvas source. */
export function renderSimulationToImageData(
  pack: TerrainPack,
  region: RegionRasterMask,
  mode: SimulationMode,
  params: SimulationParams,
  revealProgress: number,
  wavePhase: number,
  imgData: ImageData,
  seedsOut: DebrisSeed[],
): void {
  const { width } = pack.meta;
  const { demHand, hazard } = pack;
  const out = imgData.data;
  out.fill(0);
  seedsOut.length = 0;

  const boxWidth = region.maxX - region.minX + 1;
  const effectiveWater = params.waterRiseM * revealProgress;
  const effectiveRain = 40 + (params.triggerRainMmDay - 40) * revealProgress;

  for (let gy = region.minY; gy <= region.maxY; gy++) {
    const maskRow = (gy - region.minY) * boxWidth;
    for (let gx = region.minX; gx <= region.maxX; gx++) {
      if (region.mask[maskRow + (gx - region.minX)] === 0) continue;
      const idx4 = (gy * width + gx) * 4;

      if (mode === "flood") {
        const demM = decodeDemMeters(demHand[idx4], demHand[idx4 + 1]);
        const handM = decodeHandMeters(demHand[idx4 + 2]);
        const cell = evaluateFloodCell(demM, handM, region.p10DemM, effectiveWater);
        if (!cell.flooded) continue;

        const shimmer = Math.sin(gx * 0.42 + gy * 0.28 - wavePhase) * 14;
        if (cell.tier === 3) {
          out[idx4] = clamp(30 + shimmer * 0.5, 0, 255);
          out[idx4 + 1] = clamp(58 + shimmer * 0.8, 0, 255);
          out[idx4 + 2] = clamp(138 + shimmer, 0, 255);
          out[idx4 + 3] = 216;
        } else if (cell.tier === 2) {
          out[idx4] = clamp(37 + shimmer * 0.6, 0, 255);
          out[idx4 + 1] = clamp(99 + shimmer, 0, 255);
          out[idx4 + 2] = clamp(235 + shimmer * 0.6, 0, 255);
          out[idx4 + 3] = 190;
        } else {
          out[idx4] = clamp(56 + shimmer * 0.6, 0, 255);
          out[idx4 + 1] = clamp(189 + shimmer * 0.8, 0, 255);
          out[idx4 + 2] = 248;
          out[idx4 + 3] = 158;
        }
      } else {
        const { slopeDeg, rainMmYr, downslopeRad, landcoverScore } = decodeHazardPixel(
          hazard[idx4],
          hazard[idx4 + 1],
          hazard[idx4 + 2],
        );
        const cell = evaluateLandslideCell(
          slopeDeg,
          rainMmYr,
          landcoverScore,
          effectiveRain,
          params.criticalSlopeDeg,
        );
        if (cell.tier === 0) continue;

        if (cell.tier === 3) {
          out[idx4] = 225;
          out[idx4 + 1] = 20;
          out[idx4 + 2] = 20;
          out[idx4 + 3] = 230;
          if ((gx + gy) % 2 === 0 && seedsOut.length < 400) {
            seedsOut.push({ x: gx + 0.5, y: gy + 0.5, rad: downslopeRad, tier: 3 });
          }
        } else if (cell.tier === 2) {
          out[idx4] = 255;
          out[idx4 + 1] = 102;
          out[idx4 + 2] = 0;
          out[idx4 + 3] = 208;
          if ((gx + gy) % 3 === 0 && seedsOut.length < 400) {
            seedsOut.push({ x: gx + 0.5, y: gy + 0.5, rad: downslopeRad, tier: 2 });
          }
        } else {
          out[idx4] = 250;
          out[idx4 + 1] = 204;
          out[idx4 + 2] = 21;
          out[idx4 + 3] = 180;
        }
      }
    }
  }
}

export function samplePointMetrics(pack: TerrainPack, lat: number, lng: number): PointTerrainSample | null {
  const { gx, gy } = latLngToGrid(lat, lng, pack.meta);
  const { width, height } = pack.meta;
  if (gx < 0 || gy < 0 || gx >= width || gy >= height) return null;
  const idx4 = (gy * width + gx) * 4;
  if (pack.demHand[idx4 + 3] < 128) return null;
  const demM = decodeDemMeters(pack.demHand[idx4], pack.demHand[idx4 + 1]);
  const handM = decodeHandMeters(pack.demHand[idx4 + 2]);
  const { slopeDeg, rainMmYr, landcoverScore } = decodeHazardPixel(
    pack.hazard[idx4],
    pack.hazard[idx4 + 1],
    pack.hazard[idx4 + 2],
  );
  const buildingCount = pack.buildings
    ? decodeBuildingCount(pack.buildings[idx4], pack.buildings[idx4 + 1])
    : 0;
  const populationCount = pack.buildings ? decodePopulationCell(pack.buildings[idx4 + 2]) : 0;
  return { demM, handM, slopeDeg, rainMmYr, landcoverScore, buildingCount, populationCount };
}

/** Evaluates the exact clicked coordinate against the active flood or landslide scenario. */
export function describeClickedPointSimulation(
  sample: PointTerrainSample,
  basinFloorDemM: number,
  mode: SimulationMode,
  params: SimulationParams,
): ClickedPointAssessment {
  const elevText = `${Math.round(sample.demM).toLocaleString("id-ID")} mdpl`;
  if (mode === "flood") {
    const res = evaluateFloodCell(sample.demM, sample.handM, basinFloorDemM, params.waterRiseM);
    if (res.flooded) {
      const depth = res.depthM.toLocaleString("id-ID", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
      return {
        status: "hazard",
        summary: `Titik klik terendam ~${depth} m · elevasi ${elevText}`,
      };
    }
    const relativeBasin = Math.max(0, (sample.demM - basinFloorDemM) * 0.55);
    const effectiveHeight = Math.min(sample.handM, relativeBasin);
    const margin = Math.max(0.1, effectiveHeight - params.waterRiseM);
    const marginText = margin.toLocaleString("id-ID", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
    return {
      status: "safe",
      summary: `Titik klik tidak tergenang (+${marginText} m di atas muka air · ${elevText})`,
    };
  }

  const res = evaluateLandslideCell(
    sample.slopeDeg,
    sample.rainMmYr,
    sample.landcoverScore,
    params.triggerRainMmDay,
    params.criticalSlopeDeg,
  );
  const slopeText = sample.slopeDeg.toLocaleString("id-ID", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  if (res.tier === 3) {
    return { status: "hazard", summary: `Titik klik zona kritis · lereng ${slopeText}° · ${elevText}` };
  }
  if (res.tier === 2) {
    return { status: "hazard", summary: `Titik klik zona siaga · lereng ${slopeText}° · ${elevText}` };
  }
  if (res.tier === 1) {
    return { status: "hazard", summary: `Titik klik zona waspada · lereng ${slopeText}° · ${elevText}` };
  }
  return { status: "safe", summary: `Titik klik lereng relatif stabil (${slopeText}° · ${elevText})` };
}

function quickHaversineMeters(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const rad = Math.PI / 180;
  const dLat = (lat2 - lat1) * rad;
  const dLng = (lng2 - lng1) * rad;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * rad) * Math.cos(lat2 * rad) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  return 6371000 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/** Finds the closest evacuation site outside the active flood inundation or high-risk landslide zone. */
export function findNearestSafeEvacuationSite(
  pack: TerrainPack,
  basinFloorDemM: number,
  mode: SimulationMode,
  params: SimulationParams,
  origin: { lat: number; lng: number },
  sites: readonly { id: number; name?: string | null; category?: string | null; latitude: number; longitude: number }[],
): SafeEvacuationMatch | null {
  let best: SafeEvacuationMatch | null = null;
  for (const site of sites) {
    const distanceM = quickHaversineMeters(origin.lat, origin.lng, site.latitude, site.longitude);
    if (best && distanceM >= best.distanceM) continue;

    const sample = samplePointMetrics(pack, site.latitude, site.longitude);
    if (sample) {
      if (mode === "flood") {
        const flood = evaluateFloodCell(sample.demM, sample.handM, basinFloorDemM, params.waterRiseM);
        if (flood.flooded) continue;
      } else {
        const slide = evaluateLandslideCell(
          sample.slopeDeg,
          sample.rainMmYr,
          sample.landcoverScore,
          params.triggerRainMmDay,
          params.criticalSlopeDeg,
        );
        if (slide.tier >= 2) continue;
      }
    }

    best = {
      id: site.id,
      name: site.name || "Titik evakuasi tanpa nama",
      category: site.category ?? null,
      latitude: site.latitude,
      longitude: site.longitude,
      distanceM,
      elevationM: sample ? Math.round(sample.demM) : null,
    };
  }
  return best;
}

function decodePngToRgba(url: string, width: number, height: number): Promise<Uint8ClampedArray> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.decoding = "async";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (!ctx) {
        reject(new Error("Canvas 2D context tidak tersedia."));
        return;
      }
      ctx.drawImage(img, 0, 0, width, height);
      resolve(ctx.getImageData(0, 0, width, height).data);
    };
    img.onerror = () => reject(new Error(`Gagal memuat tekstur simulasi: ${url}`));
    img.src = url;
  });
}

let cachedPackPromise: Promise<TerrainPack> | null = null;

export function loadTerrainPack(): Promise<TerrainPack> {
  if (!cachedPackPromise) {
    cachedPackPromise = (async () => {
      const metaRes = await fetch("/simulation/terrain-meta.json");
      if (!metaRes.ok) throw new Error("Metadata kontur simulasi gagal dimuat.");
      const meta: TerrainMeta = await metaRes.json();
      const [demHand, hazard, buildings] = await Promise.all([
        decodePngToRgba(meta.files.demHand, meta.width, meta.height),
        decodePngToRgba(meta.files.hazardParams, meta.width, meta.height),
        meta.files.buildings
          ? decodePngToRgba(meta.files.buildings, meta.width, meta.height).catch(() => null)
          : Promise.resolve(null),
      ]);
      return { meta, demHand, hazard, buildings };
    })().catch((error) => {
      cachedPackPromise = null;
      throw error;
    });
  }
  return cachedPackPromise;
}
