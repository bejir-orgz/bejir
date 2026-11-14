export type WorkspaceView = "map" | "history" | "rainfall" | "analysis";
export type PeriodPreset = "today" | "week" | "custom";

export interface WorkspaceFilters {
  view: WorkspaceView;
  period: PeriodPreset;
  date: string;
  /** Optional inclusive end date; `date` remains the start or a single selected day. */
  dateTo?: string;
  /** Administrative ID paths, with ! marking an explicit deselection. */
  regionIds: string[];
  layerIds: string[];
  legendIds: string[];
}

export interface RegionNode {
  id: string;
  name: string;
  children?: RegionNode[];
}

export interface LayerOption {
  id: string;
  label: string;
  /** Number of mock sublayers represented by this group. */
  count: number;
}

export interface OverviewMetric {
  id: string;
  label: string;
  value: string;
  change: string;
  trend: "increase" | "decrease";
}

export interface FacilityMetric {
  id: "health" | "education" | "worship";
  label: string;
  count: number | null;
}

/** Frontend presentation model; not an assumed backend API contract. */
export interface WorkspaceData {
  source: "dummy" | "backend";
  year: number;
  layers: LayerOption[];
  legends: { id: string; label: string }[];
  initialFilters: WorkspaceFilters;
  overview: {
    errors?: string[];
    metrics: OverviewMetric[];
    summary: string;
    susceptibility: { label: string; colors: string[]; notes: string[] };
    facilities: FacilityMetric[];
    landCover: string[];
    elevation: string;
    rivers: string;
  };
}

export interface WorkspaceProps {
  data: WorkspaceData;
  /** A future container can react to changes and supply updated data props. */
  onFiltersChange?: (filters: WorkspaceFilters) => void;
}
