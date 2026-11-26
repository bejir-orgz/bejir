/**
 * Zero-dependency WebGL 3D cutaway terrain & extruded buildings engine for the SIBAJAWA landing page.
 * Renders a sunlit architectural GIS maquette from real West Java DEM/HAND/building data (<25 KB).
 */

export type DioramaLayerMode =
  | "susceptibility"
  | "flood-sim"
  | "rivers"
  | "rainfall"
  | "dem"
  | "evacuation";

export interface DioramaCameraPose {
  yawDeg: number;
  pitchDeg: number;
  distance: number;
  panX: number;
  panZ: number;
}

export interface LandingDioramaGridJson {
  version: number;
  regionLabel: string;
  width: number;
  height: number;
  minDemM: number;
  maxDemM: number;
  basinFloorNorm: number;
  anchors: {
    upstream: [number, number, number];
    basin: [number, number, number];
    evacSafe: [number, number, number];
  };
  demB64: string;
  handB64: string;
  rainB64: string;
  riskB64: string;
  buildings: [number, number, number][];
}

export interface DecodedDioramaGrid {
  meta: LandingDioramaGridJson;
  dem: Uint8Array;
  hand: Uint8Array;
  rain: Uint8Array;
  risk: Uint8Array;
}

export interface ProjectedScreenPoint {
  x: number;
  y: number;
  visible: boolean;
}

export interface DioramaRenderState {
  mode: DioramaLayerMode;
  pose: DioramaCameraPose;
  waterRiseM: number;
  timeSec: number;
}

export const SLAB_HALF_X = 1.24;
export const SLAB_HALF_Z = 0.96;
export const TERRAIN_HEIGHT_SCALE = 0.56;
export const SLAB_BASE_Y = -0.17;

export const MODE_INDEX: Record<DioramaLayerMode, number> = {
  susceptibility: 0,
  "flood-sim": 1,
  rivers: 2,
  rainfall: 3,
  dem: 4,
  evacuation: 5,
};

export function clampNumber(v: number, lo: number, hi: number): number {
  return v < lo ? lo : v > hi ? hi : v;
}

export function decodeBase64Bytes(b64: string): Uint8Array {
  if (typeof globalThis.atob === "function") {
    const bin = globalThis.atob(b64);
    const out = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
    return out;
  }
  const buf = Buffer.from(b64, "base64");
  return new Uint8Array(buf.buffer, buf.byteOffset, buf.byteLength);
}

export function decodeDioramaGrid(json: LandingDioramaGridJson): DecodedDioramaGrid {
  return {
    meta: json,
    dem: decodeBase64Bytes(json.demB64),
    hand: decodeBase64Bytes(json.handB64),
    rain: decodeBase64Bytes(json.rainB64),
    risk: decodeBase64Bytes(json.riskB64),
  };
}

export function gridToWorld(
  gx: number,
  gy: number,
  width: number,
  height: number,
  demNorm: number,
): [number, number, number] {
  const u = gx / Math.max(1, width - 1);
  const v = gy / Math.max(1, height - 1);
  const x = (u * 2 - 1) * SLAB_HALF_X;
  const z = (v * 2 - 1) * SLAB_HALF_Z;
  const y = demNorm * TERRAIN_HEIGHT_SCALE;
  return [x, y, z];
}

export function waterHeightFromMeters(basinFloorNorm: number, waterRiseM: number): number {
  if (waterRiseM <= 0.05) return -0.05;
  // Exaggerate vertical flood depth cleanly for educational 3D readability across the Cekungan Bandung valley.
  const normLevel = basinFloorNorm + clampNumber(waterRiseM, 0, 12) * 0.022;
  return normLevel * TERRAIN_HEIGHT_SCALE;
}

export function lerpCameraPose(a: DioramaCameraPose, b: DioramaCameraPose, t: number): DioramaCameraPose {
  const k = clampNumber(t, 0, 1);
  return {
    yawDeg: a.yawDeg + (b.yawDeg - a.yawDeg) * k,
    pitchDeg: a.pitchDeg + (b.pitchDeg - a.pitchDeg) * k,
    distance: a.distance + (b.distance - a.distance) * k,
    panX: a.panX + (b.panX - a.panX) * k,
    panZ: a.panZ + (b.panZ - a.panZ) * k,
  };
}

