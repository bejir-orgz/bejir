import "../../lib/api/test-setup.mjs";
import test from "node:test";
import assert from "node:assert/strict";
const { prepareRiver, createDistrictIndex } = await import("./preparation.ts");
const { summarizeRivers, parseRiverBounds, parseRiverRegions } = await import("./data.ts");
const polygon = (west, east) => ({ type: "Polygon", coordinates: [[[west,0],[east,0],[east,1],[west,1],[west,0]]] });
const index = createDistrictIndex([{ id: 1, regency_id: 17, geom: polygon(0,1) }, { id: 2, regency_id: 17, geom: polygon(1,2) }, { id: 3, regency_id: 18, geom: polygon(2,3) }]);
const feature = (id, line) => prepareRiver({ id, name: " ", river_type: "Sungai Satu Garis", geom: { type: "MultiLineString", coordinates: [line] } }, index);
const features = [feature(1, [[0.5,0.5,3],[1.5,0.5,4]]), feature(2, [[2.5,0.2],[2.5,0.8]])];
const data = { total: 2, prepared_at: "2026-11-15T00:00:00Z", features };

test("raw line intersection assigns both districts; display strips Z and keeps count distinct", () => {
  assert.deepEqual(features[0].properties.district_paths, ["17/1", "17/2"]);
  assert.equal(features[0].geometry.coordinates[0][0].length, 2);
  assert.equal(features[0].properties.name, null);
  assert.equal(summarizeRivers(data, ["17/1", "17/2"]).total, 1);
  assert.deepEqual(summarizeRivers(data, ["17"]).by_regency, {17: 1});
  assert.equal(summarizeRivers(data, ["17", "!17/1"]).total, 1);
  assert.equal(summarizeRivers(data, ["17/1/99"]).total, null);
  assert.equal(summarizeRivers(data, []).total, 2);
});

test("map filter inputs are validated before they reach the viewport API", () => {
  assert.throws(() => parseRiverBounds("1,2,0,3"));
  assert.throws(() => parseRiverBounds("0,0,NaN,3"));
  assert.throws(() => parseRiverRegions(new URLSearchParams("region=17;DROP")));
  assert.deepEqual(parseRiverRegions(new URLSearchParams("region=17&region=17")), ["17"]);
  assert.throws(() => feature(3, [[190,0],[191,1]]));
});

test("intersection respects holes and boundary touches, and tiny segments survive display rounding", () => {
  const holes = createDistrictIndex([{ id: 9, regency_id: 17, geom: { type: "Polygon", coordinates: [
    [[0,0],[3,0],[3,3],[0,3],[0,0]], [[1,1],[1,2],[2,2],[2,1],[1,1]],
  ] } }]);
  const prepare = (line) => prepareRiver({ id: 9, name: null, river_type: null, geom: { type: "MultiLineString", coordinates: [line] } }, holes);
  assert.deepEqual(prepare([[1.2,1.2],[1.8,1.8]]).properties.district_paths, []);
  assert.deepEqual(prepare([[0.5,1.5],[2.5,1.5]]).properties.district_paths, ["17/9"]);
  assert.deepEqual(prepare([[-1,0],[0,0]]).properties.district_paths, ["17/9"]);
  const tiny = prepare([[0.25,0.25],[0.25000001,0.25]]).geometry.coordinates[0];
  assert.notDeepEqual(tiny[0], tiny[1]);
});
