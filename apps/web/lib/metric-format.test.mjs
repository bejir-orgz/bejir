import assert from "node:assert/strict";
import test from "node:test";
import { formatIndonesianNumber, parseIndonesianMetric } from "./metric-format.ts";

test("parseIndonesianMetric parses integers, thousands, decimals, units, and unavailable placeholders", () => {
  assert.deepEqual(parseIndonesianMetric("97.321 unit"), {
    prefix: "",
    numeric: 97321,
    decimals: 0,
    suffix: " unit",
  });
  assert.deepEqual(parseIndonesianMetric("262,2 mm"), {
    prefix: "",
    numeric: 262.2,
    decimals: 1,
    suffix: " mm",
  });
  assert.deepEqual(parseIndonesianMetric("1.212,7 mdpl"), {
    prefix: "",
    numeric: 1212.7,
    decimals: 1,
    suffix: " mdpl",
  });
  assert.equal(parseIndonesianMetric("—"), null);
  assert.equal(parseIndonesianMetric(""), null);
  assert.equal(formatIndonesianNumber(97321, 0), "97.321");
  assert.equal(formatIndonesianNumber(262.24, 1), "262,2");
});