export function multiplyMat4(a: Float32Array, b: Float32Array): Float32Array {
  const out = new Float32Array(16);
  for (let col = 0; col < 4; col++) {
    const b0 = b[col * 4];
    const b1 = b[col * 4 + 1];
    const b2 = b[col * 4 + 2];
    const b3 = b[col * 4 + 3];
    out[col * 4] = a[0] * b0 + a[4] * b1 + a[8] * b2 + a[12] * b3;
    out[col * 4 + 1] = a[1] * b0 + a[5] * b1 + a[9] * b2 + a[13] * b3;
    out[col * 4 + 2] = a[2] * b0 + a[6] * b1 + a[10] * b2 + a[14] * b3;
    out[col * 4 + 3] = a[3] * b0 + a[7] * b1 + a[11] * b2 + a[15] * b3;
  }
  return out;
}

export function perspectiveMat4(fovRad: number, aspect: number, near: number, far: number): Float32Array {
  const f = 1 / Math.tan(fovRad / 2);
  const nf = 1 / (near - far);
  const out = new Float32Array(16);
  out[0] = f / Math.max(0.1, aspect);
  out[5] = f;
  out[10] = (far + near) * nf;
  out[11] = -1;
  out[14] = 2 * far * near * nf;
  return out;
}

export function lookAtMat4(eye: [number, number, number], target: [number, number, number]): Float32Array {
  let zx = eye[0] - target[0];
  let zy = eye[1] - target[1];
  let zz = eye[2] - target[2];
  const zLen = Math.hypot(zx, zy, zz) || 1;
  zx /= zLen;
  zy /= zLen;
  zz /= zLen;

  // Up vector = [0, 1, 0]
  let xx = zz;
  let xy = 0;
  let xz = -zx;
  const xLen = Math.hypot(xx, xy, xz) || 1;
  xx /= xLen;
  xy /= xLen;
  xz /= xLen;

  const yx = zy * xz - zz * xy;
  const yy = zz * xx - zx * xz;
  const yz = zx * xy - zy * xx;

  const out = new Float32Array(16);
  out[0] = xx;
  out[1] = yx;
  out[2] = zx;
  out[3] = 0;
  out[4] = xy;
  out[5] = yy;
  out[6] = zy;
  out[7] = 0;
  out[8] = xz;
  out[9] = yz;
  out[10] = zz;
  out[11] = 0;
  out[12] = -(xx * eye[0] + xy * eye[1] + xz * eye[2]);
  out[13] = -(yx * eye[0] + yy * eye[1] + yz * eye[2]);
  out[14] = -(zx * eye[0] + zy * eye[1] + zz * eye[2]);
  out[15] = 1;
  return out;
}

export function buildCameraMvp(pose: DioramaCameraPose, aspect: number): Float32Array {
  const yaw = (pose.yawDeg * Math.PI) / 180;
  const pitch = (clampNumber(pose.pitchDeg, 18, 72) * Math.PI) / 180;
  const target: [number, number, number] = [pose.panX, 0.14, pose.panZ];
  const horiz = pose.distance * Math.cos(pitch);
  const eye: [number, number, number] = [
    target[0] + horiz * Math.sin(yaw),
    target[1] + pose.distance * Math.sin(pitch),
    target[2] + horiz * Math.cos(yaw),
  ];
  const proj = perspectiveMat4((36 * Math.PI) / 180, aspect, 0.2, 24);
  const view = lookAtMat4(eye, target);
  return multiplyMat4(proj, view);
}

export function projectDioramaAnchor(
  mvp: Float32Array,
  world: [number, number, number],
  viewportW: number,
  viewportH: number,
): ProjectedScreenPoint {
  const [x, y, z] = world;
  const cx = mvp[0] * x + mvp[4] * y + mvp[8] * z + mvp[12];
  const cy = mvp[1] * x + mvp[5] * y + mvp[9] * z + mvp[13];
  const cz = mvp[2] * x + mvp[6] * y + mvp[10] * z + mvp[14];
  const cw = mvp[3] * x + mvp[7] * y + mvp[11] * z + mvp[15];

  if (!Number.isFinite(cw) || cw <= 0.001) {
    return { x: -9999, y: -9999, visible: false };
  }
  const ndcX = cx / cw;
  const ndcY = cy / cw;
  const ndcZ = cz / cw;
  const visible = ndcZ >= -1 && ndcZ <= 1 && Math.abs(ndcX) <= 1.4 && Math.abs(ndcY) <= 1.4;
  return {
    x: (ndcX * 0.5 + 0.5) * viewportW,
    y: (0.5 - ndcY * 0.5) * viewportH,
    visible,
  };
}

