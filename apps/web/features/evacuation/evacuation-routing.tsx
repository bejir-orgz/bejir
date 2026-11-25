"use client";

import { useEffect } from "react";
import type { Map as LeafletMap, LeafletMouseEvent } from "leaflet";
import type { GeoJsonObject } from "geojson";
import { requestBackend } from "../../lib/api/client";
import type { RouteRequest, RouteResponse } from "../../lib/api/schemas";

interface NearbySite { id: number; name: string | null; latitude: number; longitude: number; distance_m: number }

export function EvacuationRouting({ map, enabled, onStatus }: {
  map: LeafletMap;
  enabled: boolean;
  onStatus: (status: { message: string } | undefined) => void;
}) {
  useEffect(() => {
    if (!enabled) return;
    let controller: AbortController | undefined;
    let removeRoute: (() => void) | undefined;
    let closed = false;
    async function findRoute(event: LeafletMouseEvent) {
      controller?.abort();
      const active = new AbortController();
      controller = active;
      removeRoute?.();
      removeRoute = undefined;
      onStatus({ message: "Mencari rute evakuasi…" });
      try {
        const payload: RouteRequest = {
          origin_longitude: event.latlng.lng, origin_latitude: event.latlng.lat, travel_mode: "driving", limit: 1,
        };
        const result = await requestBackend<RouteResponse>("/api/v1/evacuation/routes", {
          method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload), signal: active.signal,
        });
        if (closed || active.signal.aborted) return;
        const route = result.routes[0];
        if (!route) throw new Error("Tidak ada tujuan evakuasi yang dapat dijangkau.");
        const L = await import("leaflet");
        if (closed || active.signal.aborted) return;
        const geometry = route.geometry;
        if (!geometry || !["LineString", "MultiLineString", "FeatureCollection", "Feature"].includes(String(geometry.type))) {
          throw new Error("Geometri rute belum tersedia.");
        }
        const line = L.geoJSON(geometry as unknown as GeoJsonObject, { style: { color: "#2563eb", weight: 5 } }).addTo(map);
        if (!line.getBounds().isValid()) {
          line.remove();
          throw new Error("Geometri rute kosong.");
        }
        const origin = L.circleMarker(event.latlng, { radius: 7, color: "#111827", fillColor: "#ffffff", fillOpacity: 1 }).addTo(map);
        removeRoute = () => { line.remove(); origin.remove(); };
        map.fitBounds(line.getBounds(), { padding: [48, 48], maxZoom: 17 });
        const name = route.evacuation_site.name || "Titik evakuasi";
        onStatus({ message: `Rute berkendara ke ${name} · ${(route.distance_m / 1000).toLocaleString("id-ID", { maximumFractionDigits: 2 })} km · ${route.duration_minutes.toLocaleString("id-ID", { maximumFractionDigits: 1 })} menit` });
      } catch (error) {
        if (closed || active.signal.aborted) return;
        const reason = error instanceof Error ? error.message : "Pencarian rute gagal.";
        // Routing over the full road network is the fragile part; proximity is not. Rather
        // than leave someone with nothing, fall back to the nearest site in a straight line
        // and label it as such, so nobody reads it as a driving distance.
        try {
          const nearby = await requestBackend<NearbySite[]>(`/api/v1/evacuation/sites/nearby?longitude=${event.latlng.lng}&latitude=${event.latlng.lat}&limit=1`, { signal: active.signal });
          const site = nearby[0];
          if (closed || active.signal.aborted) return;
          if (!site) { onStatus({ message: `${reason} Tidak ada titik evakuasi di sekitar sini.` }); return; }
          const L = await import("leaflet");
          if (closed || active.signal.aborted) return;
          removeRoute?.();
          const target = L.circleMarker([site.latitude, site.longitude], { radius: 7, color: "#b45309", fillColor: "#fef3c7", fillOpacity: 1 }).addTo(map);
          const origin = L.circleMarker(event.latlng, { radius: 7, color: "#111827", fillColor: "#ffffff", fillOpacity: 1 }).addTo(map);
          const guide = L.polyline([event.latlng, [site.latitude, site.longitude]], { color: "#b45309", weight: 2, dashArray: "6 6" }).addTo(map);
          removeRoute = () => { target.remove(); origin.remove(); guide.remove(); };
          map.fitBounds(guide.getBounds(), { padding: [48, 48], maxZoom: 17 });
          // Most evacuation sites are a few hundred metres away, and "0 km" tells nobody anything.
          const away = site.distance_m < 1000
            ? `${Math.round(site.distance_m).toLocaleString("id-ID")} m`
            : `${(site.distance_m / 1000).toLocaleString("id-ID", { maximumFractionDigits: 1 })} km`;
          onStatus({ message: `${reason} Titik terdekat: ${site.name || "tanpa nama"} · ${away} garis lurus, bukan jarak berkendara. Klik lagi untuk mencoba rute.` });
        } catch {
          if (!closed && !active.signal.aborted) onStatus({ message: reason });
        }
      }
    }
    map.on("click", findRoute);
    return () => {
      closed = true;
      controller?.abort();
      map.off("click", findRoute);
      removeRoute?.();
      onStatus(undefined);
    };
  }, [map, enabled, onStatus]);
  return enabled ? <p className="gis-route-hint absolute z-1 left-1/2 top-4 -translate-x-1/2 max-w-[calc(100%_-_32px)] p-[6px_12px] rounded-lg bg-[#fffffff2] text-[12px] leading-[16px] text-[#525252] pointer-events-none text-center">Klik di peta untuk rute berkendara ke titik evakuasi terdekat.</p> : null;
}
