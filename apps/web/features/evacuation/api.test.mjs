import assert from "node:assert/strict";
import test from "node:test";
import "../../lib/api/test-setup.mjs";
const { getEvacuationSites } = await import("./api.ts");

const site = (id) => ({
  id, district_id: 545, name: id === 1 ? "<img src=x>" : null,
  category: null, latitude: -6.6, longitude: 106.8,
});

test("all site pages are fetched in order, including the final partial page", async () => {
  const originalFetch = globalThis.fetch;
  const items = Array.from({ length: 735 }, (_, index) => site(index + 1));
  const offsets = [];
  globalThis.fetch = async (input) => {
    const offset = Number(new URL(input).searchParams.get("offset"));
    offsets.push(offset);
    return Response.json({ items: items.slice(offset, offset + 100), total: items.length });
  };
  try {
    assert.deepEqual(await getEvacuationSites(), items);
    assert.deepEqual(offsets, [0, 100, 200, 300, 400, 500, 600, 700]);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("invalid coordinates, duplicate IDs, incomplete pages and upstream errors fail explicitly", async () => {
  const originalFetch = globalThis.fetch;
  try {
    for (const body of [
      { items: [{ ...site(1), latitude: 100 }], total: 1 },
      { items: [site(1), site(1)], total: 2 },
      { items: [site(1)], total: 2 },
    ]) {
      globalThis.fetch = async () => Response.json(body);
      await assert.rejects(getEvacuationSites());
    }
    globalThis.fetch = async () => new Response(null, { status: 503 });
    await assert.rejects(getEvacuationSites(), /gagal dimuat/);
    globalThis.fetch = async () => Response.json({ items: [], total: 0 });
    assert.deepEqual(await getEvacuationSites(), []);
    globalThis.fetch = async () => Response.json({ items: [{ ...site(1), district_id: null }], total: 1 });
    assert.equal((await getEvacuationSites())[0].district_id, null);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