const TERRAIN_VS = `
attribute vec3 aPos;
attribute vec3 aNormal;
attribute vec4 aData; // x=demNorm, y=handNorm, z=rainNorm, w=riskNorm
uniform mat4 uMvp;
varying vec3 vNormal;
varying vec3 vWorldPos;
varying vec4 vData;

void main() {
  vNormal = aNormal;
  vWorldPos = aPos;
  vData = aData;
  gl_Position = uMvp * vec4(aPos, 1.0);
}
`;

const TERRAIN_FS = `
precision mediump float;
varying vec3 vNormal;
varying vec3 vWorldPos;
varying vec4 vData;
uniform float uMode;
uniform float uWaterY;
uniform float uTime;

vec3 ramp3(vec3 a, vec3 b, vec3 c, float t) {
  return t < 0.5 ? mix(a, b, t * 2.0) : mix(b, c, (t - 0.5) * 2.0);
}

void main() {
  float dem = vData.x;
  float hand = vData.y;
  float rain = vData.z;
  float risk = vData.w;

  vec3 n = normalize(vNormal);
  vec3 sunDir = normalize(vec3(0.55, 0.82, 0.42));
  float diff = clamp(dot(n, sunDir), 0.0, 1.0);
  float hemi = 0.5 + 0.5 * n.y;
  float light = 0.50 + diff * 0.44 + hemi * 0.14;

  // Base cartographic palette tailored to SIBAJAWA light studio daylight.
  vec3 color = vec3(0.86, 0.91, 0.87);

  if (uMode < 0.5) {
    // 0: Kerawanan Banjir (AHP classes)
    vec3 lowC = vec3(0.49, 0.84, 0.52);
    vec3 midC = vec3(0.98, 0.81, 0.25);
    vec3 highC = vec3(0.96, 0.44, 0.16);
    vec3 critC = vec3(0.88, 0.20, 0.22);
    if (risk < 0.35) color = mix(lowC, midC, risk / 0.35);
    else if (risk < 0.68) color = mix(midC, highC, (risk - 0.35) / 0.33);
    else color = mix(highC, critC, (risk - 0.68) / 0.32);
  } else if (uMode < 1.5) {
    // 1: Simulasi Banjir (DEM) - calm sunlit terrain so translucent 3D water stands out.
    color = ramp3(vec3(0.84, 0.90, 0.84), vec3(0.68, 0.82, 0.68), vec3(0.44, 0.62, 0.48), dem);
    if (vWorldPos.y < uWaterY + 0.012 && uWaterY > 0.0) {
      float wet = clamp((uWaterY + 0.012 - vWorldPos.y) / 0.025, 0.0, 1.0);
      color = mix(color, vec3(0.24, 0.46, 0.72), wet * 0.65);
    }
  } else if (uMode < 2.5) {
    // 2: Jaringan Sungai - muted relief with animated glowing cerulean river corridors.
    color = ramp3(vec3(0.89, 0.93, 0.96), vec3(0.79, 0.86, 0.90), vec3(0.65, 0.75, 0.80), dem);
    float riverMask = 1.0 - smoothstep(0.03, 0.15, hand);
    float pulse = 0.5 + 0.5 * sin(vWorldPos.x * 16.0 - vWorldPos.z * 14.0 - uTime * 3.2);
    vec3 riverCol = mix(vec3(0.01, 0.52, 0.78), vec3(0.26, 0.76, 0.98), pulse * 0.65);
    color = mix(color, riverCol, riverMask * 0.95);
  } else if (uMode < 3.5) {
    // 3: Curah Hujan - cobalt rainfall bands draped over mountain peaks.
    color = ramp3(vec3(0.87, 0.93, 0.99), vec3(0.36, 0.64, 0.97), vec3(0.11, 0.31, 0.84), rain);
    float rainShimmer = 0.5 + 0.5 * sin(vWorldPos.y * 28.0 + uTime * 2.4);
    color += vec3(0.04, 0.06, 0.10) * rain * rainShimmer;
  } else if (uMode < 4.5) {
    // 4: Elevasi & Kontur 3D (DEM hypsometric tint)
    vec3 c1 = vec3(0.75, 0.94, 0.78);
    vec3 c2 = vec3(0.38, 0.79, 0.52);
    vec3 c3 = vec3(0.16, 0.52, 0.34);
    vec3 c4 = vec3(0.88, 0.91, 0.94);
    if (dem < 0.35) color = mix(c1, c2, dem / 0.35);
    else if (dem < 0.78) color = mix(c2, c3, (dem - 0.35) / 0.43);
    else color = mix(c3, c4, (dem - 0.78) / 0.22);
  } else {
    // 5: Titik & Rute Evakuasi - neutral bright topo with subtle basin hazard tint.
    color = ramp3(vec3(0.88, 0.92, 0.90), vec3(0.78, 0.86, 0.81), vec3(0.60, 0.73, 0.66), dem);
    float hazardTint = smoothstep(0.55, 0.85, risk);
    color = mix(color, vec3(0.90, 0.94, 1.0), hazardTint * 0.55);
  }

  // Crisp topographic contour bands across the 3D slopes.
  float contourFreq = uMode > 3.5 && uMode < 4.5 ? 24.0 : 14.0;
  float contourVal = abs(fract(dem * contourFreq + 0.5) - 0.5);
  float contourStrength = uMode > 3.5 && uMode < 4.5 ? 0.32 : 0.13;
  float contourLine = 1.0 - smoothstep(0.0, 0.055, contourVal);
  color = mix(color, vec3(0.09, 0.16, 0.33), contourLine * contourStrength);

  gl_FragColor = vec4(color * light, 1.0);
}
`;

