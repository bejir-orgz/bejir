import type { RegionNode } from "./types";

/** Retain parent context when a descendant matches a region search. */
export function filterRegionTree(nodes: RegionNode[], query: string): RegionNode[] {
  const term = query.trim().toLocaleLowerCase("id-ID");
  if (!term) return nodes;
  return nodes.flatMap((node) => {
    if (node.name.toLocaleLowerCase("id-ID").includes(term)) return [node];
    const children = filterRegionTree(node.children ?? [], term);
    return children.length ? [{ ...node, children }] : [];
  });
}

export function toggleSelection(ids: string[], id: string): string[] {
  return ids.includes(id) ? ids.filter((value) => value !== id) : [...ids, id];
}
