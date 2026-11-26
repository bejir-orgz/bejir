#!/usr/bin/env node
/**
 * Builds a compact (< 25 KB) real-data 3D diorama grid for the SIBAJAWA landing page
 * by slicing the Cekungan Bandung / DAS Citarum corridor directly from the existing
 * apps/web/public/simulation/terrain-*.png raster packs.
 *
 * Uses only Node.js built-ins (node:fs, node:path, node:zlib).
 */
import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";

const scriptDir = import.meta.dirname;
const repoRoot = path.resolve(scriptDir, "../..");
const simDir = path.resolve(repoRoot, "apps/web/public/simulation");

const GRID_W = 72;
const GRID_H = 56;

// Cekungan Bandung & Hulu Priangan corridor (mountains north & south, flat Citarum flood basin in center).
const SLICE_BOUNDS = {
  west: 107.42,
  east: 107.84,
  north: -6.76,
  south: -7.14,
};

function clamp(v, lo, hi) {
  return v < lo ? lo : v > hi ? hi : v;
}

function mercY(latDeg) {
  return Math.log(Math.tan(Math.PI / 4 + (latDeg * Math.PI) / 360));
}

function paethPredictor(a, b, c) {
  const p = a + b - c;
  const pa = Math.abs(p - a);
  const pb = Math.abs(p - b);
  const pc = Math.abs(p - c);
  if (pa <= pb && pa <= pc) return a;
  if (pb <= pc) return b;
  return c;
}

/** Decodes an 8-bit RGBA PNG into { width, height, rgba: Uint8Array }. */
function decodeRgbaPng(filePath) {
  const buf = fs.readFileSync(filePath);
  let offset = 8;
  let width = 0;
  let height = 0;
  const idatChunks = [];

  while (offset + 8 <= buf.length) {
    const length = buf.readUInt32BE(offset);
    const type = buf.toString("ascii", offset + 4, offset + 8);
    const dataStart = offset + 8;
    if (type === "IHDR") {
      width = buf.readUInt32BE(dataStart);
      height = buf.readUInt32BE(dataStart + 4);
    } else if (type === "IDAT") {
      idatChunks.push(buf.subarray(dataStart, dataStart + length));
    } else if (type === "IEND") {
      break;
    }
    offset = dataStart + length + 4;
  }

  const raw = zlib.inflateSync(Buffer.concat(idatChunks));
  const stride = width * 4;
  const rgba = new Uint8Array(width * height * 4);

  for (let y = 0; y < height; y++) {
    const filter = raw[y * (stride + 1)];
    const rowIn = y * (stride + 1) + 1;
    const rowOut = y * stride;
    for (let x = 0; x < stride; x++) {
      const val = raw[rowIn + x];
      const left = x >= 4 ? rgba[rowOut + x - 4] : 0;
      const up = y > 0 ? rgba[rowOut - stride + x] : 0;
      const upLeft = y > 0 && x >= 4 ? rgba[rowOut - stride + x - 4] : 0;
      let recon = val;
      if (filter === 1) recon = (val + left) & 255;
      else if (filter === 2) recon = (val + up) & 255;
      else if (filter === 3) recon = (val + ((left + up) >> 1)) & 255;
      else if (filter === 4) recon = (val + paethPredictor(left, up, upLeft)) & 255;
      rgba[rowOut + x] = recon;
    }
  }
  return { width, height, rgba };
}

function decodeDemMeters(r, g) {
  return ((r << 8) | g) / 10 - 20;
}

function decodeHandMeters(b) {
  if (b <= 150) return b / 10;
  if (b < 255) return 15 + (b - 150) / 2;
  return 75;
}

