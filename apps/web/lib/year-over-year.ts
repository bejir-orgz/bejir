export function yearOverYear(current: number | null | undefined, previous: number | null | undefined) {
  const percent = current != null && previous != null && Number.isFinite(current) && Number.isFinite(previous) && current >= 0 && previous > 0
    ? (current - previous) / previous * 100 : null;
  return {
    change: percent === null ? "—" : `${percent > 0 ? "+" : ""}${percent.toLocaleString("id-ID", { maximumFractionDigits: 1 })}% dari tahun sebelumnya`,
    trend: percent !== null && percent < 0 ? "decrease" as const : "increase" as const,
  };
}
