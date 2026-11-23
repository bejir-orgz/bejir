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


test("flood impact colors distinguish worsening, improving, unchanged and missing data", async () => {
  const { percentageChangeColor } = await import("./year-over-year.ts");
  assert.equal(percentageChangeColor("+12,5% dari tahun sebelumnya"), "text-[#ff0000]");
  assert.equal(percentageChangeColor("-61% dari tahun sebelumnya"), "text-[#2bb600]");
  for (const value of ["0% dari tahun sebelumnya", "-0% dari tahun sebelumnya", "—"]) {
    assert.equal(percentageChangeColor(value), "text-neutral-500");
  }
});


test("rainfall increases are green and decreases red, with neutral zero and missing data", async () => {
  const { percentageChangeColor } = await import("./year-over-year.ts");
  assert.equal(percentageChangeColor("+31,4% dari tahun sebelumnya", true), "text-[#2bb600]");
  assert.equal(percentageChangeColor("-12,5% dari tahun sebelumnya", true), "text-[#ff0000]");
  for (const value of ["0% dari tahun sebelumnya", "-0% dari tahun sebelumnya", "—"]) {
    assert.equal(percentageChangeColor(value, true), "text-neutral-500");
  }
});