function main() {
  const meta = JSON.parse(fs.readFileSync(path.join(simDir, "terrain-meta.json"), "utf8"));
  const demImg = decodeRgbaPng(path.join(simDir, "terrain-dem-hand.png"));
  const hazImg = decodeRgbaPng(path.join(simDir, "terrain-hazard-params.png"));
  const bldImg = decodeRgbaPng(path.join(simDir, "terrain-buildings.png"));

  const lngSpan = meta.bounds.east - meta.bounds.west;
  const mercSpan = meta.mercNorth - meta.mercSouth;

  const demArr = new Float32Array(GRID_W * GRID_H);
  const handArr = new Float32Array(GRID_W * GRID_H);
  const slopeArr = new Float32Array(GRID_W * GRID_H);
  const rainArr = new Float32Array(GRID_W * GRID_H);
  const bldArr = new Float32Array(GRID_W * GRID_H);

  let minDem = Infinity;
  let maxDem = -Infinity;
  let maxBld = 1;

  for (let y = 0; y < GRID_H; y++) {
    const lat = SLICE_BOUNDS.north + (y / (GRID_H - 1)) * (SLICE_BOUNDS.south - SLICE_BOUNDS.north);
    const py = clamp(Math.round(((meta.mercNorth - mercY(lat)) / mercSpan) * (meta.height - 1)), 0, meta.height - 1);
    for (let x = 0; x < GRID_W; x++) {
      const lng = SLICE_BOUNDS.west + (x / (GRID_W - 1)) * (SLICE_BOUNDS.east - SLICE_BOUNDS.west);
      const px = clamp(Math.round(((lng - meta.bounds.west) / lngSpan) * (meta.width - 1)), 0, meta.width - 1);
      const srcIdx = (py * meta.width + px) * 4;
      const dstIdx = y * GRID_W + x;

      const dem = decodeDemMeters(demImg.rgba[srcIdx], demImg.rgba[srcIdx + 1]);
      const hand = decodeHandMeters(demImg.rgba[srcIdx + 2]);
      const slope = hazImg.rgba[srcIdx] / 4;
      const rain = 1000 + hazImg.rgba[srcIdx + 1] * 20;
      const bld = (bldImg.rgba[srcIdx] << 8) | bldImg.rgba[srcIdx + 1];

      demArr[dstIdx] = dem;
      handArr[dstIdx] = hand;
      slopeArr[dstIdx] = slope;
      rainArr[dstIdx] = rain;
      bldArr[dstIdx] = bld;

      if (dem < minDem) minDem = dem;
      if (dem > maxDem) maxDem = dem;
      if (bld > maxBld) maxBld = bld;
    }
  }

  // Gentle 1-pass 3x3 smoothing on DEM so the 3D terrain mesh looks sculptural without stair-stepping.
  const smoothDem = new Float32Array(GRID_W * GRID_H);
  for (let y = 0; y < GRID_H; y++) {
    for (let x = 0; x < GRID_W; x++) {
      let sum = 0;
      let weight = 0;
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          const nx = clamp(x + dx, 0, GRID_W - 1);
          const ny = clamp(y + dy, 0, GRID_H - 1);
          const w = dx === 0 && dy === 0 ? 4 : dx === 0 || dy === 0 ? 2 : 1;
          sum += demArr[ny * GRID_W + nx] * w;
          weight += w;
        }
      }
      smoothDem[y * GRID_W + x] = sum / weight;
    }
  }

  const demRange = Math.max(1, maxDem - minDem);
  const demU8 = new Uint8Array(GRID_W * GRID_H);
  const handU8 = new Uint8Array(GRID_W * GRID_H);
  const rainU8 = new Uint8Array(GRID_W * GRID_H);
  const riskU8 = new Uint8Array(GRID_W * GRID_H);

  // Compute P10 basin floor elevation for realistic flood threshold calibration.
  const sortedDem = Array.from(smoothDem).sort((a, b) => a - b);
  const p10Dem = sortedDem[Math.floor(sortedDem.length * 0.14)];

  for (let i = 0; i < GRID_W * GRID_H; i++) {
    demU8[i] = clamp(Math.round(((smoothDem[i] - minDem) / demRange) * 255), 0, 255);
    handU8[i] = clamp(Math.round((handArr[i] / 35) * 255), 0, 255);
    rainU8[i] = clamp(Math.round(((rainArr[i] - 1800) / 2200) * 255), 0, 255);

    // Composite AHP-inspired flood susceptibility (low HAND + low slope + basin floor + urban density).
    const handFactor = 1 - clamp(handArr[i] / 18, 0, 1);
    const slopeFactor = 1 - clamp(slopeArr[i] / 20, 0, 1);
    const elevFactor = 1 - clamp((smoothDem[i] - minDem) / (demRange * 0.45), 0, 1);
    const riskScore = handFactor * 0.45 + slopeFactor * 0.3 + elevFactor * 0.25;
    riskU8[i] = clamp(Math.round(riskScore * 255), 0, 255);
  }

  // Extract ~150 prominent urban building blocks from real high-density cells in Cekungan Bandung.
  const bldCandidates = [];
  for (let y = 3; y < GRID_H - 3; y += 2) {
    for (let x = 3; x < GRID_W - 3; x += 2) {
      const idx = y * GRID_W + x;
      if (bldArr[idx] >= 35 && slopeArr[idx] < 16) {
        bldCandidates.push({
          x,
          y,
          c: bldArr[idx],
          demNorm: Number((demU8[idx] / 255).toFixed(3)),
        });
      }
    }
  }
  bldCandidates.sort((a, b) => b.c - a.c);
  const buildings = bldCandidates.slice(0, 145).map((item) => [
    item.x,
    item.y,
    clamp(Math.round((Math.sqrt(item.c / maxBld)) * 100), 18, 100),
  ]);

  // Locate 3 real terrain anchors:
  // 01: High northern upstream ridge (Hulu Priangan / Lembang)
  // 02: Lowest densely built basin floor (Cekungan Citarum / Dayeuhkolot)
  // 03: Dry elevated foothold near the basin (Pos Evakuasi Aman di luar zona genangan)
  let huluBest = { x: 36, y: 8, score: -Infinity };
  let basinBest = { x: 36, y: 34, score: -Infinity };
  for (let y = 4; y < Math.floor(GRID_H * 0.35); y++) {
    for (let x = 14; x < GRID_W - 14; x++) {
      const idx = y * GRID_W + x;
      const sc = smoothDem[idx] + rainArr[idx] * 0.2;
      if (sc > huluBest.score) huluBest = { x, y, score: sc };
    }
  }
  for (let y = Math.floor(GRID_H * 0.38); y < Math.floor(GRID_H * 0.72); y++) {
    for (let x = 16; x < GRID_W - 16; x++) {
      const idx = y * GRID_W + x;
      const sc = (1 - clamp(handArr[idx] / 12, 0, 1)) * 120 + Math.min(bldArr[idx], 400) * 0.35 - (smoothDem[idx] - minDem) * 0.4;
      if (sc > basinBest.score) basinBest = { x, y, score: sc };
    }
  }
  let safeBest = { x: Math.min(GRID_W - 8, basinBest.x + 12), y: Math.max(8, basinBest.y - 10), score: -Infinity };
  for (let y = 10; y < GRID_H - 10; y++) {
    for (let x = 10; x < GRID_W - 10; x++) {
      const dx = x - basinBest.x;
      const dy = y - basinBest.y;
      const dist = Math.hypot(dx, dy);
      if (dist < 10 || dist > 22) continue;
      const idx = y * GRID_W + x;
      const elevAboveBasin = smoothDem[idx] - smoothDem[basinBest.y * GRID_W + basinBest.x];
      if (elevAboveBasin < 45 || handArr[idx] < 10 || slopeArr[idx] > 18) continue;
      const sc = Math.min(elevAboveBasin, 160) - dist * 2.5 + Math.min(bldArr[idx], 200) * 0.2;
      if (sc > safeBest.score) safeBest = { x, y, score: sc };
    }
  }

  const payload = {
    version: 1,
    regionLabel: "Koridor Cekungan Bandung & DAS Citarum",
    width: GRID_W,
    height: GRID_H,
    minDemM: Math.round(minDem),
    maxDemM: Math.round(maxDem),
    basinFloorNorm: Number(((p10Dem - minDem) / demRange).toFixed(4)),
    anchors: {
      upstream: [huluBest.x, huluBest.y, Math.round(smoothDem[huluBest.y * GRID_W + huluBest.x])],
      basin: [basinBest.x, basinBest.y, Math.round(smoothDem[basinBest.y * GRID_W + basinBest.x])],
      evacSafe: [safeBest.x, safeBest.y, Math.round(smoothDem[safeBest.y * GRID_W + safeBest.x])],
    },
    demB64: Buffer.from(demU8).toString("base64"),
    handB64: Buffer.from(handU8).toString("base64"),
    rainB64: Buffer.from(rainU8).toString("base64"),
    riskB64: Buffer.from(riskU8).toString("base64"),
    buildings,
  };

  const outPath = path.join(simDir, "landing-diorama-grid.json");
  const jsonText = JSON.stringify(payload);
  fs.writeFileSync(outPath, jsonText, "utf8");
  const rawKb = (Buffer.byteLength(jsonText) / 1024).toFixed(1);
  const gzKb = (zlib.gzipSync(jsonText).length / 1024).toFixed(1);

  console.log(
    `Built landing diorama grid (${GRID_W}x${GRID_H}): DEM ${payload.minDemM}..${payload.maxDemM} mdpl, ${buildings.length} 3D building clusters`,
  );
  console.log(
    `Anchors -> Hulu: (${payload.anchors.upstream.join(",")}), Cekungan: (${payload.anchors.basin.join(",")}), Evakuasi: (${payload.anchors.evacSafe.join(",")})`,
  );
  console.log(`Output: ${outPath} (${rawKb} KB raw, ${gzKb} KB gzip)`);
}

main();
