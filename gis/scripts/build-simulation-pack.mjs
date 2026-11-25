#!/usr/bin/env node
/**
 * One-shot offline builder that extracts the 5 co-registered 30m UTM 48S GeoTIFFs
 * from ../../02_processed (read-only) into two compact Web-Mercator RGBA PNGs
 * plus terrain-meta.json under apps/web/public/simulation/.
 *
 * Uses only Node.js built-ins (node:fs, node:path, node:zlib) so it runs inside
 * any sandbox with zero external GIS or npm dependencies.
 */
import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";

const scriptDir = import.meta.dirname;
const repoRoot = path.resolve(scriptDir, "../..");
const processedDir = process.env.BEJIR_PROCESSED_DIR
  ? path.resolve(process.env.BEJIR_PROCESSED_DIR)
  : path.resolve(repoRoot, "../../02_processed");
const outputDir = path.resolve(repoRoot, "apps/web/public/simulation");

const TARGET_WIDTH = 768;
const TARGET_HEIGHT = 615;
const BOUNDS = {
  west: 106.35,
  south: -7.85,
  east: 108.86,
  north: -5.88,
};

const SOURCE_FILES = {
  dem: path.join(processedDir, "dem/dem_jabar_30m_masked.tif"),
  hand: path.join(processedDir, "hand/hand_masked.tif"),
  slope: path.join(processedDir, "slope/slope_jabar_30m.tif"),
  rain: path.join(processedDir, "hujan/hujan_30m_masked.tif"),
  landcover: path.join(processedDir, "landcover/skor_landcover.tif"),
};

function clamp(value, min, max) {
  return value < min ? min : value > max ? max : value;
}

function mercY(latDeg) {
  return Math.log(Math.tan(Math.PI / 4 + (latDeg * Math.PI) / 360));
}

function unmercY(y) {
  return ((2 * Math.atan(Math.exp(y)) - Math.PI / 2) * 180) / Math.PI;
}

/** Redfearn WGS84 (EPSG:4326) -> UTM Zone 48S (EPSG:32748) in metres. */
function latLngToUtm48S(latDeg, lngDeg) {
  const a = 6378137.0;
  const f = 1 / 298.257223563;
  const e2 = f * (2 - f);
  const ep2 = e2 / (1 - e2);
  const k0 = 0.9996;
  const lon0 = (105 * Math.PI) / 180;

  const lat = (latDeg * Math.PI) / 180;
  const lon = (lngDeg * Math.PI) / 180;
  const sinLat = Math.sin(lat);
  const cosLat = Math.cos(lat);
  const tanLat = Math.tan(lat);

  const N = a / Math.sqrt(1 - e2 * sinLat * sinLat);
  const T = tanLat * tanLat;
  const C = ep2 * cosLat * cosLat;
  const A = cosLat * (lon - lon0);

  const e4 = e2 * e2;
  const e6 = e4 * e2;
  const M =
    a *
    ((1 - e2 / 4 - (3 * e4) / 64 - (5 * e6) / 256) * lat -
      ((3 * e2) / 8 + (3 * e4) / 32 + (45 * e6) / 1024) * Math.sin(2 * lat) +
      ((15 * e4) / 256 + (45 * e6) / 1024) * Math.sin(4 * lat) -
      ((35 * e6) / 3072) * Math.sin(6 * lat));

  const A2 = A * A;
  const A3 = A2 * A;
  const A4 = A2 * A2;
  const A5 = A4 * A;
  const A6 = A4 * A2;

  const easting =
    500000 +
    k0 *
      N *
      (A +
        ((1 - T + C) * A3) / 6 +
        ((5 - 18 * T + T * T + 72 * C - 58 * ep2) * A5) / 120);

  const northing =
    10000000 +
    k0 *
      (M +
        N *
          tanLat *
          (A2 / 2 +
            ((5 - T + 9 * C + 4 * C * C) * A4) / 24 +
            ((61 - 58 * T + T * T + 600 * C - 330 * ep2) * A6) / 720));

  return { easting, northing };
}