const SOLID_VS = `
attribute vec3 aPos;
attribute vec3 aNormal;
attribute vec3 aColor;
uniform mat4 uMvp;
varying vec3 vNormal;
varying vec3 vColor;
varying vec3 vWorldPos;

void main() {
  vNormal = aNormal;
  vColor = aColor;
  vWorldPos = aPos;
  gl_Position = uMvp * vec4(aPos, 1.0);
}
`;

const SOLID_FS = `
precision mediump float;
varying vec3 vNormal;
varying vec3 vColor;
varying vec3 vWorldPos;
uniform float uWaterY;
uniform float uIsBuildings;

void main() {
  vec3 n = normalize(vNormal);
  vec3 sunDir = normalize(vec3(0.55, 0.85, 0.42));
  float diff = clamp(dot(n, sunDir), 0.0, 1.0);
  float light = 0.56 + diff * 0.40 + (n.y > 0.7 ? 0.08 : 0.0);
  vec3 col = vColor;
  if (uIsBuildings > 0.5 && uWaterY > 0.0 && vWorldPos.y < uWaterY + 0.005) {
    col = mix(col, vec3(0.18, 0.42, 0.82), 0.48);
  }
  gl_FragColor = vec4(col * light, 1.0);
}
`;

const WATER_VS = `
attribute vec2 aXZ;
uniform mat4 uMvp;
uniform float uWaterY;
uniform float uTime;
varying vec2 vXZ;
varying float vWave;

void main() {
  vXZ = aXZ;
  float w = sin(aXZ.x * 11.0 + uTime * 2.1) * 0.0024 + cos(aXZ.y * 13.0 - uTime * 1.7) * 0.0022;
  vWave = w;
  gl_Position = uMvp * vec4(aXZ.x, uWaterY + w, aXZ.y, 1.0);
}
`;

const WATER_FS = `
precision mediump float;
varying vec2 vXZ;
varying float vWave;
uniform float uWaterAlpha;

void main() {
  vec3 deep = vec3(0.14, 0.42, 0.90);
  vec3 highlight = vec3(0.42, 0.74, 0.99);
  float shimmer = smoothstep(-0.003, 0.004, vWave);
  vec3 col = mix(deep, highlight, shimmer * 0.55);
  gl_FragColor = vec4(col, uWaterAlpha);
}
`;

function compileShader(gl: WebGLRenderingContext, type: number, source: string): WebGLShader | null {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

function linkProgram(gl: WebGLRenderingContext, vsSrc: string, fsSrc: string): WebGLProgram | null {
  const vs = compileShader(gl, gl.VERTEX_SHADER, vsSrc);
  const fs = compileShader(gl, gl.FRAGMENT_SHADER, fsSrc);
  if (!vs || !fs) return null;
  const program = gl.createProgram();
  if (!program) return null;
  gl.attachShader(program, vs);
  gl.attachShader(program, fs);
  gl.linkProgram(program);
  gl.deleteShader(vs);
  gl.deleteShader(fs);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    gl.deleteProgram(program);
    return null;
  }
  return program;
}

