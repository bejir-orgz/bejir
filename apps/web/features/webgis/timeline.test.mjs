import assert from "node:assert/strict";
import test from "node:test";
import { getCurrentTimelinePeriod, getTimelineMonths } from "./timeline.ts";

test("timeline shows the current month descending through January only", () => {
  const months = getTimelineMonths(2026, 9);
  assert.equal(months.length, 10);
  assert.equal(months[0].id, "2026-10");
  assert.equal(months.at(-1).id, "2026-01");
  assert.deepEqual(getTimelineMonths(2027, 0).map((month) => month.id), ["2027-01"]);
});
test("timeline dates preserve leap years and optional explicit rollover", () => {
  assert.equal(getTimelineMonths(2024, 1)[0].dates.at(-1), "2024-02-29");
  assert.equal(getTimelineMonths(2026, 1)[0].dates.length, 28);
  assert.deepEqual(getTimelineMonths(2026, 0, 2).map((month) => month.id), ["2026-01", "2025-12"]);
});
test("current period follows West Java time at month and year boundaries", () => {
  assert.equal(getCurrentTimelinePeriod(new Date("2026-10-31T16:59:59Z")), "2026-10");
  assert.equal(getCurrentTimelinePeriod(new Date("2026-10-31T17:00:00Z")), "2026-11");
  assert.equal(getCurrentTimelinePeriod(new Date("2026-12-31T17:00:00Z")), "2027-01");
});
