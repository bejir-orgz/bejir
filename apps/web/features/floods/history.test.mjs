import assert from "node:assert/strict";
import { registerHooks } from "node:module";
import test from "node:test";

registerHooks({
  resolve(specifier, context, nextResolve) {
    try {
      return nextResolve(specifier, context);
    } catch (error) {
      if (error.code === "ERR_MODULE_NOT_FOUND" && specifier.startsWith(".") && !specifier.endsWith(".ts")) {
        return nextResolve(`${specifier}.ts`, context);
      }
      throw error;
    }
  },
});

const { getFloodHistory } = await import("./api.ts");
const { summarizeHistory } = await import("./history-summary.ts");
const { createRegionFilterTree } = await import("../webgis/region-tree.ts");

test("history loads all pages, sums impacts, preserves unknown values and scopes summary independently", async () => {
  const originalFetch = globalThis.fetch;
  const events = Array.from({ length: 101 }, (_, index) => ({
    id: index + 1, event_datetime: "2026-02-12T08:00:00", regency_id: index ? 14 : 4,
  }));
  const requests = [];
  globalThis.fetch = async (input) => {
    const url = new URL(input);
    requests.push(url);
    if (url.pathname.endsWith("/statistics")) {
      return Response.json({
        by_year: [{ year: 2026 }, { year: 2025 }],
        by_regency: [
          { regency_id: 4, regency_name: "Bogor", total_events: 2 },
          { regency_id: 14, regency_name: "Kota Bogor", total_events: 50 },
        ],
      });
    }
    if (url.pathname.endsWith("/events")) {
      const offset = Number(url.searchParams.get("offset"));
      return Response.json({ items: events.slice(offset, offset + 100), total: events.length });
    }
    const id = Number(url.pathname.split("/").at(-1));
    return Response.json({
      impacts: id === 1 ? [{ fatalities: 2, missing: 1 }, { fatalities: 1, missing: 0 }]
        : id === 2 ? [] : [{ fatalities: 0, missing: 0 }],
    });
  };
  try {
    const data = await getFloodHistory(2026);
    assert.equal(data.rows.length, 101);
    assert.equal(requests.filter((url) => url.pathname.endsWith("/events")).length, 2);
    assert.equal(data.rows[0].deaths, 3);
    assert.equal(data.rows[0].missing, 1);
    assert.equal(data.rows[0].severity, null);
    assert.equal(data.rows[0].areaKm2, null);
    assert.equal(data.rows[1].deaths, null);
    const selection = createRegionFilterTree(data.regions)[0].children.find((node) => node.name === "Kabupaten Bogor").id;
    const snapshot = summarizeHistory(data, [selection]);
    assert.equal(snapshot.events, "1");
    assert.equal(snapshot.deaths, 3);
    assert.equal(snapshot.timeline[1].events, 1);
    assert.match(snapshot.eventChange, /-50/);
    assert.equal(summarizeHistory(data, []).deaths, null);
    assert.equal(data.rows.length, 101);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("upstream failure rejects history instead of returning an empty success", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => new Response(null, { status: 503 });
  try {
    await assert.rejects(getFloodHistory(2026), /gagal dimuat/);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
