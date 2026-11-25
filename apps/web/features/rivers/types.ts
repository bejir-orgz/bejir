export interface RiverProperties {
  id: number;
  name: string | null;
  river_type: string | null;
  district_paths: string[];
}

export interface RiverSummary {
  total: number | null;
  by_regency: Record<string, number>;
}
