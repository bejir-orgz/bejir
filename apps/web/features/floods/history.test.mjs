import assert from "node:assert/strict";
import "../../lib/api/test-setup.mjs";
import test from "node:test";

const { getFloodHistory } = await import("./api.ts");
const { listFloodEvents } = await import("./api.ts");
const { summarizeHistory } = await import("./history-summary.ts");
const { createRegionFilterTree } = await import("../webgis/region-tree.ts");
const { filterHistoryRows, emptyHistoryFilters } = await import("./history.ts");

test("history loads all pages, sums impacts, preserves unknown values and scopes summary independently", async () => {
  const originalFetch = globalThis.fetch;
  // Impacts and the event type now travel with the list; no per-event detail read exists.
  const impacts = (id) => id === 1 ? { houses_flooded: 12, fatalities: 3, missing: 1, event_type: { name: "Banjir Bandang" } }
    : id === 2 ? { houses_flooded: null, fatalities: null, missing: null, event_type: null }
      : { houses_flooded: 0, fatalities: 0, missing: 0, event_type: { name: "Banjir" } };
  const events = Array.from({ length: 101 }, (_, index) => ({
    id: index + 1, event_datetime: "2026-02-12T08:00:00", regency_id: index ? 14 : 4, ...impacts(index + 1),
  }));
  const requests = [];
  globalThis.fetch = async (input) => {
    const url = new URL(input);
    requests.push(url);
    if (url.pathname.endsWith("/impacts")) return Response.json({ overall: {}, by_regency: [{ regency_id: 4, houses_flooded: 24 }, { regency_id: 14, houses_flooded: 10 }] });
    if (url.pathname.endsWith("/statistics")) {
      return Response.json({
        summary: { total_events: 101 }, impacts: { affected_displaced: null },
        by_year: [{ year: 2026, total_events: 101 }, { year: 2025, total_events: 0 }],
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
    throw new Error(`unexpected per-event request: ${url.pathname}`);
  };
  try {
    const data = await getFloodHistory(2026);
    assert.equal(data.rows.length, 101);
    assert.equal(requests.filter((url) => url.pathname.endsWith("/events")).length, 2);
    // A year used to cost one request per event; the list must now carry them.
    assert.equal(requests.filter((url) => /\/events\/\d+$/.test(url.pathname)).length, 0);
    assert.equal(data.rows[0].deaths, 3);
    assert.equal(data.rows[0].missing, 1);
    assert.equal(data.rows[0].severity, null);
    assert.equal(data.rows[0].floodType, "Banjir Bandang");
    assert.equal(data.rows[1].floodType, null);
    assert.deepEqual(filterHistoryRows(data.rows, 2026, { ...emptyHistoryFilters, floodTypes: ["Banjir Bandang"] }).map((row) => row.id), ["1"]);
    assert.equal(filterHistoryRows(data.rows, 2026, emptyHistoryFilters).length, 101);
    assert.equal(data.rows[0].housesFlooded, 12);
    assert.equal(data.rows[1].housesFlooded, null);
    assert.equal(data.rows[2].housesFlooded, 0);
    assert.equal(data.rows[1].deaths, null);
    const selection = createRegionFilterTree(data.regions)[0].children.find((node) => node.name === "Kabupaten Bogor").id;
    const snapshot = summarizeHistory(data, [selection]);
    assert.equal(snapshot.events, "1");
    assert.equal(snapshot.housesFlooded, "12 unit");
    assert.equal(snapshot.housesFloodedNote, "-50% dari tahun sebelumnya");
    assert.equal(snapshot.deaths, 3);
    assert.equal(snapshot.timeline[1].events, 1);
    assert.match(snapshot.eventChange, /-50/);
    assert.equal(summarizeHistory(data, []).deaths, null);
    assert.equal(summarizeHistory(data, []).housesFlooded, "—");
    const city = createRegionFilterTree(data.regions)[0].children.find((node) => node.name === "Kota Bogor").id;
    assert.equal(summarizeHistory({ ...data, rows: data.rows.slice(2) }, [city]).housesFlooded, "0 unit");
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

test("overlapping pages are rejected before counting duplicate flood events", async () => {
  const original = globalThis.fetch;
  globalThis.fetch = async () => Response.json({ total: 101, items: Array.from({ length: 100 }, (_, index) => ({ id: index + 1 })) });
  try { await assert.rejects(listFloodEvents(""), /ID kejadian berulang/); }
  finally { globalThis.fetch = original; }
});


test("missing prior house impacts preserve history and do not fabricate a percentage", async () => {
  const original = globalThis.fetch;
  globalThis.fetch = async (input) => {
    const url = new URL(input);
    if (url.pathname.endsWith("/statistics")) return Response.json({ summary: { total_events: 1 }, impacts: { affected_displaced: 0 }, by_year: [{ year: 2026, total_events: 1 }], by_regency: [{ regency_id: 4, regency_name: "Bogor", total_events: 1 }] });
    if (url.pathname.endsWith("/impacts")) return new Response(null, { status: 503 });
    if (url.pathname.endsWith("/events")) return Response.json({ items: [{ id: 1, regency_id: 4, event_datetime: "2026-01-01T00:00:00", houses_flooded: 12, fatalities: 0, missing: 0 }], total: 1 });
    throw new Error(`unexpected per-event request: ${url.pathname}`);
  };
  try {
    const data = await getFloodHistory(2026);
    assert.equal(summarizeHistory(data, []).housesFlooded, "12 unit");
    assert.equal(summarizeHistory(data, []).housesFloodedNote, "—");
    assert.equal(summarizeHistory(data, []).eventChange, "0% dari tahun sebelumnya");
  } finally { globalThis.fetch = original; }
});
