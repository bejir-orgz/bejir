import "./api/test-setup.mjs";
import assert from "node:assert/strict";
import test from "node:test";
const { yearOverYear } = await import("./year-over-year.ts");

test("year comparisons preserve decreases, increases, zero and unavailable baselines", () => {
  assert.deepEqual(yearOverYear(39, 100), { change: "-61% dari tahun sebelumnya", trend: "decrease" });
  assert.equal(yearOverYear(150, 100).change, "+50% dari tahun sebelumnya");
  assert.equal(yearOverYear(0, 100).change, "-100% dari tahun sebelumnya");
  assert.equal(yearOverYear(100, 100).change, "0% dari tahun sebelumnya");
  for (const prior of [0, null, undefined, NaN, -1]) assert.equal(yearOverYear(100, prior).change, "—");
  assert.equal(yearOverYear(null, 100).change, "—");
});
