export function yearOverYear(current: number | null | undefined, previous: number | null | undefined) {
  const percent = current != null && previous != null && Number.isFinite(current) && Number.isFinite(previous) && current >= 0 && previous > 0
    ? (current - previous) / previous * 100 : null;
  return {
    change: percent === null ? "—" : `${percent > 0 ? "+" : ""}${percent.toLocaleString("id-ID", { maximumFractionDigits: 1 })}% dari tahun sebelumnya`,
    trend: percent !== null && percent < 0 ? "decrease" as const : "increase" as const,
  };
}

/** Zero and missing comparisons stay neutral; rainfall uses the opposite direction to flood impacts. */
export function percentageChangeColor(change: string, increaseIsGood = false) {
  const match = change.match(/^([+-]?\d+(?:,\d+)?)% /);
  const percent = match ? Number(match[1].replace(",", ".")) : 0;
  if (percent === 0) return "text-neutral-500";
  return (percent > 0) === increaseIsGood ? "text-[#2bb600]" : "text-[#ff0000]";
}
