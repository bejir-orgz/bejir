import "../../lib/api/test-setup.mjs";
import assert from "node:assert/strict";
import test from "node:test";
const {
  ALL_EVACUATION_CATEGORIES,
  filterEvacuationSitesByCategories,
  formatStraightDistance,
  normalizeEvacuationCategory,
} = await import("./nearby-fallback.ts");

test("evacuation categories normalize and filter sites accurately", () => {
  assert.equal(normalizeEvacuationCategory("Fasilitas Kesehatan"), "kesehatan");
  assert.equal(normalizeEvacuationCategory("Sekolah Dasar"), "pendidikan");
  assert.equal(normalizeEvacuationCategory("Masjid Agung"), "ibadah");
  assert.equal(normalizeEvacuationCategory("Lapangan Desa"), "umum");
  assert.equal(normalizeEvacuationCategory(null), "umum");

  const sites = [
    { id: 1, district_id: 1, name: "RSUD", category: "kesehatan", latitude: -6.9, longitude: 107.6 },
    { id: 2, district_id: 1, name: "SDN 1", category: "pendidikan", latitude: -6.9, longitude: 107.61 },
    { id: 3, district_id: 1, name: "Masjid", category: "ibadah", latitude: -6.9, longitude: 107.62 },
  ];
  assert.equal(filterEvacuationSitesByCategories(sites, ALL_EVACUATION_CATEGORIES).length, 3);
  assert.deepEqual(
    filterEvacuationSitesByCategories(sites, ["kesehatan", "ibadah"]).map((s) => s.id),
    [1, 3],
  );
  assert.equal(filterEvacuationSitesByCategories(sites, []).length, 0);
});

test("straight-line distances format metres under 1 km and kilometres above", () => {
  assert.equal(formatStraightDistance(420), "420 m");
  assert.equal(formatStraightDistance(1540), "1,5 km");
});
