"use client";

import { useEffect } from "react";
import type { Map as LeafletMap, LeafletMouseEvent } from "leaflet";
import type { GeoJsonObject } from "geojson";
import { requestBackend } from "../../lib/api/client";
import type { RouteRequest, RouteResponse } from "../../lib/api/schemas";
import { fetchNearestEvacuationSite, formatStraightDistance } from "./nearby-fallback";

export function EvacuationRouting({
  map,
  enabled,
  onStatus,
}: {
  map: LeafletMap;
  enabled: boolean;
  onStatus: (status: { message: string } | undefined) => void;
}) {
  useEffect(() => {
    if (!enabled) return;
    let controller: AbortController | undefined;
    let removeRoute: (() => void) | undefined;
    let closed = false;
    onStatus({
      message: "Mode Evakuasi aktif: klik titik mana saja pada peta untuk menghitung rute berkendara terdekat.",
    });

    async function findRoute(event: LeafletMouseEvent) {
      controller?.abort();
      const active = new AbortController();
      controller = active;
      removeRoute?.();
      removeRoute = undefined;
      onStatus({ message: "Mencari rute evakuasi terdekat..." });
      try {
        const payload: RouteRequest = {
          origin_longitude: event.latlng.lng,
          origin_latitude: event.latlng.lat,
          travel_mode: "driving",
          limit: 1,
        };
        const result = await requestBackend<RouteResponse>("/api/v1/evacuation/routes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
          signal: active.signal,
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
        const geo = geometry as unknown as GeoJsonObject;
        const casing = L.geoJSON(geo, { style: { color: "#ffffff", weight: 8, opacity: 0.92 } }).addTo(map);
        const line = L.geoJSON(geo, { style: { color: "#2563eb", weight: 5, opacity: 0.95 } }).addTo(map);
        if (!line.getBounds().isValid()) {
          casing.remove();
          line.remove();
          throw new Error("Geometri rute kosong.");
        }
        const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        const flow = reduced
          ? undefined
          : L.geoJSON(geo, {
              interactive: false,
              style: { color: "#bfdbfe", weight: 2.5, opacity: 0.95, className: "gis-route-flow" },
            }).addTo(map);

        const origin = L.circleMarker(event.latlng, {
          radius: 7.5,
          color: "#111827",
          weight: 2.5,
          fillColor: "#ffffff",
          fillOpacity: 1,
        })
          .bindTooltip("Titik awal pilihan")
          .addTo(map);
        const destination = L.circleMarker([route.evacuation_site.latitude, route.evacuation_site.longitude], {
          radius: 9,
          color: "#ffffff",
          weight: 2.5,
          fillColor: "#16a34a",
          fillOpacity: 1,
        })
          .bindTooltip(route.evacuation_site.name || "Tujuan evakuasi")
          .addTo(map);

        removeRoute = () => {
          flow?.remove();
          line.remove();
          casing.remove();
          origin.remove();
          destination.remove();
        };
        if (reduced) map.fitBounds(line.getBounds(), { padding: [48, 48], maxZoom: 17, animate: false });
        else map.flyToBounds(line.getBounds(), { padding: [48, 48], maxZoom: 17, duration: 0.65 });

        const name = route.evacuation_site.name || "Titik evakuasi";
        onStatus({
          message: `Rute berkendara ke ${name} · ${(route.distance_m / 1000).toLocaleString("id-ID", { maximumFractionDigits: 2 })} km · ${route.duration_minutes.toLocaleString("id-ID", { maximumFractionDigits: 1 })} menit`,
        });
      } catch (error) {
        if (closed || active.signal.aborted) return;
        const reason = error instanceof Error ? error.message : "Pencarian rute gagal.";
        // Routing over the full road network is fragile; fall back to proximity with an explicit straight-line label.
        try {
          const site = await fetchNearestEvacuationSite(event.latlng.lng, event.latlng.lat, active.signal);
          if (closed || active.signal.aborted) return;
          if (!site) {
            onStatus({ message: `${reason} Tidak ada titik evakuasi di sekitar sini.` });
            return;
          }
          const L = await import("leaflet");
          if (closed || active.signal.aborted) return;
          removeRoute?.();
          const target = L.circleMarker([site.latitude, site.longitude], {
            radius: 7,
            color: "#b45309",
            fillColor: "#fef3c7",
            fillOpacity: 1,
          })
            .bindTooltip(site.name || "Titik evakuasi terdekat")
            .addTo(map);
          const origin = L.circleMarker(event.latlng, {
            radius: 7,
            color: "#111827",
            fillColor: "#ffffff",
            fillOpacity: 1,
          }).addTo(map);
          const guide = L.polyline([event.latlng, [site.latitude, site.longitude]], {
            color: "#b45309",
            weight: 2,
            dashArray: "6 6",
          }).addTo(map);
          removeRoute = () => {
            target.remove();
            origin.remove();
            guide.remove();
          };
          map.fitBounds(guide.getBounds(), { padding: [48, 48], maxZoom: 17 });
          const away = formatStraightDistance(site.distance_m);
          onStatus({
            message: `${reason} Titik terdekat: ${site.name || "tanpa nama"} · ${away} garis lurus, bukan jarak berkendara. Klik lagi untuk mencoba rute.`,
          });
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
  return enabled ? (
    <p className="sr-only">
      Klik peta untuk menghitung rute berkendara ke titik evakuasi terdekat yang dapat dijangkau.
    </p>
  ) : null;
}
