import { hasDistrictSelection, hasVillageSelection, matchesRegionFilter } from "./region-tree";
import { classLabels, dominantClass, nullableSum, weightedMean } from "../geography/aggregation";
import type { AnalysisFilters, AnalysisRow } from "./analysis-types";

export const emptyAnalysisFilters: AnalysisFilters = { query: "", regionIds: [], susceptibility: [] };

export function filterAnalysisRows(rows: readonly AnalysisRow[], year: number, filters: AnalysisFilters) {
  const query = filters.query.trim().toLocaleLowerCase("id-ID");
  if (hasVillageSelection(filters.regionIds)) return [];
  const scoped = hasDistrictSelection(filters.regionIds) ? rows.flatMap((row) => {
    const districts = row.districts?.filter((district) => matchesRegionFilter(filters.regionIds, row.region, district.district_name ?? ""));
    if (!districts?.length) return [];
    const classification = dominantClass(districts);
    return [{ ...row, districts, susceptibility: classification === null ? null : classLabels[classification - 1], population: nullableSum(districts.map((district) => district.population)), areaKm2: nullableSum(districts.map((district) => district.luas_km2)), elevationM: weightedMean(districts, "mean_elevasi_m") }];
  }) : rows.filter((row) => matchesRegionFilter(filters.regionIds, row.region));
  return scoped.filter((row) => (row.year === null || row.year === year) &&
    (!query || row.region.toLocaleLowerCase("id-ID").includes(query)) &&
    (!filters.susceptibility.length || (row.susceptibility !== null && filters.susceptibility.includes(row.susceptibility))));
}
