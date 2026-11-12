"use client";

import { useEffect } from "react";
import type { Map as LeafletMap, LeafletMouseEvent } from "leaflet";
import type { GeoJsonObject } from "geojson";
import { requestBackend } from "../../lib/api/client";
import type { RouteRequest, RouteResponse } from "../../lib/api/schemas";

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
        if (!closed && !active.signal.aborted) onStatus({ message: error instanceof Error ? error.message : "Pencarian rute gagal." });
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
  return enabled ? <p className="sr-only">Klik peta untuk menghitung rute berkendara ke titik evakuasi terdekat yang dapat dijangkau.</p> : null;
}
