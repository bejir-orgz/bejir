"use client";

import { useEffect, useId, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Input } from "@/components/ui/input";
import { searchRegionMatches } from "./api";
import type { RegionSearchMatch } from "../geography/search";
import type { RegionNode } from "../webgis/types";

export function RegionSearch({ onSelect }: { onSelect?: (region: RegionNode) => void }) {
  const router = useRouter();
  const resultsId = useId();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [result, setResult] = useState<{ term: string; matches: RegionSearchMatch[] | null }>();
  const term = query.trim();
  const matches = result?.term === term ? result.matches : undefined;
  useEffect(() => {
    if (!open || !term) return;
    const controller = new AbortController();
    const timer = setTimeout(() => {
      searchRegionMatches(term, controller.signal).then(
        (matches) => { if (!controller.signal.aborted) setResult({ term, matches }); },
        () => { if (!controller.signal.aborted) setResult({ term, matches: null }); },
      );
    }, 250);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [open, term]);
  function select(region: RegionNode) {
    setQuery(region.name);
    setOpen(false);
    if (onSelect) onSelect(region);
    else router.push(`/map?region=${encodeURIComponent(region.id)}`);
  }
  return <form role="search" aria-label="Pencarian daerah" className="gis-navbar-search" onBlur={(event) => {
    if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false);
  }} onSubmit={(event) => { event.preventDefault(); if (open && matches?.length === 1) select(matches[0]); else setOpen(true); }}>
    <Image src="/icons/navbar-search.svg" alt="" width={16} height={16} />
    <Input id={`${resultsId}-input`} name="region-search" aria-label="Cari daerah" placeholder="Cari daerah" maxLength={100} value={query} aria-controls={open && term ? resultsId : undefined} onFocus={() => { if (matches === null) setResult(undefined); setOpen(true); }} onChange={(event) => { setQuery(event.target.value); setOpen(true); }} onKeyDown={(event) => { if (event.key === "Escape") setOpen(false); }} />
    {open && term && <div id={resultsId} className="gis-search-results">
      {matches == null ? <p role="status">{matches === null ? "Daerah gagal dimuat. Fokuskan pencarian untuk mencoba lagi." : "Memuat daerah…"}</p> : !matches.length ? <p role="status">Daerah tidak ditemukan.</p> : matches.map((region) => {
        const [regency, district] = region.parents;
        return <button type="button" key={region.id} onClick={() => select(region)}>
          {region.name}
          {regency && <small className="block text-xs text-neutral-600">
            {district && `Kec. ${district.replace(/^(?:Kecamatan|Kec\.?)\s+/i, "")} · `}{regency}
          </small>}
        </button>;
      })}
    </div>}
  </form>;
}