/** Fast TIFF LZW MSB-first decoder (Compression = 5, Predictor = 1). */
function decodeLzw(buf, expectedBytes) {
  const out = new Uint8Array(expectedBytes);
  let outPos = 0;

  const prefix = new Int32Array(4096);
  const suffix = new Uint8Array(4096);
  const stack = new Uint8Array(4096);

  let bitPos = 0;
  const totalBits = buf.length * 8;
  let codeSize = 9;
  let nextCode = 258;

  const reset = () => {
    for (let i = 0; i < 256; i++) {
      prefix[i] = -1;
      suffix[i] = i;
    }
    codeSize = 9;
    nextCode = 258;
  };

  const readCode = () => {
    if (bitPos + codeSize > totalBits) return 257;
    const byteIdx = bitPos >> 3;
    const bitOff = bitPos & 7;
    let combined =
      (buf[byteIdx] << 16) |
      ((buf[byteIdx + 1] ?? 0) << 8) |
      (buf[byteIdx + 2] ?? 0);
    const shift = 24 - bitOff - codeSize;
    bitPos += codeSize;
    return (combined >>> shift) & ((1 << codeSize) - 1);
  };

  reset();
  let oldCode = -1;
  let firstChar = 0;

  while (true) {
    const code = readCode();
    if (code === 257) break;
    if (code === 256) {
      reset();
      const first = readCode();
      if (first === 257) break;
      if (outPos < expectedBytes) out[outPos++] = first;
      oldCode = first;
      firstChar = first;
      continue;
    }

    let inCode = code;
    let stackTop = 0;
    if (code >= nextCode) {
      stack[stackTop++] = firstChar;
      inCode = oldCode;
    }
    while (inCode >= 256) {
      stack[stackTop++] = suffix[inCode];
      inCode = prefix[inCode];
    }
    firstChar = suffix[inCode];
    stack[stackTop++] = firstChar;

    while (stackTop > 0 && outPos < expectedBytes) {
      out[outPos++] = stack[--stackTop];
    }

    if (nextCode < 4096) {
      prefix[nextCode] = oldCode;
      suffix[nextCode] = firstChar;
      nextCode++;
      if (nextCode === 511) codeSize = 10;
      else if (nextCode === 1023) codeSize = 11;
      else if (nextCode === 2047) codeSize = 12;
    }
    oldCode = code;
  }

  return Buffer.from(out.buffer, 0, outPos);
}

