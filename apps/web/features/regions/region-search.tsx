"use client";

import { useEffect, useId, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Input } from "@/components/ui/input";
import { fetchRegionChildren } from "./api";
import type { RegionNode } from "../webgis/types";

export function RegionSearch({ onSelect }: { onSelect?: (region: RegionNode) => void }) {
  const router = useRouter();
  const resultsId = useId();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [regions, setRegions] = useState<RegionNode[]>();
  const [error, setError] = useState(false);
  useEffect(() => {
    if (!open || regions) return;
    const controller = new AbortController();
    fetchRegionChildren(undefined, controller.signal).then(setRegions).catch(() => {
      if (!controller.signal.aborted) setError(true);
    });
    return () => controller.abort();
  }, [open, regions]);
  const term = query.trim().toLocaleLowerCase("id-ID");
  const matches = term ? regions?.filter((region) => region.name.toLocaleLowerCase("id-ID").includes(term)) ?? [] : [];
  function select(region: RegionNode) {
    setQuery(region.name);
    setOpen(false);
    if (onSelect) onSelect(region);
    else router.push(`/map?region=${encodeURIComponent(region.id)}`);
  }
  return <form role="search" aria-label="Pencarian daerah" className="gis-navbar-search" onBlur={(event) => {
    if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false);
  }} onSubmit={(event) => { event.preventDefault(); if (matches.length === 1) select(matches[0]); else setOpen(true); }}>
    <Image src="/icons/navbar-search.svg" alt="" width={16} height={16} />
    <Input id={`${resultsId}-input`} name="region-search" aria-label="Cari daerah" placeholder="Cari daerah" value={query} aria-controls={open && term ? resultsId : undefined} onFocus={() => { setError(false); setOpen(true); }} onChange={(event) => { setQuery(event.target.value); setOpen(true); }} onKeyDown={(event) => { if (event.key === "Escape") setOpen(false); }} />
    {open && term && <div id={resultsId} className="gis-search-results">
      {!regions ? <p role="status">{error ? "Daerah gagal dimuat. Fokuskan pencarian untuk mencoba lagi." : "Memuat daerah…"}</p> : !matches.length ? <p role="status">Daerah tidak ditemukan.</p> : matches.map((region) => <button type="button" key={region.id} onClick={() => select(region)}>{region.name}</button>)}
    </div>}
  </form>;
}
