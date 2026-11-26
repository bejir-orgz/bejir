import assert from "node:assert/strict";
import test from "node:test";
import { formatOverviewPeriodLabel, getCurrentTimelineDate, getCurrentTimelinePeriod, getOverviewDateRange, getTimelineMonths } from "./timeline.ts";

test("Overview defaults to the Jakarta current year and keeps explicit dates", () => {
  assert.deepEqual(getOverviewDateRange("", "", new Date("2026-12-31T16:59:59Z")), { from: "2026-01-01", to: "2026-12-31" });
  assert.deepEqual(getOverviewDateRange("", "", new Date("2026-12-31T17:00:00Z")), { from: "2027-01-01", to: "2027-12-31" });
  assert.deepEqual(getOverviewDateRange("2020-02-29", ""), { from: "2020-02-29", to: "2020-02-29" });
  assert.deepEqual(getOverviewDateRange("2020-01-01", "2020-03-31"), { from: "2020-01-01", to: "2020-03-31" });
});

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

test("calendar dates align with their Sunday-first weekday columns throughout the year", () => {
  for (const year of [2024, 2026, 2027]) {
    for (const month of getTimelineMonths(year, 11)) {
      const monthIndex = Number(month.id.slice(5)) - 1;
      assert.equal(month.firstWeekday, new Date(year, monthIndex, 1).getDay());
      month.dates.forEach((date, index) => {
        assert.equal((month.firstWeekday + index) % 7, new Date(`${date}T00:00:00`).getDay());
      });
    }
  }
  assert.equal(getTimelineMonths(2026, 9)[0].firstWeekday, 4); // October starts on Thursday.
  assert.equal(getTimelineMonths(2026, 1)[0].firstWeekday, 0); // February starts on Sunday.
});

test("today follows Jakarta midnight even when the UTC day differs", () => {
  assert.equal(getCurrentTimelineDate(new Date("2026-10-24T16:59:59Z")), "2026-10-24");
  assert.equal(getCurrentTimelineDate(new Date("2026-10-24T17:00:00Z")), "2026-10-25");
  assert.equal(getCurrentTimelineDate(new Date("2026-12-31T17:00:00Z")), "2027-01-01");
});

test("formatOverviewPeriodLabel formats Indonesian range labels", () => {
  assert.equal(formatOverviewPeriodLabel({ from: "2024-01-01", to: "2024-12-31" }), "1 Januari 2024 s.d. 31 Desember 2024");
  assert.equal(formatOverviewPeriodLabel({ from: "", to: "" }), "");
});
