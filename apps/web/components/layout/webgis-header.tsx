"use client";

import Link from "next/link";
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
      <Link className="gis-brand" href="/" aria-label="Bencana Banjir — kembali ke beranda"><span className="gis-brand-placeholder" aria-hidden="true" /><span><strong>Bencana Banjir</strong><small>Web GIS Bencana Banjir</small></span></Link>
      <nav aria-label="Navigasi WebGIS">{webgisNavigation.map((item) => (
        <Button asChild variant="ghost" key={item.href} className={`gis-nav-link text-base! leading-6! ${pathname === item.href ? "gis-nav-active font-medium!" : "font-normal!"}`}>
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
