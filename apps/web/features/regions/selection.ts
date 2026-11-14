import type { AdministrativeCatalog } from "../../lib/api/schemas";
import { districtFilterId, isRegionSelected, regionFilterId, westJavaFilterId } from "../webgis/region-tree";

export function regionSelectionIndex(catalog: AdministrativeCatalog) {
  const pairs: [string, string][] = catalog.regencies.map((row) => [String(row.id), regionFilterId(row.name)]);
  for (const district of catalog.districts) {
    const parent = catalog.regencies.find((row) => row.id === district.regency_id);
    if (parent) pairs.push([`${parent.id}/${district.id}`, districtFilterId(parent.name, district.name)]);
  }
  return pairs;
}

export function translateRegionSelection(choices: readonly string[], pairs: [string, string][], toMap: boolean): string[] {
  const lookup = new Map(pairs.map(([map, filter]) => toMap ? [filter, map] : [map, filter]));
  const translated = choices.flatMap((choice) => {
    const excluded = choice.startsWith("!");
    const id = choice.replace(/^!/, "");
    if (id === westJavaFilterId && toMap) return pairs.filter(([map]) => !map.includes("/")).map(([map]) => `${excluded ? "!" : ""}${map}`);
    let mapped = lookup.get(id);
    if (!mapped) {
      const split = toMap ? id.lastIndexOf("/village:") : id.split("/").length === 3 ? id.lastIndexOf("/") : -1;
      const parent = split >= 0 ? lookup.get(id.slice(0, split)) : undefined;
      if (parent) mapped = toMap ? `${parent}/${id.slice(split + 9)}` : `${parent}/village:${id.slice(split + 1)}`;
    }
    return mapped ? [`${excluded ? "!" : ""}${mapped}`] : [];
  });
  return translated.filter((id) => id.startsWith("!") || !translated.includes(`!${id}`));
}

export function compactMapScope(choices: string[], pairs: [string, string][]): string[] {
  if (!choices.length || choices.some((id) => id.includes("/"))) return choices;
  const roots = pairs.filter(([map]) => !map.includes("/")).map(([map]) => map);
  const selected = roots.filter((id) => isRegionSelected(choices, id));
  return selected.length === roots.length ? [] : selected.length ? selected : choices;
}
