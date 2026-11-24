import type { RainfallRequest } from "./types";

export function rainfallQuery(request: RainfallRequest) {
  const query = new URLSearchParams({ summaryYear: String(request.summaryYear), tableYear: String(request.tableYear) });
  for (const id of request.summaryRegionIds) query.append("summaryRegion", id);
  for (const id of request.filters.regionIds) query.append("region", id);
  query.set("month", request.filters.month);
  query.set("q", request.filters.query);
  for (const value of request.filters.classifications) query.append("classification", value);
  return query.toString();
}

export function parseRainfallQuery(query: URLSearchParams): RainfallRequest | null {
  const summaryYear = query.get("summaryYear") ?? "";
  const tableYear = query.get("tableYear") ?? "";
  const month = query.get("month") ?? "";
  const text = query.get("q") ?? "";
  const summaryRegionIds = query.getAll("summaryRegion"), regionIds = query.getAll("region"), classifications = query.getAll("classification");
  if (![summaryYear, tableYear].every((year) => /^(0|[1-9]\d{0,3})$/.test(year) && Number(year) <= 9998) ||
      (month !== "" && !/^(0[1-9]|1[0-2])$/.test(month)) || text.length > 300 ||
      summaryRegionIds.length > 1000 || regionIds.length > 1000 || classifications.length > 10 ||
      [...summaryRegionIds, ...regionIds, ...classifications].some((value) => !value || value.length > 512)) return null;
  return { summaryYear: Number(summaryYear), tableYear: Number(tableYear), summaryRegionIds, filters: { query: text, regionIds, month, classifications } };
}
