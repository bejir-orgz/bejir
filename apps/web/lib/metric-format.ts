export interface ParsedMetric {
  prefix: string;
  numeric: number;
  decimals: number;
  suffix: string;
}

export function parseIndonesianMetric(raw: string): ParsedMetric | null {
  const trimmed = raw.trim();
  if (!trimmed || trimmed === "—" || trimmed === "-") return null;
  const match = /^([^\d+-]*?)([+-]?\d[\d.,]*)(.*)$/.exec(trimmed);
  if (!match) return null;
  const [, prefix, numberToken, suffix] = match;
  // Indonesian locale uses '.' for thousands and ',' for decimals (e.g. "97.321 unit", "262,2 mm").
  const commaParts = numberToken.split(",");
  if (commaParts.length > 2) return null;
  const integerDigits = commaParts[0].replace(/\./g, "");
  const fractionDigits = commaParts[1] ?? "";
  const normalized = fractionDigits ? `${integerDigits}.${fractionDigits}` : integerDigits;
  const numeric = Number(normalized);
  if (!Number.isFinite(numeric)) return null;
  return {
    prefix,
    numeric,
    decimals: fractionDigits.length,
    suffix,
  };
}

export function formatIndonesianNumber(value: number, decimals: number): string {
  return new Intl.NumberFormat("id-ID", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(decimals > 0 ? Number(value.toFixed(decimals)) : Math.round(value));
}
