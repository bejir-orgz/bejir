import test from "node:test";
import assert from "node:assert/strict";
import { panelReducer } from "./panel-state.ts";

test("search opens overview and closes the left panel without toggling it off", () => {
  assert.deepEqual(panelReducer({ left: "regions", overview: false }, { type: "show-overview" }), { left: null, overview: true });
  assert.deepEqual(panelReducer({ left: null, overview: true }, { type: "show-overview" }), { left: null, overview: true });
});

test("legend sidebar shares left-panel toggling and narrow-screen exclusivity", () => {
  const open = panelReducer({ left: "regions", overview: true }, { type: "toggle-left", panel: "legends", narrow: false });
  assert.deepEqual(open, { left: "legends", overview: true });
  assert.deepEqual(panelReducer(open, { type: "toggle-left", panel: "legends", narrow: false }), { left: null, overview: true });
  assert.deepEqual(panelReducer(open, { type: "toggle-left", panel: "legends", narrow: true }), { left: null, overview: false });
  assert.deepEqual(panelReducer({ left: null, overview: true }, { type: "toggle-left", panel: "legends", narrow: true }), { left: "legends", overview: false });
  assert.deepEqual(panelReducer(open, { type: "close-all" }), { left: null, overview: false });
});
