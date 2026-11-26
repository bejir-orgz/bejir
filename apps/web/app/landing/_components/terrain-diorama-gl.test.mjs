import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import "../../../lib/api/test-setup.mjs";

const glMod = await import("./terrain-diorama-gl.ts");

test("landing diorama grid asset decodes cleanly and stays under 25 KB", () => {
  const gridPath = path.resolve(import.meta.dirname, "../../../public/simulation/landing-diorama-grid.json");
  const raw = fs.readFileSync(gridPath, "utf8");
  assert.ok(Buffer.byteLength(raw) < 25 * 1024, `expected grid asset < 25 KB, got ${Buffer.byteLength(raw)} bytes`);

  const json = JSON.parse(raw);
  const decoded = glMod.decodeDioramaGrid(json);
  const expectedLen = json.width * json.height;
  assert.equal(decoded.dem.length, expectedLen);
  assert.equal(decoded.hand.length, expectedLen);
  assert.equal(decoded.rain.length, expectedLen);
  assert.equal(decoded.risk.length, expectedLen);
  assert.ok(json.buildings.length >= 100, "expected real urban building clusters in diorama");
  assert.ok(json.anchors.evacSafe[2] > json.anchors.basin[2], "safe evacuation anchor must be higher than flood basin");
});

test("3D camera projection maps diorama anchors inside viewport and rejects behind-camera points", () => {
  const pose = { yawDeg: -22, pitchDeg: 46, distance: 3.1, panX: 0, panZ: 0 };
  const mvp = glMod.buildCameraMvp(pose, 16 / 9);
  const centerPt = glMod.projectDioramaAnchor(mvp, [0, 0.14, 0], 640, 360);
  assert.equal(centerPt.visible, true);
  assert.ok(Math.abs(centerPt.x - 320) < 12, `expected center x near 320, got ${centerPt.x}`);
  assert.ok(Math.abs(centerPt.y - 180) < 12, `expected center y near 180, got ${centerPt.y}`);

  const behind = glMod.projectDioramaAnchor(mvp, [0, 12, 12], 640, 360);
  assert.equal(behind.visible, false);

  const midPose = glMod.lerpCameraPose(pose, { yawDeg: 18, pitchDeg: 54, distance: 2.7, panX: 0.2, panZ: -0.1 }, 0.5);
  assert.equal(midPose.yawDeg, -2);
  assert.equal(midPose.pitchDeg, 50);
});