function buildTerrainMesh(grid: DecodedDioramaGrid): { vertices: Float32Array; indices: Uint16Array } {
  const { width, height } = grid.meta;
  const count = width * height;
  const positions = new Float32Array(count * 3);
  const normals = new Float32Array(count * 3);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x;
      const [wx, wy, wz] = gridToWorld(x, y, width, height, grid.dem[idx] / 255);
      positions[idx * 3] = wx;
      positions[idx * 3 + 1] = wy;
      positions[idx * 3 + 2] = wz;
    }
  }

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x;
      const xL = Math.max(0, x - 1);
      const xR = Math.min(width - 1, x + 1);
      const yU = Math.max(0, y - 1);
      const yD = Math.min(height - 1, y + 1);

      const pL = (y * width + xL) * 3;
      const pR = (y * width + xR) * 3;
      const pU = (yU * width + x) * 3;
      const pD = (yD * width + x) * 3;

      const dxX = positions[pR] - positions[pL];
      const dxY = positions[pR + 1] - positions[pL + 1];
      const dzY = positions[pD + 1] - positions[pU + 1];
      const dzZ = positions[pD + 2] - positions[pU + 2];

      // Cross(dZ, dX) points +Y upward.
      const nx = -dxY * dzZ;
      const ny = dxX * dzZ;
      const nz = -dzY * dxX;
      const len = Math.hypot(nx, ny, nz) || 1;
      normals[idx * 3] = nx / len;
      normals[idx * 3 + 1] = ny / len;
      normals[idx * 3 + 2] = nz / len;
    }
  }

  // Interleaved: pos(3) + normal(3) + data(4) = 10 floats per vertex.
  const vertices = new Float32Array(count * 10);
  for (let i = 0; i < count; i++) {
    const o = i * 10;
    vertices[o] = positions[i * 3];
    vertices[o + 1] = positions[i * 3 + 1];
    vertices[o + 2] = positions[i * 3 + 2];
    vertices[o + 3] = normals[i * 3];
    vertices[o + 4] = normals[i * 3 + 1];
    vertices[o + 5] = normals[i * 3 + 2];
    vertices[o + 6] = grid.dem[i] / 255;
    vertices[o + 7] = grid.hand[i] / 255;
    vertices[o + 8] = grid.rain[i] / 255;
    vertices[o + 9] = grid.risk[i] / 255;
  }

  const indices = new Uint16Array((width - 1) * (height - 1) * 6);
  let ptr = 0;
  for (let y = 0; y < height - 1; y++) {
    for (let x = 0; x < width - 1; x++) {
      const a = y * width + x;
      const b = a + 1;
      const c = a + width;
      const d = c + 1;
      indices[ptr++] = a;
      indices[ptr++] = c;
      indices[ptr++] = b;
      indices[ptr++] = b;
      indices[ptr++] = c;
      indices[ptr++] = d;
    }
  }

  return { vertices, indices };
}

function pushQuad(
  arr: number[],
  p0: [number, number, number],
  p1: [number, number, number],
  p2: [number, number, number],
  p3: [number, number, number],
  n: [number, number, number],
  cTop: [number, number, number],
  cBot: [number, number, number],
) {
  const pushV = (p: [number, number, number], c: [number, number, number]) => {
    arr.push(p[0], p[1], p[2], n[0], n[1], n[2], c[0], c[1], c[2]);
  };
  pushV(p0, cTop);
  pushV(p1, cTop);
  pushV(p2, cBot);
  pushV(p0, cTop);
  pushV(p2, cBot);
  pushV(p3, cBot);
}

/** Builds the 4 cutaway geological side-walls of the 3D terrain block. */
function buildSkirtMesh(grid: DecodedDioramaGrid): Float32Array {
  const { width, height } = grid.meta;
  const verts: number[] = [];
  const topCol: [number, number, number] = [0.80, 0.85, 0.91];
  const botCol: [number, number, number] = [0.58, 0.66, 0.77];

  const pt = (x: number, y: number): [number, number, number] =>
    gridToWorld(x, y, width, height, grid.dem[y * width + x] / 255);

  // South edge (y = height - 1, facing +Z)
  for (let x = 0; x < width - 1; x++) {
    const a = pt(x, height - 1);
    const b = pt(x + 1, height - 1);
    pushQuad(verts, a, b, [b[0], SLAB_BASE_Y, b[2]], [a[0], SLAB_BASE_Y, a[2]], [0, 0, 1], topCol, botCol);
  }
  // North edge (y = 0, facing -Z)
  for (let x = width - 1; x > 0; x--) {
    const a = pt(x, 0);
    const b = pt(x - 1, 0);
    pushQuad(verts, a, b, [b[0], SLAB_BASE_Y, b[2]], [a[0], SLAB_BASE_Y, a[2]], [0, 0, -1], topCol, botCol);
  }
  // East edge (x = width - 1, facing +X)
  for (let y = height - 1; y > 0; y--) {
    const a = pt(width - 1, y);
    const b = pt(width - 1, y - 1);
    pushQuad(verts, a, b, [b[0], SLAB_BASE_Y, b[2]], [a[0], SLAB_BASE_Y, a[2]], [1, 0, 0], topCol, botCol);
  }
  // West edge (x = 0, facing -X)
  for (let y = 0; y < height - 1; y++) {
    const a = pt(0, y);
    const b = pt(0, y + 1);
    pushQuad(verts, a, b, [b[0], SLAB_BASE_Y, b[2]], [a[0], SLAB_BASE_Y, a[2]], [-1, 0, 0], topCol, botCol);
  }

  return new Float32Array(verts);
}

