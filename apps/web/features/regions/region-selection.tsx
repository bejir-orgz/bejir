"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode, type SetStateAction } from "react";
import type { AdministrativeCatalog } from "../../lib/api/schemas";
import { createRegionFilterTree } from "../webgis/region-tree";
import { compactMapScope, regionSelectionIndex, translateRegionSelection } from "./selection";

const RegionSelectionContext = createContext<{
  regionIds: string[]; setRegionIds: (ids: string[]) => void;
  mapRegionIds: string[]; dataRegionIds: string[]; setMapRegionIds: (ids: string[]) => void;
  toMapIds: (ids: readonly string[]) => string[];
  tree: ReturnType<typeof createRegionFilterTree>;
} | null>(null);

export function RegionSelectionProvider({ catalog, children }: { catalog: AdministrativeCatalog; children: ReactNode }) {
  const [regionIds, setRegionIds] = useState<string[]>([]);
  const pairs = useMemo(() => regionSelectionIndex(catalog), [catalog]);
  const tree = useMemo(() => createRegionFilterTree(catalog.regencies.map((row) => row.name), catalog.districts.flatMap((row) => {
    const parent = catalog.regencies.find((region) => region.id === row.regency_id);
    return parent ? [{ region: parent.name, district: row.name }] : [];
  })), [catalog]);
  const mapRegionIds = useMemo(() => translateRegionSelection(regionIds, pairs, true), [regionIds, pairs]);
  const dataRegionIds = useMemo(() => compactMapScope(mapRegionIds, pairs), [mapRegionIds, pairs]);
  const setMapRegionIds = useCallback((ids: string[]) => setRegionIds(translateRegionSelection(ids, pairs, false)), [pairs]);
  const toMapIds = useCallback((ids: readonly string[]) => translateRegionSelection(ids, pairs, true), [pairs]);
  const value = useMemo(() => ({ regionIds, setRegionIds, mapRegionIds, dataRegionIds, setMapRegionIds, toMapIds, tree }), [regionIds, mapRegionIds, dataRegionIds, setMapRegionIds, toMapIds, tree]);
  return <RegionSelectionContext.Provider value={value}>{children}</RegionSelectionContext.Provider>;
}

export function useRegionSelection() {
  const context = useContext(RegionSelectionContext);
  if (!context) throw new Error("Pilihan daerah harus berada dalam RegionSelectionProvider.");
  return context;
}

export function useRegionalFilters<T extends { regionIds: string[] }>(initial: T) {
  const { regionIds, setRegionIds } = useRegionSelection();
  const [local, setLocal] = useState(initial);
  const filters = { ...local, regionIds };
  function setFilters(action: SetStateAction<T>) {
    const next = typeof action === "function" ? action(filters) : action;
    setLocal(next);
    setRegionIds(next.regionIds);
  }
  return [filters, setFilters] as const;
}