class GeoTiffSampler {
  constructor(filePath) {
    this.filePath = filePath;
    this.fd = fs.openSync(filePath, "r");
    const header = Buffer.alloc(8);
    fs.readSync(this.fd, header, 0, 8, 0);
    const ifdOffset = header.readUInt32LE(4);
    const countBuf = Buffer.alloc(2);
    fs.readSync(this.fd, countBuf, 0, 2, ifdOffset);
    const count = countBuf.readUInt16LE(0);
    const entries = Buffer.alloc(count * 12);
    fs.readSync(this.fd, entries, 0, count * 12, ifdOffset + 2);

    const typeSize = { 1: 1, 2: 1, 3: 2, 4: 4, 5: 8, 12: 8 };
    const readTagBuffer = (type, n, valFieldOffset) => {
      const bytes = n * (typeSize[type] || 1);
      if (bytes <= 4) return entries.subarray(valFieldOffset, valFieldOffset + 4);
      const offset = entries.readUInt32LE(valFieldOffset);
      const b = Buffer.alloc(bytes);
      fs.readSync(this.fd, b, 0, bytes, offset);
      return b;
    };

    this.width = 0;
    this.height = 0;
    this.bits = 32;
    this.sampleFormat = 3;
    this.compression = 1;
    this.tileWidth = 0;
    this.tileHeight = 0;
    this.rowsPerStrip = 0;
    this.offsets = null;
    this.byteCounts = null;
    this.scaleX = 30;
    this.scaleY = 30;
    this.originX = 651120;
    this.originY = 9358020;
    this.nodata = -9999;

    for (let i = 0; i < count; i++) {
      const base = i * 12;
      const tag = entries.readUInt16LE(base);
      const type = entries.readUInt16LE(base + 2);
      const n = entries.readUInt32LE(base + 4);
      const b = readTagBuffer(type, n, base + 8);
      if (tag === 256) this.width = type === 3 ? b.readUInt16LE(0) : b.readUInt32LE(0);
      else if (tag === 257) this.height = type === 3 ? b.readUInt16LE(0) : b.readUInt32LE(0);
      else if (tag === 258) this.bits = b.readUInt16LE(0);
      else if (tag === 259) this.compression = b.readUInt16LE(0);
      else if (tag === 273) this.stripOffsets = Uint32Array.from({ length: n }, (_, k) => b.readUInt32LE(k * 4));
      else if (tag === 278) this.rowsPerStrip = type === 3 ? b.readUInt16LE(0) : b.readUInt32LE(0);
      else if (tag === 279) this.stripByteCounts = Uint32Array.from({ length: n }, (_, k) => b.readUInt32LE(k * 4));
      else if (tag === 322) this.tileWidth = type === 3 ? b.readUInt16LE(0) : b.readUInt32LE(0);
      else if (tag === 323) this.tileHeight = type === 3 ? b.readUInt16LE(0) : b.readUInt32LE(0);
      else if (tag === 324) this.tileOffsets = Uint32Array.from({ length: n }, (_, k) => b.readUInt32LE(k * 4));
      else if (tag === 325) this.tileByteCounts = Uint32Array.from({ length: n }, (_, k) => b.readUInt32LE(k * 4));
      else if (tag === 339) this.sampleFormat = b.readUInt16LE(0);
      else if (tag === 33550) {
        this.scaleX = b.readDoubleLE(0);
        this.scaleY = b.readDoubleLE(8);
      } else if (tag === 33922) {
        this.originX = b.readDoubleLE(24);
        this.originY = b.readDoubleLE(32);
      } else if (tag === 42113) {
        const parsed = Number(b.toString("utf8").replace(/\0/g, "").trim());
        if (Number.isFinite(parsed)) this.nodata = parsed;
      }
    }

    this.isTiled = Boolean(this.tileOffsets);
    this.tilesAcross = this.isTiled ? Math.ceil(this.width / this.tileWidth) : 1;
    this.bytesPerSample = this.bits / 8;
    this.cache = new Map();
    this.maxCache = this.isTiled ? 96 : 16;
  }

  readChunk(index, expectedBytes) {
    const cached = this.cache.get(index);
    if (cached) return cached;

    const offsets = this.isTiled ? this.tileOffsets : this.stripOffsets;
    const counts = this.isTiled ? this.tileByteCounts : this.stripByteCounts;
    const byteCount = counts[index];
    const raw = Buffer.alloc(byteCount);
    fs.readSync(this.fd, raw, 0, byteCount, offsets[index]);

    const decoded = this.compression === 5 ? decodeLzw(raw, expectedBytes) : raw;
    if (this.cache.size >= this.maxCache) {
      const oldest = this.cache.keys().next().value;
      this.cache.delete(oldest);
    }
    this.cache.set(index, decoded);
    return decoded;
  }

  sample(col, row) {
    if (col < 0 || row < 0 || col >= this.width || row >= this.height) return null;
    let buf;
    let pixelOffset;
    if (this.isTiled) {
      const tx = Math.floor(col / this.tileWidth);
      const ty = Math.floor(row / this.tileHeight);
      const lx = col - tx * this.tileWidth;
      const ly = row - ty * this.tileHeight;
      const idx = ty * this.tilesAcross + tx;
      buf = this.readChunk(idx, this.tileWidth * this.tileHeight * this.bytesPerSample);
      pixelOffset = (ly * this.tileWidth + lx) * this.bytesPerSample;
    } else {
      const stripIdx = Math.floor(row / this.rowsPerStrip);
      const localRow = row - stripIdx * this.rowsPerStrip;
      const stripRows = Math.min(this.rowsPerStrip, this.height - stripIdx * this.rowsPerStrip);
      buf = this.readChunk(stripIdx, this.width * stripRows * this.bytesPerSample);
      pixelOffset = (localRow * this.width + col) * this.bytesPerSample;
    }

    if (pixelOffset + this.bytesPerSample > buf.length) return null;
    const val = this.bits === 32 ? buf.readFloatLE(pixelOffset) : buf[pixelOffset];
    if (!Number.isFinite(val)) return null;
    if (Math.abs(val - this.nodata) < 1e-3) return null;
    return val;
  }

