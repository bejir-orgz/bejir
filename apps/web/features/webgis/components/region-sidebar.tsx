"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { filterRegionTree, toggleSelection } from "../region-tree";
import type { RegionNode, WorkspaceData, WorkspaceFilters } from "../types";
import { IconChevronDown, IconChevronRight, IconFolderOpen, IconFolder, IconSearch } from "@tabler/icons-react";
import { RegionCheckbox } from "./region-checkbox";

function RegionTree({ nodes, depth = 0, expandedIds, selectedIds, searching, onExpand, onSelect }: {
  nodes: RegionNode[]; depth?: number; expandedIds: string[]; selectedIds: string[];
  searching: boolean; onExpand: (id: string) => void; onSelect: (id: string) => void;
}) {
  return (
    <ul className="gis-region-tree">
      {nodes.map((node) => {
        const branch = Boolean(node.children?.length);
        const expanded = searching || expandedIds.includes(node.id);
        return (
          <li key={node.id}>
            <div className="gis-region-row" style={{ paddingLeft: depth === 0 ? 0 : depth === 1 ? 48 : 64 }}>
              {branch && depth === 0 ? <Button variant="ghost" type="button" className="gis-tree-toggle" aria-label={`${expanded ? "Tutup" : "Buka"} ${node.name}`} aria-expanded={expanded} onClick={() => onExpand(node.id)}>{expanded ? <IconChevronDown className="size-6" aria-hidden="true" /> : <IconChevronRight className="size-6" aria-hidden="true" />}</Button> : null}
              <RegionCheckbox label={`Pilih ${node.name}`} checked={selectedIds.includes(node.id)} onChange={() => onSelect(node.id)} />
              {branch ? <Button variant="ghost" type="button" className="gis-folder-toggle" aria-label={`${expanded ? "Tutup" : "Buka"} folder ${node.name}`} aria-expanded={expanded} onClick={() => onExpand(node.id)}>{expanded ? <IconFolderOpen className="size-6" aria-hidden="true" /> : <IconFolder className="size-6" aria-hidden="true" />}</Button> : null}
              <span>{node.name}</span>
            </div>
            {branch && expanded ? <RegionTree nodes={node.children!} depth={depth + 1} expandedIds={expandedIds} selectedIds={selectedIds} searching={searching} onExpand={onExpand} onSelect={onSelect} /> : null}
          </li>
        );
      })}
    </ul>
  );
}

export function RegionSidebar({ data, filters, onChange, hidden }: {
  hidden?: boolean; data: WorkspaceData; filters: WorkspaceFilters; onChange: (patch: Partial<WorkspaceFilters>) => void;
}) {
  const [query, setQuery] = useState("");
  const [expandedIds, setExpandedIds] = useState(data.initiallyExpandedRegions);
  const regions = filterRegionTree(data.regions, query);

  return (
    <aside hidden={hidden} id="gis-regions-panel" className="gis-left" aria-label="Daerah">
      <h1>Daerah</h1>
      <label className="gis-search"><IconSearch className="size-4 shrink-0" aria-hidden="true" /><Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Cari daerah" aria-label="Cari daerah" /></label>
      <div className="gis-region-scroll">
        <RegionTree nodes={regions} expandedIds={expandedIds} selectedIds={filters.regionIds} searching={Boolean(query.trim())} onExpand={(id) => setExpandedIds((current) => toggleSelection(current, id))} onSelect={(id) => onChange({ regionIds: toggleSelection(filters.regionIds, id) })} />
        {regions.length === 0 ? <p className="gis-empty" role="status">Daerah tidak ditemukan.</p> : null}
      </div>
    </aside>
  );
}
