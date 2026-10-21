/** A day index, rather than a weekday calendar, matching the Figma timeline sidebar. */
export function getTimelineMonths(year: number, lastMonth = 9, count = 5) {
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