  close() {
    fs.closeSync(this.fd);
    this.cache.clear();
  }
}

/** Pure Node.js CRC32 + lossless RGBA PNG encoder. */
const crcTable = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = (c & 1) ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c >>> 0;
  }
  return table;
})();

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function pngChunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, "ascii");
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([len, typeBuf, data, crcBuf]);
}

function encodeRgbaPng(width, height, rgba) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // RGBA
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  const stride = width * 4;
  const raw = Buffer.alloc((stride + 1) * height);
  // Use PNG Sub filter (type 1) to compress terrain plateaus and NoData runs efficiently.
  for (let y = 0; y < height; y++) {
    const rowOut = y * (stride + 1);
    const rowIn = y * stride;
    raw[rowOut] = 1;
    for (let x = 0; x < stride; x++) {
      const left = x >= 4 ? rgba[rowIn + x - 4] : 0;
      raw[rowOut + 1 + x] = (rgba[rowIn + x] - left) & 0xff;
    }
  }

  const compressed = zlib.deflateSync(raw, { level: 9 });
  return Buffer.concat([
    sig,
    pngChunk("IHDR", ihdr),
    pngChunk("IDAT", compressed),
    pngChunk("IEND", Buffer.alloc(0)),
  ]);
}

function encodeDemMeters(demM) {
  const u16 = clamp(Math.round((demM + 20) * 10), 1, 65535);
  return [u16 >> 8, u16 & 0xff];
}

function encodeHandMeters(handM) {
  const clamped = Math.max(0, handM);
  if (clamped <= 15) return clamp(Math.round(clamped * 10), 0, 150);
  if (clamped <= 67) return clamp(150 + Math.round((clamped - 15) * 2), 150, 254);
  return 255;
}

