import assert from "node:assert/strict";
import test from "node:test";
import { getPageItems } from "./pagination.ts";

test("first page remains available after leaving the initial range", () => {
  assert.deepEqual(getPageItems(24, 6), [1, "ellipsis", 3, 4, 5, 6, 7, "ellipsis", 24]);
  assert.deepEqual(getPageItems(24, 23), [1, "ellipsis", 20, 21, 22, 23, 24]);
});

test("adjacent first pages do not introduce an unnecessary ellipsis", () => {
  assert.deepEqual(getPageItems(24, 5), [1, 2, 3, 4, 5, 6, "ellipsis", 24]);
});

test("initial and short page ranges remain unchanged", () => {
  assert.deepEqual(getPageItems(24, 0), [1, 2, 3, 4, 5, "ellipsis", 24]);
  assert.deepEqual(getPageItems(4, 2), [1, 2, 3, 4]);
  assert.deepEqual(getPageItems(0, 0), []);
});
