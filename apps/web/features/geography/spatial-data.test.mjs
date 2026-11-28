import "../../lib/api/test-setup.mjs";
import assert from "node:assert/strict";
import test from "node:test";
const { classLabels, dominantClass, nullableSum, susceptibilityDistribution, weightedMean } = await import("./spatial-data.ts");

const rows = [
  { district_id: 1, n_piksel: 100, mean_elevasi_m: 10, mean_hujan_mm: 2000, kelas_dominan_v2: 2 },
  { district_id: 2, n_piksel: 300, mean_elevasi_m: 30, mean_hujan_mm: 4000, kelas_dominan_v2: 4 },
];

test("approved pixel weighting produces regional means and dominant class with explicit ties", () => {
  assert.equal(weightedMean(rows, "mean_elevasi_m"), 25);
  assert.equal(weightedMean(rows, "mean_hujan_mm"), 3500);
  assert.equal(dominantClass(rows), 4);
  assert.equal(classLabels[dominantClass(rows) - 1], "Tinggi");
  assert.equal(dominantClass([rows[0], { ...rows[1], n_piksel: 100 }]), null);
  assert.equal(weightedMean([rows[0], { ...rows[1], mean_elevasi_m: null }], "mean_elevasi_m"), null);
  assert.equal(weightedMean([{ ...rows[0], n_piksel: 0 }], "mean_elevasi_m"), null);
  assert.equal(nullableSum([0, 0]), 0);
  assert.equal(nullableSum([1, null]), null);
  assert.throws(() => nullableSum([-1]));
  assert.deepEqual(
    susceptibilityDistribution(rows).map((row) => row.value),
    [0, 1, 0, 1, 0],
  );
});