function main() {
  for (const [key, filePath] of Object.entries(SOURCE_FILES)) {
    if (!fs.existsSync(filePath)) {
      throw new Error(`Missing source GeoTIFF (${key}): ${filePath}`);
    }
  }

  const samplers = {
    dem: new GeoTiffSampler(SOURCE_FILES.dem),
    hand: new GeoTiffSampler(SOURCE_FILES.hand),
    slope: new GeoTiffSampler(SOURCE_FILES.slope),
    rain: new GeoTiffSampler(SOURCE_FILES.rain),
    landcover: new GeoTiffSampler(SOURCE_FILES.landcover),
  };

  const demHandRgba = new Uint8Array(TARGET_WIDTH * TARGET_HEIGHT * 4);
  const hazardRgba = new Uint8Array(TARGET_WIDTH * TARGET_HEIGHT * 4);

  const mNorth = mercY(BOUNDS.north);
  const mSouth = mercY(BOUNDS.south);
  const lngSpan = BOUNDS.east - BOUNDS.west;
  const mercSpan = mNorth - mSouth;

  let validPixels = 0;
  let minDemM = Infinity;
  let maxDemM = -Infinity;
  let maxSlopeDeg = 0;

  try {
    for (let gy = 0; gy < TARGET_HEIGHT; gy++) {
      const lat = unmercY(mNorth - ((gy + 0.5) / TARGET_HEIGHT) * mercSpan);
      for (let gx = 0; gx < TARGET_WIDTH; gx++) {
        const lng = BOUNDS.west + ((gx + 0.5) / TARGET_WIDTH) * lngSpan;
        const { easting, northing } = latLngToUtm48S(lat, lng);
        const col = Math.floor((easting - samplers.dem.originX) / samplers.dem.scaleX);
        const row = Math.floor((samplers.dem.originY - northing) / samplers.dem.scaleY);

        const dem = samplers.dem.sample(col, row);
        if (dem === null) continue;

        const handRaw = samplers.hand.sample(col, row);
        const slopeRaw = samplers.slope.sample(col, row);
        const rainRaw = samplers.rain.sample(col, row);
        const lcRaw = samplers.landcover.sample(col, row);

        const hand = handRaw ?? 67;
        const slope = slopeRaw ?? 0;
        const rain = rainRaw ?? 2500;
        const lcScore = clamp(Math.round(lcRaw ?? 3), 1, 5);

        // Compute downslope direction on 180m baseline (6 * 30m) to avoid 30m micro-noise.
        const dEast = samplers.dem.sample(col + 3, row) ?? dem;
        const dWest = samplers.dem.sample(col - 3, row) ?? dem;
        const dSouth = samplers.dem.sample(col, row + 3) ?? dem;
        const dNorth = samplers.dem.sample(col, row - 3) ?? dem;
        const downDx = dWest - dEast;
        const downDy = dNorth - dSouth;
        const angle = Math.atan2(downDy, downDx);
        const dir32 = Math.floor(((angle + Math.PI) / (2 * Math.PI)) * 32) & 31;

        const idx = (gy * TARGET_WIDTH + gx) * 4;
        const [demHi, demLo] = encodeDemMeters(dem);

        // Alpha is strictly 255 on valid land pixels so browser getImageData never corrupts RGB.
        demHandRgba[idx] = demHi;
        demHandRgba[idx + 1] = demLo;
        demHandRgba[idx + 2] = encodeHandMeters(hand);
        demHandRgba[idx + 3] = 255;

        hazardRgba[idx] = clamp(Math.round(slope * 4), 0, 255);
        hazardRgba[idx + 1] = clamp(Math.round((rain - 1000) / 20), 0, 255);
        hazardRgba[idx + 2] = (dir32 << 3) | lcScore;
        hazardRgba[idx + 3] = 255;

        validPixels++;
        if (dem < minDemM) minDemM = dem;
        if (dem > maxDemM) maxDemM = dem;
        if (slope > maxSlopeDeg) maxSlopeDeg = slope;
      }
    }
  } finally {
    for (const sampler of Object.values(samplers)) sampler.close();
  }

  fs.mkdirSync(outputDir, { recursive: true });
  const demPng = encodeRgbaPng(TARGET_WIDTH, TARGET_HEIGHT, demHandRgba);
  const hazardPng = encodeRgbaPng(TARGET_WIDTH, TARGET_HEIGHT, hazardRgba);

  const demOut = path.join(outputDir, "terrain-dem-hand.png");
  const hazardOut = path.join(outputDir, "terrain-hazard-params.png");
  const metaOut = path.join(outputDir, "terrain-meta.json");

  fs.writeFileSync(demOut, demPng);
  fs.writeFileSync(hazardOut, hazardPng);

  // Average cell area in km2 around West Java mean latitude (-6.865 deg).
  const midLatRad = (((BOUNDS.north + BOUNDS.south) / 2) * Math.PI) / 180;
  const widthKm = lngSpan * 111.32 * Math.cos(midLatRad);
  const heightKm = (BOUNDS.north - BOUNDS.south) * 110.574;
  const cellAreaKm2 = Number(((widthKm * heightKm) / (TARGET_WIDTH * TARGET_HEIGHT)).toFixed(5));

  const meta = {
    version: 1,
    projection: "EPSG:3857-grid",
    width: TARGET_WIDTH,
    height: TARGET_HEIGHT,
    bounds: BOUNDS,
    mercNorth: Number(mNorth.toFixed(8)),
    mercSouth: Number(mSouth.toFixed(8)),
    cellAreaKm2,
    stats: {
      validPixels,
      minDemM: Number(minDemM.toFixed(1)),
      maxDemM: Number(maxDemM.toFixed(1)),
      maxSlopeDeg: Number(maxSlopeDeg.toFixed(1)),
    },
    files: {
      demHand: "/simulation/terrain-dem-hand.png",
      hazardParams: "/simulation/terrain-hazard-params.png",
    },
  };

  fs.writeFileSync(metaOut, JSON.stringify(meta, null, 2) + "\n", "utf8");

  const totalKb = ((demPng.length + hazardPng.length) / 1024).toFixed(1);
  console.log(
    `Built terrain pack: ${validPixels} valid pixels, DEM ${meta.stats.minDemM}..${meta.stats.maxDemM}m, max slope ${meta.stats.maxSlopeDeg} deg`,
  );
  console.log(
    `Sizes: terrain-dem-hand.png ${(demPng.length / 1024).toFixed(1)} KB, terrain-hazard-params.png ${(hazardPng.length / 1024).toFixed(1)} KB (total ${totalKb} KB)`,
  );
}

main();
