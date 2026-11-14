import "../../lib/api/test-setup.mjs";
import test from "node:test";
import assert from "node:assert/strict";
const { regionSelectionIndex, translateRegionSelection } = await import("./selection.ts");
const { isRegionSelected, toggleRegionSelection, matchesRegionFilter, districtFilterId, regionFilterId, westJavaFilterId } = await import("../webgis/region-tree.ts");
const catalog = { regencies: [{ id: 17, name: "Kota Depok" }, { id: 1, name: "Bandung" }], districts: [{ id: 7, name: "Utara", regency_id: 17 }, { id: 8, name: "Selatan", regency_id: 17 }] };
const index = regionSelectionIndex(catalog);

test("map choices round trip across levels, exclusions and normalized regency names", () => {
  const choices = ["17", "!17/7", "17/7/99", "1"];
  const selected = translateRegionSelection(choices, index, false);
  assert.deepEqual(translateRegionSelection(selected, index, true), choices);
  assert.ok(selected.includes(regionFilterId("Kabupaten Bandung")));
  assert.equal(matchesRegionFilter(selected, "Kota Depok", "Utara"), false);
  assert.equal(matchesRegionFilter(selected, "Kota Depok", "Selatan"), true);
});

test("province selection includes children and supports excluding and restoring a branch", () => {
  const depok = regionFilterId("Kota Depok");
  const district = districtFilterId("Kota Depok", "Utara");
  let ids = toggleRegionSelection([], westJavaFilterId);
  assert.equal(isRegionSelected(ids, district), true);
  ids = toggleRegionSelection(ids, depok);
  assert.equal(isRegionSelected(ids, district), false);
  assert.equal(matchesRegionFilter(ids, "Kabupaten Bandung"), true);
  const mapped = translateRegionSelection(ids, index, true);
  assert.equal(isRegionSelected(mapped, "17/7/99"), false);
  assert.equal(isRegionSelected(mapped, "1/999"), true);
  ids = toggleRegionSelection(ids, depok);
  assert.equal(isRegionSelected(ids, district), true);
  assert.deepEqual(toggleRegionSelection(ids, westJavaFilterId), []);
});

test("district choices scope rainfall and analysis parameters without borrowing the parent totals", async () => {
  const { filterRainfallRows, emptyRainfallFilters } = await import("../rainfall/filter.ts");
  const { filterAnalysisRows, emptyAnalysisFilters } = await import("../webgis/analysis-filter.ts");
  const choice = districtFilterId("Kota Depok", "Utara");
  const rainfall = [{ id: "17", region: "Kota Depok", period: null, classification: null, parameters: [
    { district_name: "Utara", n_piksel: 1, mean_hujan_mm: 100 },
    { district_name: "Selatan", n_piksel: 3, mean_hujan_mm: 500 },
  ] }];
  const scopedRain = filterRainfallRows(rainfall, 0, { ...emptyRainfallFilters, regionIds: [choice] });
  assert.equal(scopedRain[0].rainfallMm, 100);
  assert.equal(scopedRain[0].parameters.length, 1);
  const analysis = [{ id: "17", region: "Kota Depok", year: null, districts: [
    { district_name: "Utara", n_piksel: 1, kelas_dominan_v2: 1, population: 100, luas_km2: 2, mean_elevasi_m: 10 },
    { district_name: "Selatan", n_piksel: 3, kelas_dominan_v2: 5, population: 900, luas_km2: 8, mean_elevasi_m: 90 },
  ] }];
  const scoped = filterAnalysisRows(analysis, 2026, { ...emptyAnalysisFilters, regionIds: [choice] });
  assert.equal(scoped[0].population, 100);
  assert.equal(scoped[0].areaKm2, 2);
  assert.equal(scoped[0].elevationM, 10);
  assert.equal(scoped[0].susceptibility, "Sangat Rendah");
  const exceptNorth = filterAnalysisRows(analysis, 2026, { ...emptyAnalysisFilters, regionIds: [westJavaFilterId, `!${choice}`] });
  assert.equal(exceptNorth[0].population, 900);
  assert.equal(analysis[0].districts.length, 2);
  assert.deepEqual(filterAnalysisRows(analysis, 2026, { ...emptyAnalysisFilters, regionIds: [`${choice}/village:99`] }), []);
});

test("Flood history at an unsupported administrative level stays unavailable, never zero", async () => {
  const { summarizeHistory, unavailableSnapshot } = await import("../floods/history-summary.ts");
  const { filterHistoryRows, emptyHistoryFilters } = await import("../floods/history.ts");
  const regionIds = [districtFilterId("Kota Depok", "Utara")];
  const data = { rows: [{ id: "1", date: "2026-01-01", region: "Kota Depok", district: "", deaths: 0, missing: 0 }] };
  assert.deepEqual(summarizeHistory(data, regionIds), unavailableSnapshot);
  assert.deepEqual(filterHistoryRows(data.rows, 2026, { ...emptyHistoryFilters, regionIds }), []);
});

test("province overview uses one unfiltered aggregate and empty explicit selections never become all regions", async () => {
  const { compactMapScope } = await import("./selection.ts");
  assert.deepEqual(compactMapScope(["17", "1"], index), []);
  assert.deepEqual(compactMapScope(["1", "!17"], index), ["1"]);
  assert.deepEqual(compactMapScope(["!1", "!17"], index), ["!1", "!17"]);
  assert.deepEqual(compactMapScope(["17", "!17/7"], index), ["17", "!17/7"]);
});