/** Builds crisp low-poly 3D extruded buildings anchored at real urban cells in Cekungan Bandung. */
function buildBuildingsMesh(grid: DecodedDioramaGrid): Float32Array {
  const { width, height, buildings } = grid.meta;
  const verts: number[] = [];
  const roofCol: [number, number, number] = [0.99, 0.995, 1.0];
  const wallCol: [number, number, number] = [0.84, 0.89, 0.95];
  const wallBot: [number, number, number] = [0.74, 0.81, 0.90];

  for (let i = 0; i < buildings.length; i++) {
    const [gx, gy, density] = buildings[i];
    const demNorm = grid.dem[gy * width + gx] / 255;
    const [cx, baseY, cz] = gridToWorld(gx, gy, width, height, demNorm);
    const halfW = 0.015 + (density / 100) * 0.014;
    const halfD = 0.013 + ((i % 3) * 0.004);
    const h = 0.022 + (density / 100) * 0.056;
    const y0 = baseY - 0.008;
    const y1 = baseY + h;

    const x0 = cx - halfW;
    const x1 = cx + halfW;
    const z0 = cz - halfD;
    const z1 = cz + halfD;

    // Roof (+Y)
    pushQuad(verts, [x0, y1, z0], [x1, y1, z0], [x1, y1, z1], [x0, y1, z1], [0, 1, 0], roofCol, roofCol);
    // +Z wall
    pushQuad(verts, [x0, y1, z1], [x1, y1, z1], [x1, y0, z1], [x0, y0, z1], [0, 0, 1], wallCol, wallBot);
    // -Z wall
    pushQuad(verts, [x1, y1, z0], [x0, y1, z0], [x0, y0, z0], [x1, y0, z0], [0, 0, -1], wallCol, wallBot);
    // +X wall
    pushQuad(verts, [x1, y1, z1], [x1, y1, z0], [x1, y0, z0], [x1, y0, z1], [1, 0, 0], wallCol, wallBot);
    // -X wall
    pushQuad(verts, [x0, y1, z0], [x0, y1, z1], [x0, y0, z1], [x0, y0, z0], [-1, 0, 0], wallCol, wallBot);
  }

  return new Float32Array(verts);
}

/** Builds a subdivided water mesh so translucent waves ripple cleanly inside the valley basin. */
function buildWaterMesh(): { vertices: Float32Array; indices: Uint16Array } {
  const segX = 28;
  const segZ = 22;
  const vertices = new Float32Array((segX + 1) * (segZ + 1) * 2);
  let vp = 0;
  for (let z = 0; z <= segZ; z++) {
    const wz = ((z / segZ) * 2 - 1) * (SLAB_HALF_Z - 0.004);
    for (let x = 0; x <= segX; x++) {
      const wx = ((x / segX) * 2 - 1) * (SLAB_HALF_X - 0.004);
      vertices[vp++] = wx;
      vertices[vp++] = wz;
    }
  }
  const indices = new Uint16Array(segX * segZ * 6);
  let ip = 0;
  for (let z = 0; z < segZ; z++) {
    for (let x = 0; x < segX; x++) {
      const a = z * (segX + 1) + x;
      const b = a + 1;
      const c = a + segX + 1;
      const d = c + 1;
      indices[ip++] = a;
      indices[ip++] = c;
      indices[ip++] = b;
      indices[ip++] = b;
      indices[ip++] = c;
      indices[ip++] = d;
    }
  }
  return { vertices, indices };
}

export interface DioramaRenderer {
  render: (state: DioramaRenderState) => Float32Array;
  resize: (width: number, height: number, dpr: number) => void;
  dispose: () => void;
}

