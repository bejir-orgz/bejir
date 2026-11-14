import test from "node:test";
import assert from "node:assert/strict";
import { panelReducer } from "./panel-state.ts";

test("search opens overview and closes the left panel without toggling it off", () => {
  assert.deepEqual(panelReducer({ left: "regions", overview: false }, { type: "show-overview" }), { left: null, overview: true });
  assert.deepEqual(panelReducer({ left: null, overview: true }, { type: "show-overview" }), { left: null, overview: true });
});
