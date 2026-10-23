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
    <ul className="gis-region-tree p-0 m-0 list-none">
      {nodes.map((node) => {
        const branch = Boolean(node.children?.length);
        const expanded = searching || expandedIds.includes(node.id);
        return (
          <li key={node.id}>
            <div className="gis-region-row flex items-center gap-2 min-h-6 mb-2 whitespace-nowrap" style={{ paddingLeft: depth === 0 ? 0 : depth === 1 ? 48 : 64 }}>
              {branch && depth === 0 ? <Button variant="ghost" type="button" className="gis-tree-toggle w-6 h-6 flex shrink-0 items-center justify-center p-0 cursor-pointer text-[#111]" aria-label={`${expanded ? "Tutup" : "Buka"} ${node.name}`} aria-expanded={expanded} onClick={() => onExpand(node.id)}>{expanded ? <IconChevronDown className="size-6" aria-hidden="true" /> : <IconChevronRight className="size-6" aria-hidden="true" />}</Button> : null}
              <RegionCheckbox label={`Pilih ${node.name}`} checked={selectedIds.includes(node.id)} onChange={() => onSelect(node.id)} />
              {branch ? <Button variant="ghost" type="button" className="gis-folder-toggle w-6 h-6 flex shrink-0 items-center justify-center p-0 cursor-pointer text-[#737373]" aria-label={`${expanded ? "Tutup" : "Buka"} folder ${node.name}`} aria-expanded={expanded} onClick={() => onExpand(node.id)}>{expanded ? <IconFolderOpen className="size-6" aria-hidden="true" /> : <IconFolder className="size-6" aria-hidden="true" />}</Button> : null}
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
    <aside hidden={hidden} id="gis-regions-panel" className="gis-left absolute z-2 [inset:0_auto_0_0] w-66 min-h-26 p-[8px_16px] border-0 rounded-[0_16px_16px_0] bg-[white] overflow-y-auto [clip-path:inset(0_round_0_16px_16px_0)] [transform:translateX(0)] [transition:transform_var(--gis-slide-duration)_var(--gis-slide-easing),display_var(--gis-slide-duration)_allow-discrete] [&[hidden]]:hidden [&[hidden]]:[transform:translateX(-100%)] starting:[&:not([hidden])]:[transform:translateX(-100%)] [&_h1]:text-[24px] [&_h1]:leading-[32px] [&_h1]:font-medium [&_h2]:text-[24px] [&_h2]:leading-[32px] [&_h2]:font-medium max-[999.01px]:min-h-22 max-[999.01px]:bottom-6 [--sb-thumb-color:#8EC5FF] [--sb-size:4px] motion-reduce:[transition:none]" aria-label="Daerah">
      <h1>Daerah</h1>
      <label className="gis-search flex items-center gap-2 rounded-2xl border border-neutral-300 focus-within:border-blue-500 p-[8px_16px] mt-2 h-[38px] text-neutral-400 transition-colors [&_input]:min-w-0 [&_input]:w-full [&_input]:h-5 [&_input]:p-0 [&_input]:border-0 [&_input]:outline-none [&_input]:shadow-none [&_input]:bg-transparent [&_input]:text-[14px] [&_input]:leading-[20px] [&_input]:text-neutral-400 [&_input::placeholder]:text-neutral-400 [&_input::placeholder]:opacity-100 [&_input]:focus:outline-none [&_input]:focus-visible:ring-0 [&_input]:focus-visible:border-0"><IconSearch className="size-4 shrink-0 text-neutral-400" aria-hidden="true" /><Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Cari daerah" aria-label="Cari daerah" /></label>
      <div className="gis-region-scroll mt-2">
        <RegionTree nodes={regions} expandedIds={expandedIds} selectedIds={filters.regionIds} searching={Boolean(query.trim())} onExpand={(id) => setExpandedIds((current) => toggleSelection(current, id))} onSelect={(id) => onChange({ regionIds: toggleSelection(filters.regionIds, id) })} />
        {regions.length === 0 ? <p className="gis-empty p-[16px_0] text-[var(--gis-muted)] text-[12px]" role="status">Daerah tidak ditemukan.</p> : null}
      </div>
    </aside>
  );
}
