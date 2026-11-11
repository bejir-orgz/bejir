import assert from "node:assert/strict";
import test from "node:test";
import { createRegionFilterTree, matchesRegionFilter, westJavaFilterId } from "./region-tree.ts";

const regions = ["Kota Contoh A", "Kab. Contoh B"];
const districts = [
  { region: regions[0], district: "Utara" },
  { region: regions[0], district: "Utara" },
  { region: regions[0], district: "Selatan" },
  { region: regions[1], district: "Utara" },
];
const tree = createRegionFilterTree(regions, districts);
const city = tree[0].children.find((node) => node.name === regions[0]);
const regency = tree[0].children.find((node) => node.name === "Kabupaten Contoh B");

test("region tree uses only provided data and deduplicates districts without mutating input", () => {
  assert.equal(tree[0].id, westJavaFilterId);
  assert.equal(city.children.length, 2);
  assert.deepEqual(regions, ["Kota Contoh A", "Kab. Contoh B"]);
  assert.deepEqual(createRegionFilterTree([]), []);
  assert.deepEqual(createRegionFilterTree([regions[0]])[0].children[0].children, []);
});

test("empty and province selections include every supplied region", () => {
  for (const region of regions) {
    assert.equal(matchesRegionFilter([], region), true);
    assert.equal(matchesRegionFilter([westJavaFilterId], region), true);
  }
});

test("multiple regency/city selections form a union and exclude unselected regions", () => {
  assert.equal(matchesRegionFilter([city.id], regions[1]), false);
  assert.equal(matchesRegionFilter([city.id, regency.id], regions[0]), true);
  assert.equal(matchesRegionFilter([city.id, regency.id], regions[1]), true);
  assert.equal(matchesRegionFilter([city.id, regency.id], "Kota Lain"), false);
});

test("district selections are scoped to their parent even when district names repeat", () => {
  const north = city.children.find((node) => node.name === "Kecamatan Utara");
  assert.equal(matchesRegionFilter([north.id], regions[0], "Utara"), true);
  assert.equal(matchesRegionFilter([north.id], regions[1], "Utara"), false);
  assert.equal(matchesRegionFilter([north.id], regions[0], "Selatan"), false);
  assert.equal(matchesRegionFilter([north.id], regions[0]), false);
  assert.equal(matchesRegionFilter([north.id, regency.id], regions[1]), true);
});
