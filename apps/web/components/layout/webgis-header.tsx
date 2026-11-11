"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { webgisNavigation } from "@/config/navigation";
import "./webgis-header.css";

export function WebgisHeader({ dummy = true, mapCanvas = false }: { dummy?: boolean; mapCanvas?: boolean }) {
  const pathname = usePathname();
  return (
    <header className="gis-header" data-canvas={mapCanvas}>
      <Link className="gis-brand" href="/" aria-label="Bencana Banjir — kembali ke beranda"><span className="gis-brand-placeholder" aria-hidden="true" /><span><strong>Bencana Banjir</strong><small>Web GIS Bencana Banjir</small></span></Link>
      <nav aria-label="Navigasi WebGIS">{webgisNavigation.map((item) => (
        <Button asChild variant="ghost" key={item.href} className={`gis-nav-link ${pathname === item.href ? "gis-nav-active" : ""}`}>
          <Link href={item.href} aria-current={pathname === item.href ? "page" : undefined}>{item.label}</Link>
        </Button>
      ))}</nav>
      {dummy ? <span className="gis-dummy-label">DATA DUMMY</span> : null}
    </header>
  );
}
