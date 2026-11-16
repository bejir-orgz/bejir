import "../../lib/api/test-setup.mjs";
import assert from "node:assert/strict";
import test from "node:test";
const { assistantSources } = await import("./api.ts");

test("no active map layers means no AI retrieval sources", () => {
  assert.deepEqual(assistantSources([]), []);
  assert.deepEqual(assistantSources(["rainfall"]), ["flood_susceptibility"]);
  assert.deepEqual(assistantSources([]), []);
});

test("active layers map to supported datasets without duplicate retrieval sources", () => {
  assert.deepEqual(assistantSources(["rainfall", "dem", "land-cover", "susceptibility", "evacuation", "flood-area"]), ["flood_susceptibility", "population_exposure", "evacuation_sites", "flood_history"]);
  assert.deepEqual(assistantSources(["rivers"]), ["rivers"]);
  assert.deepEqual(assistantSources(["rivers", "rivers", "susceptibility", "evacuation", "flood-area"]), ["rivers", "flood_susceptibility", "population_exposure", "evacuation_sites", "flood_history"]);
});
