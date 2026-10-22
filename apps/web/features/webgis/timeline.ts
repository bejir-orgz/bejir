/** A day index, rather than a weekday calendar, matching the Figma timeline sidebar. */
export function getTimelineMonths(year: number, lastMonth: number, count = lastMonth + 1) {
  return Array.from({ length: count }, (_, offset) => {
    const monthDate = new Date(year, lastMonth - offset, 1);
    const monthYear = monthDate.getFullYear();
    const month = monthDate.getMonth();
    const days = new Date(monthYear, month + 1, 0).getDate();
    return {
      id: `${monthYear}-${String(month + 1).padStart(2, "0")}`,
      label: new Intl.DateTimeFormat("id-ID", { month: "long" }).format(monthDate),
      dates: Array.from({ length: days }, (_, day) => `${monthYear}-${String(month + 1).padStart(2, "0")}-${String(day + 1).padStart(2, "0")}`),
    };
  });
}

/** West Java's current month, independent of the browser/server's configured timezone. */
export function getCurrentTimelinePeriod(now = new Date()) {
  const parts = new Intl.DateTimeFormat("en", { timeZone: "Asia/Jakarta", year: "numeric", month: "2-digit" }).formatToParts(now);
  return `${parts.find((part) => part.type === "year")!.value}-${parts.find((part) => part.type === "month")!.value}`;
}
