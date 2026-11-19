"use client";

import { useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { fetchRegionChildren, searchRegions } from "@/features/regions/api";
import { filterRegionTree, isRegionSelected, toggleRegionSelection, toggleSelection } from "../region-tree";
import type { RegionNode, WorkspaceFilters } from "../types";
import { IconChevronDown, IconChevronRight, IconFolderOpen, IconFolder, IconSearch } from "@tabler/icons-react";
import { RegionCheckbox } from "./region-checkbox";

type Branches = Record<string, RegionNode[] | "loading" | "error">;

function attachChildren(nodes: RegionNode[], branches: Branches): RegionNode[] {
  return nodes.map((node) => {
    const children = branches[node.id];
    return Array.isArray(children) ? { ...node, children: attachChildren(children, branches) } : node;
  });
}

function RegionTree({ nodes, depth = 0, expandedIds, selectedIds, branches, searching, onExpand, onSelect }: {
  nodes: RegionNode[]; depth?: number; expandedIds: string[]; selectedIds: string[];
  branches: Branches;
  searching: boolean; onExpand: (id: string) => void; onSelect: (id: string) => void;
}) {
  return (
    <ul className="gis-region-tree p-0 m-0 list-none">
      {nodes.map((node) => {
        const children = branches[node.id];
        const branch = depth < 2 && !(Array.isArray(children) && children.length === 0);
        const expanded = expandedIds.includes(node.id) || (searching && Boolean(node.children?.length));
        return (
          <li key={node.id}>
            <div className="gis-region-row flex items-center gap-2 min-h-6 mb-2 whitespace-nowrap" style={{ paddingLeft: depth === 0 ? 0 : depth === 1 ? 48 : 64 }}>
              {branch && depth === 0 ? <Button variant="ghost" type="button" className="gis-tree-toggle w-6 h-6 flex shrink-0 items-center justify-center p-0 cursor-pointer text-[#111]" aria-label={`${expanded ? "Tutup" : "Buka"} ${node.name}`} aria-expanded={expanded} onClick={() => onExpand(node.id)}>{expanded ? <IconChevronDown className="size-6" aria-hidden="true" /> : <IconChevronRight className="size-6" aria-hidden="true" />}</Button> : null}
              <RegionCheckbox label={`Pilih ${node.name}`} checked={isRegionSelected(selectedIds, node.id)} onChange={() => onSelect(node.id)} />
              {branch ? <Button variant="ghost" type="button" className="gis-folder-toggle w-6 h-6 flex shrink-0 items-center justify-center p-0 cursor-pointer text-[#737373]" aria-label={`${expanded ? "Tutup" : "Buka"} folder ${node.name}`} aria-expanded={expanded} onClick={() => onExpand(node.id)}>{expanded ? <IconFolderOpen className="size-6" aria-hidden="true" /> : <IconFolder className="size-6" aria-hidden="true" />}</Button> : null}
              <span className="min-w-0 whitespace-normal break-words">{node.name}</span>
            </div>
            {branch && expanded && node.children ? <RegionTree nodes={node.children} depth={depth + 1} expandedIds={expandedIds} selectedIds={selectedIds} branches={branches} searching={searching} onExpand={onExpand} onSelect={onSelect} /> : null}
            {expanded && branches[node.id] === "error" ? <p role="status">Daerah gagal dimuat.</p> : null}
            {expanded && branches[node.id] === "loading" ? <p role="status">Memuat daerah…</p> : null}
          </li>
        );
      })}
    </ul>
  );
}

export function RegionSidebar({ filters, onChange, hidden, onWidthChange }: {
  hidden?: boolean; filters: WorkspaceFilters; onChange: (patch: Partial<WorkspaceFilters>) => void;
  onWidthChange: (width: number) => void;
}) {
  const panel = useRef<HTMLElement>(null);
  const [query, setQuery] = useState("");
  const [expandedIds, setExpandedIds] = useState<string[]>([]);
  const [roots, setRoots] = useState<RegionNode[] | null>();
  const [branches, setBranches] = useState<Branches>({});
  const [search, setSearch] = useState<{ term: string; nodes?: RegionNode[]; error?: boolean }>();
  const term = query.trim();
  const hasRoots = Array.isArray(roots);
  const result = search?.term === term ? search : undefined;
  const regions = result?.nodes ?? filterRegionTree(attachChildren(roots ?? [], branches), query);

  useEffect(() => {
    const element = panel.current;
    if (!element) return;
    // Measure offscreen too so the other panels match before Daerah is opened.
    const observer = new ResizeObserver(() => {
      const width = Math.ceil(element.getBoundingClientRect().width);
      if (width > 0) onWidthChange(width);
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, [onWidthChange]);

  useEffect(() => {
    if (hidden || !term) return;
    const controller = new AbortController();
    const timer = setTimeout(() => {
      searchRegions(term, controller.signal).then(
        (nodes) => { if (!controller.signal.aborted) setSearch({ term, nodes }); },
        () => { if (!controller.signal.aborted) setSearch({ term, error: true }); },
      );
    }, 250);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [hidden, term]);

  useEffect(() => {
    if (hasRoots) return;
    const controller = new AbortController();
    fetchRegionChildren(undefined, controller.signal).then(
      (nodes) => setRoots(nodes),
      () => { if (!controller.signal.aborted) setRoots(null); },
    );
    return () => controller.abort();
  }, [hasRoots]);

  async function expandRegion(id: string) {
    const isOpen = expandedIds.includes(id);
    setExpandedIds((current) => toggleSelection(current, id));
    if (isOpen || branches[id] === "loading" || Array.isArray(branches[id])) return;
    setBranches((current) => ({ ...current, [id]: "loading" }));
    try {
      const children = await fetchRegionChildren(id);
      setBranches((current) => ({ ...current, [id]: children }));
    } catch {
      setBranches((current) => ({ ...current, [id]: "error" }));
    }
  }

  return (
    <aside ref={panel} data-hidden={!!hidden} aria-hidden={hidden} inert={hidden} id="gis-regions-panel" className="gis-left absolute z-2 [inset:0_auto_0_0] w-max min-w-[min(264px,calc(100vw_-_48px))] max-w-[min(480px,calc(100vw_-_48px))] min-h-26 py-4 pr-4 border-0 rounded-[0_16px_16px_0] bg-[white] overflow-hidden flex flex-col [clip-path:inset(0_round_0_16px_16px_0)] [transform:translateX(0)] [transition:transform_var(--gis-slide-duration)_var(--gis-slide-easing),visibility_var(--gis-slide-duration)] [&[data-hidden=true]]:invisible [&[data-hidden=true]]:[transform:translateX(-100%)] starting:[&[data-hidden=false]]:[transform:translateX(-100%)] [&_h1]:text-[24px] [&_h1]:leading-[32px] [&_h1]:font-medium [&_h2]:text-[24px] [&_h2]:leading-[32px] [&_h2]:font-medium max-[999.01px]:min-h-22 max-[999.01px]:bottom-6 [--sb-thumb-color:#8EC5FF] [--sb-size:5px] motion-reduce:[transition:none]" aria-label="Daerah">
      <div className="gis-sidebar-scroll min-h-0 overflow-y-auto pl-[calc(16px_-_var(--sb-size))] [scrollbar-gutter:stable] [direction:rtl]">
      <div dir="ltr">
      <div className="flex items-center justify-between gap-4">
        <h1>Daerah</h1>
        {!!(filters.regionIds.length || query.trim()) && <Button type="button" variant="link" size="sm" className="text-red-500 no-underline hover:text-red-600 hover:no-underline" aria-label="Reset pilihan daerah" onClick={() => { setQuery(""); setExpandedIds([]); onChange({ regionIds: [] }); }}>Reset</Button>}
      </div>
      <label className="gis-search flex items-center gap-2 rounded-2xl border border-neutral-300 focus-within:border-blue-500 p-[8px_16px] mt-2 h-[38px] text-neutral-400 transition-colors [&_input]:min-w-0 [&_input]:w-full [&_input]:h-5 [&_input]:p-0 [&_input]:border-0 [&_input]:outline-none [&_input]:shadow-none [&_input]:bg-transparent [&_input]:text-[14px] [&_input]:leading-[20px] [&_input]:text-neutral-400 [&_input::placeholder]:text-neutral-400 [&_input::placeholder]:opacity-100 [&_input]:focus:outline-none [&_input]:focus-visible:ring-0 [&_input]:focus-visible:border-0"><IconSearch className="size-4 shrink-0 text-neutral-400" aria-hidden="true" /><Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Cari daerah" aria-label="Cari daerah" /></label>
      <div className="gis-region-scroll mt-4">
        <RegionTree nodes={regions} expandedIds={expandedIds} selectedIds={filters.regionIds} branches={branches} searching={Boolean(query.trim())} onExpand={expandRegion} onSelect={(id) => onChange({ regionIds: toggleRegionSelection(filters.regionIds, id) })} />
        {term && !result?.nodes ? <p className="gis-empty p-[16px_0] text-[var(--gis-muted)] text-[12px]" role="status">{result?.error ? "Pencarian daerah gagal dimuat. Ubah pencarian untuk mencoba lagi." : "Mencari daerah…"}</p> : regions.length === 0 ? <p className="gis-empty p-[16px_0] text-[var(--gis-muted)] text-[12px]" role="status">{roots === null ? "Daerah gagal dimuat." : roots ? "Daerah tidak ditemukan." : "Memuat daerah…"}</p> : null}
      </div>
      </div>
      </div>
    </aside>
  );
}