export function createDioramaRenderer(canvas: HTMLCanvasElement, grid: DecodedDioramaGrid): DioramaRenderer | null {
  const gl = canvas.getContext("webgl", {
    antialias: true,
    alpha: true,
    powerPreference: "high-performance",
  });
  if (!gl) return null;

  const terrainProg = linkProgram(gl, TERRAIN_VS, TERRAIN_FS);
  const solidProg = linkProgram(gl, SOLID_VS, SOLID_FS);
  const waterProg = linkProgram(gl, WATER_VS, WATER_FS);
  if (!terrainProg || !solidProg || !waterProg) return null;

  const terrainMesh = buildTerrainMesh(grid);
  const skirtVerts = buildSkirtMesh(grid);
  const buildingVerts = buildBuildingsMesh(grid);
  const waterMesh = buildWaterMesh();

  const createBuf = (target: number, data: AllowSharedBufferSource) => {
    const buf = gl.createBuffer();
    if (!buf) return null;
    gl.bindBuffer(target, buf);
    gl.bufferData(target, data, gl.STATIC_DRAW);
    return buf;
  };

  const terrainVbo = createBuf(gl.ARRAY_BUFFER, terrainMesh.vertices);
  const terrainIbo = createBuf(gl.ELEMENT_ARRAY_BUFFER, terrainMesh.indices);
  const skirtVbo = createBuf(gl.ARRAY_BUFFER, skirtVerts);
  const bldVbo = createBuf(gl.ARRAY_BUFFER, buildingVerts);
  const waterVbo = createBuf(gl.ARRAY_BUFFER, waterMesh.vertices);
  const waterIbo = createBuf(gl.ELEMENT_ARRAY_BUFFER, waterMesh.indices);
  if (!terrainVbo || !terrainIbo || !skirtVbo || !bldVbo || !waterVbo || !waterIbo) return null;

  const tLoc = {
    aPos: gl.getAttribLocation(terrainProg, "aPos"),
    aNormal: gl.getAttribLocation(terrainProg, "aNormal"),
    aData: gl.getAttribLocation(terrainProg, "aData"),
    uMvp: gl.getUniformLocation(terrainProg, "uMvp"),
    uMode: gl.getUniformLocation(terrainProg, "uMode"),
    uWaterY: gl.getUniformLocation(terrainProg, "uWaterY"),
    uTime: gl.getUniformLocation(terrainProg, "uTime"),
  };

  const sLoc = {
    aPos: gl.getAttribLocation(solidProg, "aPos"),
    aNormal: gl.getAttribLocation(solidProg, "aNormal"),
    aColor: gl.getAttribLocation(solidProg, "aColor"),
    uMvp: gl.getUniformLocation(solidProg, "uMvp"),
    uWaterY: gl.getUniformLocation(solidProg, "uWaterY"),
    uIsBuildings: gl.getUniformLocation(solidProg, "uIsBuildings"),
  };

  const wLoc = {
    aXZ: gl.getAttribLocation(waterProg, "aXZ"),
    uMvp: gl.getUniformLocation(waterProg, "uMvp"),
    uWaterY: gl.getUniformLocation(waterProg, "uWaterY"),
    uTime: gl.getUniformLocation(waterProg, "uTime"),
    uWaterAlpha: gl.getUniformLocation(waterProg, "uWaterAlpha"),
  };

  let viewW = Math.max(1, canvas.width);
  let viewH = Math.max(1, canvas.height);

  const resize = (width: number, height: number, dpr: number) => {
    const clampedDpr = clampNumber(dpr, 1, 2);
    const nextW = Math.max(1, Math.round(width * clampedDpr));
    const nextH = Math.max(1, Math.round(height * clampedDpr));
    if (canvas.width !== nextW || canvas.height !== nextH) {
      canvas.width = nextW;
      canvas.height = nextH;
    }
    viewW = nextW;
    viewH = nextH;
    gl.viewport(0, 0, viewW, viewH);
  };

  const render = (state: DioramaRenderState): Float32Array => {
    const aspect = viewW / Math.max(1, viewH);
    const mvp = buildCameraMvp(state.pose, aspect);
    const showWater = state.mode === "flood-sim" || state.mode === "evacuation";
    const waterY = showWater ? waterHeightFromMeters(grid.meta.basinFloorNorm, state.waterRiseM) : -0.1;

    gl.viewport(0, 0, viewW, viewH);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.enable(gl.DEPTH_TEST);
    gl.depthMask(true);
    gl.disable(gl.BLEND);

    // 1) Terrain top surface
    gl.useProgram(terrainProg);
    gl.uniformMatrix4fv(tLoc.uMvp, false, mvp);
    gl.uniform1f(tLoc.uMode, MODE_INDEX[state.mode]);
    gl.uniform1f(tLoc.uWaterY, waterY);
    gl.uniform1f(tLoc.uTime, state.timeSec);

    gl.bindBuffer(gl.ARRAY_BUFFER, terrainVbo);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, terrainIbo);
    const tStride = 10 * 4;
    gl.enableVertexAttribArray(tLoc.aPos);
    gl.vertexAttribPointer(tLoc.aPos, 3, gl.FLOAT, false, tStride, 0);
    gl.enableVertexAttribArray(tLoc.aNormal);
    gl.vertexAttribPointer(tLoc.aNormal, 3, gl.FLOAT, false, tStride, 12);
    gl.enableVertexAttribArray(tLoc.aData);
    gl.vertexAttribPointer(tLoc.aData, 4, gl.FLOAT, false, tStride, 24);
    gl.drawElements(gl.TRIANGLES, terrainMesh.indices.length, gl.UNSIGNED_SHORT, 0);

    // 2) Cutaway geological side skirts
    gl.useProgram(solidProg);
    gl.uniformMatrix4fv(sLoc.uMvp, false, mvp);
    gl.uniform1f(sLoc.uWaterY, waterY);
    gl.uniform1f(sLoc.uIsBuildings, 0);

    const sStride = 9 * 4;
    gl.bindBuffer(gl.ARRAY_BUFFER, skirtVbo);
    gl.enableVertexAttribArray(sLoc.aPos);
    gl.vertexAttribPointer(sLoc.aPos, 3, gl.FLOAT, false, sStride, 0);
    gl.enableVertexAttribArray(sLoc.aNormal);
    gl.vertexAttribPointer(sLoc.aNormal, 3, gl.FLOAT, false, sStride, 12);
    gl.enableVertexAttribArray(sLoc.aColor);
    gl.vertexAttribPointer(sLoc.aColor, 3, gl.FLOAT, false, sStride, 24);
    gl.drawArrays(gl.TRIANGLES, 0, skirtVerts.length / 9);

    // 3) Real 3D extruded valley buildings
    gl.uniform1f(sLoc.uIsBuildings, 1);
    gl.bindBuffer(gl.ARRAY_BUFFER, bldVbo);
    gl.vertexAttribPointer(sLoc.aPos, 3, gl.FLOAT, false, sStride, 0);
    gl.vertexAttribPointer(sLoc.aNormal, 3, gl.FLOAT, false, sStride, 12);
    gl.vertexAttribPointer(sLoc.aColor, 3, gl.FLOAT, false, sStride, 24);
    gl.drawArrays(gl.TRIANGLES, 0, buildingVerts.length / 9);

    // 4) Translucent animated 3D floodwater plane
    if (showWater && state.waterRiseM > 0.05) {
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
      gl.depthMask(false);
      gl.useProgram(waterProg);
      gl.uniformMatrix4fv(wLoc.uMvp, false, mvp);
      gl.uniform1f(wLoc.uWaterY, waterY);
      gl.uniform1f(wLoc.uTime, state.timeSec);
      gl.uniform1f(wLoc.uWaterAlpha, state.mode === "flood-sim" ? 0.62 : 0.44);

      gl.bindBuffer(gl.ARRAY_BUFFER, waterVbo);
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, waterIbo);
      gl.enableVertexAttribArray(wLoc.aXZ);
      gl.vertexAttribPointer(wLoc.aXZ, 2, gl.FLOAT, false, 8, 0);
      gl.drawElements(gl.TRIANGLES, waterMesh.indices.length, gl.UNSIGNED_SHORT, 0);
      gl.depthMask(true);
      gl.disable(gl.BLEND);
    }

    return mvp;
  };

  const dispose = () => {
    gl.deleteBuffer(terrainVbo);
    gl.deleteBuffer(terrainIbo);
    gl.deleteBuffer(skirtVbo);
    gl.deleteBuffer(bldVbo);
    gl.deleteBuffer(waterVbo);
    gl.deleteBuffer(waterIbo);
    gl.deleteProgram(terrainProg);
    gl.deleteProgram(solidProg);
    gl.deleteProgram(waterProg);
  };

  return { render, resize, dispose };
}
