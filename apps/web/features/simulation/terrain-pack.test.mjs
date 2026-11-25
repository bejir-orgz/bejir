import assert from "node:assert/strict";
import test from "node:test";
import {
  computeSimulationStats,
  decodeBuildingCount,
  decodeDemMeters,
  decodeHandMeters,
  decodeHazardPixel,
  encodeDemMeters,
  encodeHandMeters,
  evaluateFloodCell,
  evaluateLandslideCell,
  gridToLatLng,
  latLngToGrid,
  mercY,
  rasterizeGeometryMask,
} from "./terrain-pack.ts";

const sampleMeta = {
  version: 2,
  projection: "EPSG:3857-grid",
  width: 20,
  height: 20,
  bounds: { west: 107.0, south: -7.2, east: 108.0, north: -6.4 },
  mercNorth: mercY(-6.4),
  mercSouth: mercY(-7.2),
  cellAreaKm2: 0.5,
  stats: { validPixels: 400, totalBuildings: 5000, minDemM: 0, maxDemM: 1200, maxSlopeDeg: 45 },
  files: {
    demHand: "/simulation/terrain-dem-hand.png",
    hazardParams: "/simulation/terrain-hazard-params.png",
    buildings: "/simulation/terrain-buildings.png",
  },
};

test("DEM, HAND, and 16-bit building counts encode/decode accurately", () => {
  for (const dem of [-4.5, 0, 12.3, 665.8, 2920.6]) {
    const [r, g] = encodeDemMeters(dem);
    const decoded = decodeDemMeters(r, g);
    assert.ok(Math.abs(decoded - dem) <= 0.11, `DEM ${dem} decoded to ${decoded}`);
  }

  for (const hand of [0, 0.4, 3.7, 14.9]) {
    const decoded = decodeHandMeters(encodeHandMeters(hand));
    assert.ok(Math.abs(decoded - hand) <= 0.11, `HAND ${hand} decoded to ${decoded}`);
  }
  assert.ok(Math.abs(decodeHandMeters(encodeHandMeters(40)) - 40) <= 0.51);
  assert.ok(decodeHandMeters(encodeHandMeters(120)) >= 67);

  for (const count of [0, 12, 255, 420, 3210]) {
    assert.equal(decodeBuildingCount((count >> 8) & 255, count & 255), count);
  }
});

test("hazard pixel decoding extracts slope, rainfall, downslope direction, and landcover score", () => {
  const dir32 = 12;
  const lc = 4;
  const decoded = decodeHazardPixel(88, 100, (dir32 << 3) | lc);
  assert.equal(decoded.slopeDeg, 22);
  assert.equal(decoded.rainMmYr, 3000);
  assert.equal(decoded.landcoverScore, 4);
  assert.ok(decoded.downslopeRad > -Math.PI && decoded.downslopeRad < Math.PI);
});

test("Mercator grid coordinate roundtrip stays within one cell", () => {
  const pt = { lat: -6.91, lng: 107.61 };
  const cell = latLngToGrid(pt.lat, pt.lng, sampleMeta);
  const back = gridToLatLng(cell.gx, cell.gy, sampleMeta);
  assert.ok(Math.abs(back.lat - pt.lat) < 0.05);
  assert.ok(Math.abs(back.lng - pt.lng) < 0.06);
});

test("flood simulation floods low basin/HAND first and keeps high ground dry", () => {
  const lowBasin = evaluateFloodCell(660, 0.8, 660, 2.5);
  const midSlope = evaluateFloodCell(690, 8.5, 660, 2.5);
  const hillTop = evaluateFloodCell(1100, 45, 660, 2.5);
  assert.equal(lowBasin.flooded, true);
  assert.equal(lowBasin.tier, 3);
  assert.equal(midSlope.flooded, false);
  assert.equal(hillTop.flooded, false);
});

test("landslide simulation flags steep wet slopes and keeps flat plains stable", () => {
  const flatPlain = evaluateLandslideCell(2.5, 3200, 5, 180, 18);
  const steepOpen = evaluateLandslideCell(34, 3400, 5, 160, 18);
  const steepForest = evaluateLandslideCell(26, 2600, 1, 100, 18);
  assert.equal(flatPlain.tier, 0);
  assert.equal(steepOpen.tier, 3);
  assert.ok(steepOpen.score > steepForest.score);
});

test("rasterizeGeometryMask and computeSimulationStats track affectedBuildings and focusCenter monotonically", () => {
  const demHand = new Uint8ClampedArray(20 * 20 * 4);
  const hazard = new Uint8ClampedArray(20 * 20 * 4);
  const buildings = new Uint8ClampedArray(20 * 20 * 4);
  for (let y = 0; y < 20; y++) {
    for (let x = 0; x < 20; x++) {
      const idx = (y * 20 + x) * 4;
      const dem = x < 10 ? 100 + x * 0.5 : 220 + (x - 10) * 18;
      const hand = x < 10 ? x * 0.4 : 30 + x;
      const slope = x < 10 ? 2 : 14 + (x - 10) * 3;
      const cellBld = x < 10 ? 40 : 12;
      const [r, g] = encodeDemMeters(dem);
      demHand[idx] = r;
      demHand[idx + 1] = g;
      demHand[idx + 2] = encodeHandMeters(hand);
      demHand[idx + 3] = 255;

      hazard[idx] = Math.min(255, Math.round(slope * 4));
      hazard[idx + 1] = 100;
      hazard[idx + 2] = (8 << 3) | 4;
      hazard[idx + 3] = 255;

      buildings[idx] = (cellBld >> 8) & 255;
      buildings[idx + 1] = cellBld & 255;
      buildings[idx + 2] = 0;
      buildings[idx + 3] = 255;
    }
  }
  const pack = { meta: sampleMeta, demHand, hazard, buildings };
  const polygon = {
    type: "Polygon",
    coordinates: [
      [
        [107.1, -6.5],
        [107.9, -6.5],
        [107.9, -7.1],
        [107.1, -7.1],
        [107.1, -6.5],
      ],
    ],
  };

  const regionMask = rasterizeGeometryMask([polygon], pack);
  assert.ok(regionMask.validPixels > 100);
  assert.ok(regionMask.totalBuildings > 1000);

  const lowFlood = computeSimulationStats(pack, regionMask, "flood", {
    waterRiseM: 1.0,
    triggerRainMmDay: 120,
    criticalSlopeDeg: 18,
  });
  const highFlood = computeSimulationStats(pack, regionMask, "flood", {
    waterRiseM: 6.0,
    triggerRainMmDay: 120,
    criticalSlopeDeg: 18,
  });
  assert.ok(highFlood.affectedPixels > lowFlood.affectedPixels);
  assert.ok(highFlood.affectedBuildings > lowFlood.affectedBuildings);
  assert.ok(highFlood.focusCenter !== null);
  assert.ok(highFlood.focusCenter.lng >= 107.0 && highFlood.focusCenter.lng <= 108.0);

  const mildSlide = computeSimulationStats(pack, regionMask, "landslide", {
    waterRiseM: 3.0,
    triggerRainMmDay: 60,
    criticalSlopeDeg: 24,
  });
  const severeSlide = computeSimulationStats(pack, regionMask, "landslide", {
    waterRiseM: 3.0,
    triggerRainMmDay: 200,
    criticalSlopeDeg: 14,
  });
  assert.ok(severeSlide.affectedPixels > mildSlide.affectedPixels);
  assert.ok(severeSlide.affectedBuildings > mildSlide.affectedBuildings);
  assert.ok(severeSlide.focusCenter !== null);
});
