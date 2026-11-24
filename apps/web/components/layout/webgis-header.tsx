"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { webgisNavigation } from "@/config/navigation";
import { RegionSearch } from "@/features/regions/region-search";
import type { RegionNode } from "@/features/webgis/types";
import "./webgis-header.css";

export function WebgisHeader({ mapCanvas = false, onRegionSelect }: { mapCanvas?: boolean; onRegionSelect?: (region: RegionNode) => void }) {
  const pathname = usePathname();
  return (
    <header className="gis-header" data-canvas={mapCanvas}>
      <Link className="gis-brand" href="/" aria-label="SIBAJAWA — kembali ke beranda"><Image className="gis-brand-logo" src="/images/sibajawa-mark.svg" alt="" width={40} height={40} unoptimized /><span><strong>SIBAJAWA</strong><small>Web GIS Bencana Banjir Jawa Barat</small></span></Link>
      {/* Type and weight live in webgis-header.css, which scales them down on narrow screens.
          Repeating them here as !important utilities overrode those media queries. */}
      <nav aria-label="Navigasi WebGIS">{webgisNavigation.map((item) => (
        <Button asChild variant="ghost" key={item.href} className={`gis-nav-link ${pathname === item.href ? "gis-nav-active" : ""}`}>
          <Link href={item.href} aria-current={pathname === item.href ? "page" : undefined}>{item.label}</Link>
        </Button>
      ))}</nav>
      <div className="gis-header-actions">
        <RegionSearch onSelect={onRegionSelect} />
        <Button asChild variant="outline" className="gis-home-link font-medium! text-base! leading-6!">
          <Link href="/">Beranda</Link>
        </Button>
      </div>
    </header>
  );
}
