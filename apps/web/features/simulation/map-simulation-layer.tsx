"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Map as LeafletMap } from "leaflet";
import type { MultiPolygon, Polygon } from "geojson";
import type { ThematicCollection } from "@/features/geography/thematic-geometry";
import { useRegionSelection } from "@/features/regions/region-selection";
import {
  computeSimulationStats,
  loadTerrainPack,
  pointInGeometry,
  rasterizeGeometryMask,
  renderSimulationToImageData,
  samplePointMetrics,
  type DebrisSeed,
  type PointTerrainSample,
  type RegionRasterMask,
  type SimulationMode,
  type SimulationParams,
  type SimulationScope,
  type SimulationStats,
  type TerrainPack,
} from "./terrain-pack";

export interface SelectedSimRegion {
  key: string;
  scope: SimulationScope;
  title: string;
  subtitle: string;
  regencyId: number;
  districtId: number | null;
  landcoverLabel: string | null;
  clickedPoint: { lat: number; lng: number } | null;
  pointSample: PointTerrainSample | null;
  raster: RegionRasterMask;
}

interface DebrisParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  tier: 2 | 3;
}

// Cache rasterized polygon masks per (scope + id) so slider drags run at 60fps.
const maskCache = new Map<string, RegionRasterMask>();

export function MapSimulationLayer({
  map,
  enabled,
  mode,
  scope,
  params,
  paused,
  selectedTarget,
  onSelectTarget,
  onRegionResolved,
  onStatsChange,
  onStatus,
}: {
  map: LeafletMap;
  enabled: boolean;
  mode: SimulationMode;
  scope: SimulationScope;
  params: SimulationParams;
  paused: boolean;
  selectedTarget: { regencyId: number; districtId: number | null; point: { lat: number; lng: number } | null } | null;
  onSelectTarget: (target: { regencyId: number; districtId: number | null; point: { lat: number; lng: number } | null }) => void;
  onRegionResolved: (region: SelectedSimRegion | null) => void;
  onStatsChange: (stats: SimulationStats | null) => void;
  onStatus: (status: { message: string; retry?: () => void } | undefined) => void;
}) {
  const { tree, toMapIds } = useRegionSelection();
  const [collection, setCollection] = useState<ThematicCollection | null>(null);
  const [pack, setPack] = useState<TerrainPack | null>(null);
  const [attempt, setAttempt] = useState(0);

  const regencyNames = useMemo(() => {
    const names = new Map<number, string>();
    const regencyNodes = tree.flatMap((root) => (root.children?.length ? root.children : [root]));
    for (const node of regencyNodes) {
      const mapped = toMapIds([node.id])[0];
      const id = Number(mapped);
      if (Number.isSafeInteger(id) && id > 0) names.set(id, node.name);
    }
    return names;
  }, [tree, toMapIds]);

  const revealStartRef = useRef<number>(0);
  const lastRegionKeyRef = useRef<string | null>(null);

  useEffect(() => {
    if (!enabled) return;
    if (collection && pack) return;

    const controller = new AbortController();
    onStatus({ message: "Memuat data kontur DEM, lereng, dan batas wilayah simulasi..." });

    const loadBoundaries = collection
      ? Promise.resolve(collection)
      : fetch("/backend/web/spatial/layers", { signal: controller.signal }).then(async (res) => {
          if (!res.ok) throw new Error("Batas kecamatan simulasi gagal dimuat.");
          const json: ThematicCollection = await res.json();
          return json;
        });

    const loadPack = pack ? Promise.resolve(pack) : loadTerrainPack();

    Promise.all([loadBoundaries, loadPack])
      .then(([loadedCollection, loadedPack]) => {
        if (controller.signal.aborted) return;
        setCollection(loadedCollection);
        setPack(loadedPack);
        onStatus(undefined);
      })
      .catch(() => {
        if (!controller.signal.aborted) {
          onStatus({
            message: "Data kontur simulasi belum dapat dimuat.",
            retry: () => setAttempt((prev) => prev + 1),
          });
        }
      });

    return () => {
      controller.abort();
      onStatus(undefined);
    };
  }, [enabled, collection, pack, attempt, onStatus]);

  // Resolve the currently selected district or regency into a raster mask and geometry set.
  const resolved = useMemo<{ region: SelectedSimRegion; geometries: (Polygon | MultiPolygon)[] } | null>(() => {
    if (!enabled || !collection || !pack || !selectedTarget) return null;

    const matching =
      scope === "district" && selectedTarget.districtId !== null
        ? collection.features.filter((f) => f.properties.district_id === selectedTarget.districtId)
        : collection.features.filter((f) => f.properties.regency_id === selectedTarget.regencyId);

    if (!matching.length) return null;

    const effectiveScope: SimulationScope =
      scope === "district" && selectedTarget.districtId !== null ? "district" : "regency";
    const key =
      effectiveScope === "district"
        ? `district:${selectedTarget.districtId}`
        : `regency:${selectedTarget.regencyId}`;

    const geometries = matching.map((f) => f.geometry);
    let raster = maskCache.get(key);
    if (!raster) {
      raster = rasterizeGeometryMask(geometries, pack);
      maskCache.set(key, raster);
    }

    const regencyName = regencyNames.get(selectedTarget.regencyId) ?? `Kabupaten #${selectedTarget.regencyId}`;
    const firstProps = matching[0].properties;
    const title =
      effectiveScope === "district"
        ? `Kecamatan ${firstProps.district_name || firstProps.district_id}`
        : regencyName;
    const subtitle =
      effectiveScope === "district"
        ? regencyName
        : `${matching.length} kecamatan · Jawa Barat`;

    const pointSample = selectedTarget.point
      ? samplePointMetrics(pack, selectedTarget.point.lat, selectedTarget.point.lng)
      : null;

    return {
      geometries,
      region: {
        key,
        scope: effectiveScope,
        title,
        subtitle,
        regencyId: selectedTarget.regencyId,
        districtId: effectiveScope === "district" ? selectedTarget.districtId : null,
        landcoverLabel: firstProps.landcover_dominan,
        clickedPoint: selectedTarget.point,
        pointSample,
        raster,
      },
    };
  }, [enabled, collection, pack, selectedTarget, scope, regencyNames]);

  useEffect(() => {
    onRegionResolved(resolved ? resolved.region : null);
  }, [resolved, onRegionResolved]);

  useEffect(() => {
    if (!resolved || !pack) {
      onStatsChange(null);
      return;
    }
    const stats = computeSimulationStats(pack, resolved.region.raster, mode, params);
    onStatsChange(stats);
  }, [resolved, pack, mode, params, onStatsChange]);

  // 1) Interactive click/hover district selector layer.
  useEffect(() => {
    if (!enabled || !collection) return;
    let closed = false;
    let cleanup: (() => void) | undefined;

    void import("leaflet").then((L) => {
      if (closed) return;
      const pane = map.getPane("sim-hit") || map.createPane("sim-hit");
      pane.style.zIndex = "410";
      const renderer = L.canvas({ pane: "sim-hit" }).addTo(map);
      const group = L.layerGroup().addTo(map);
      const selectedKey = resolved?.region.key ?? null;

      L.geoJSON(collection, {
        pane: "sim-hit",
        style: (feature) => {
          const props = feature?.properties;
          const isSelected =
            selectedKey !== null &&
            ((scope === "district" && `district:${props?.district_id}` === selectedKey) ||
              (scope === "regency" && `regency:${props?.regency_id}` === selectedKey));
          return {
            renderer,
            color: isSelected ? (mode === "flood" ? "#1d4ed8" : "#c2410c") : "#334155",
            weight: isSelected ? 2 : 0.65,
            opacity: isSelected ? 0.95 : 0.35,
            fillColor: isSelected ? (mode === "flood" ? "#dbeafe" : "#ffedd5") : "#ffffff",
            fillOpacity: isSelected ? 0.08 : 0.01,
          };
        },
        onEachFeature(feature, layer) {
          const props = feature.properties;
          const regName = regencyNames.get(props.regency_id) ?? `Wilayah ${props.regency_id}`;
          const labelText =
            scope === "district"
              ? `Klik simulasi: Kec. ${props.district_name || props.district_id} (${regName})`
              : `Klik simulasi: ${regName}`;
          const tip = document.createElement("span");
          tip.textContent = labelText;
          layer.bindTooltip(tip, { sticky: true });

          if (layer instanceof L.Path) {
            layer.on("mouseover", () => {
              layer.setStyle({
                color: mode === "flood" ? "#2563eb" : "#ea580c",
                weight: 2,
                opacity: 0.9,
                fillOpacity: 0.12,
              });
            });
            layer.on("mouseout", () => {
              const isSelected =
                selectedKey !== null &&
                ((scope === "district" && `district:${props.district_id}` === selectedKey) ||
                  (scope === "regency" && `regency:${props.regency_id}` === selectedKey));
              layer.setStyle({
                color: isSelected ? (mode === "flood" ? "#1d4ed8" : "#c2410c") : "#334155",
                weight: isSelected ? 2 : 0.65,
                opacity: isSelected ? 0.95 : 0.35,
                fillOpacity: isSelected ? 0.08 : 0.01,
              });
            });
          }

          layer.on("click", (event) => {
            L.DomEvent.stopPropagation(event);
            onSelectTarget({
              regencyId: props.regency_id,
              districtId: props.district_id,
              point: { lat: event.latlng.lat, lng: event.latlng.lng },
            });
          });
        },
      }).addTo(group);

      const handleMapClick = (event: { latlng: { lat: number; lng: number } }) => {
        const { lat, lng } = event.latlng;
        for (const feature of collection.features) {
          if (pointInGeometry(lng, lat, feature.geometry)) {
            onSelectTarget({
              regencyId: feature.properties.regency_id,
              districtId: feature.properties.district_id,
              point: { lat, lng },
            });
            return;
          }
        }
      };

      map.on("click", handleMapClick);
      const mapEl = map.getContainer();
      const prevCursor = mapEl.style.cursor;
      mapEl.style.cursor = "crosshair";

      cleanup = () => {
        map.off("click", handleMapClick);
        mapEl.style.cursor = prevCursor;
        group.remove();
        renderer.remove();
      };
    });

    return () => {
      closed = true;
      cleanup?.();
    };
  }, [map, enabled, collection, scope, mode, resolved?.region.key, regencyNames, onSelectTarget]);

  // 2) Focus camera and highlight selected region boundary + clicked point marker.
  useEffect(() => {
    if (!enabled || !resolved) return;
    let closed = false;
    let cleanup: (() => void) | undefined;

    void import("leaflet").then((L) => {
      if (closed) return;
      const pane = map.getPane("sim-outline") || map.createPane("sim-outline");
      pane.style.zIndex = "435";
      const group = L.featureGroup().addTo(map);

      const accent = mode === "flood" ? "#1d4ed8" : "#c2410c";
      const isRegencyScope = resolved.region.scope === "regency";
      for (const geometry of resolved.geometries) {
        L.geoJSON(geometry, {
          pane: "sim-outline",
          interactive: false,
          style: {
            color: "#ffffff",
            weight: isRegencyScope ? 2 : 4.2,
            opacity: isRegencyScope ? 0.5 : 0.85,
            fill: false,
          },
        }).addTo(group);
        L.geoJSON(geometry, {
          pane: "sim-outline",
          interactive: false,
          style: {
            color: accent,
            weight: isRegencyScope ? 1.15 : 2.2,
            opacity: isRegencyScope ? 0.72 : 0.98,
            fill: false,
          },
        }).addTo(group);
      }

      if (resolved.region.clickedPoint) {
        const pt = resolved.region.clickedPoint;
        const sample = resolved.region.pointSample;
        const tipText = sample
          ? `Titik klik · Elevasi ${sample.demM.toFixed(1)} m dpl · Lereng ${sample.slopeDeg.toFixed(1)}°`
          : "Titik klik simulasi";
        L.circleMarker([pt.lat, pt.lng], {
          pane: "sim-outline",
          radius: 6,
          color: "#ffffff",
          weight: 2.5,
          fillColor: accent,
          fillOpacity: 1,
        })
          .bindTooltip(tipText)
          .addTo(group);
      }

      // Fly smoothly only when the selected region actually changes.
      if (lastRegionKeyRef.current !== resolved.region.key) {
        lastRegionKeyRef.current = resolved.region.key;
        revealStartRef.current = performance.now();
        const bounds = group.getBounds();
        if (bounds.isValid()) {
          const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
          const padBottom = window.innerWidth < 1000 ? 250 : 210;
          if (reduced) {
            map.fitBounds(bounds, {
              paddingTopLeft: [48, 72],
              paddingBottomRight: [48, padBottom],
              animate: false,
            });
          } else {
            map.flyToBounds(bounds, {
              paddingTopLeft: [48, 72],
              paddingBottomRight: [48, padBottom],
              duration: 0.65,
            });
          }
        }
      }

      cleanup = () => {
        group.remove();
      };
    });

    return () => {
      closed = true;
      cleanup?.();
    };
  }, [map, enabled, resolved, mode]);

  // Reset stored key when simulation closes so re-opening replays the rise animation.
  useEffect(() => {
    if (!enabled) {
      lastRegionKeyRef.current = null;
    }
  }, [enabled]);

  // 3) Real-time GPU-blitted Canvas overlay for DEM flood inundation and slope landslide particles.
  useEffect(() => {
    if (!enabled || !pack || !resolved) return;

    const pane = map.getPane("sim-canvas") || map.createPane("sim-canvas");
    pane.style.zIndex = "425";
    pane.style.pointerEvents = "none";

    const container = map.getContainer();
    const displayCanvas = document.createElement("canvas");
    displayCanvas.className = "gis-sim-canvas";
    displayCanvas.style.position = "absolute";
    displayCanvas.style.top = "0";
    displayCanvas.style.left = "0";
    displayCanvas.style.pointerEvents = "none";
    displayCanvas.style.zIndex = "425";
    pane.appendChild(displayCanvas);

    const offscreen = document.createElement("canvas");
    offscreen.width = pack.meta.width;
    offscreen.height = pack.meta.height;
    const offCtx = offscreen.getContext("2d");
    const displayCtx = displayCanvas.getContext("2d");

    if (!offCtx || !displayCtx) {
      displayCanvas.remove();
      return;
    }

    const imgData = offCtx.createImageData(pack.meta.width, pack.meta.height);
    const seeds: DebrisSeed[] = [];
    const particles: DebrisParticle[] = [];
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const animateMotion = !reduced && !paused;

    const syncCanvasSize = () => {
      const size = map.getSize();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const topLeft = map.containerPointToLayerPoint([0, 0]);
      displayCanvas.style.transform = `translate3d(${topLeft.x}px, ${topLeft.y}px, 0)`;
      if (displayCanvas.width !== Math.round(size.x * dpr) || displayCanvas.height !== Math.round(size.y * dpr)) {
        displayCanvas.width = Math.round(size.x * dpr);
        displayCanvas.height = Math.round(size.y * dpr);
        displayCanvas.style.width = `${size.x}px`;
        displayCanvas.style.height = `${size.y}px`;
      }
      displayCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const spawnParticle = (seedIdx: number): DebrisParticle => {
      const seed = seeds[seedIdx % seeds.length];
      const speed = seed.tier === 3 ? 0.32 : 0.22;
      return {
        x: seed.x,
        y: seed.y,
        vx: Math.cos(seed.rad) * speed,
        vy: Math.sin(seed.rad) * speed,
        life: Math.random() * 24,
        maxLife: 24 + Math.random() * 20,
        tier: seed.tier,
      };
    };

    let rafId = 0;
    let lastFrameTime = 0;
    let phase = 0;

    const drawFrame = (now: number) => {
      syncCanvasSize();
      const elapsed = now - revealStartRef.current;
      const revealRaw = reduced || revealStartRef.current === 0 ? 1 : Math.min(1, elapsed / 620);
      const revealProgress = 1 - Math.pow(1 - revealRaw, 3);

      renderSimulationToImageData(
        pack,
        resolved.region.raster,
        mode,
        params,
        revealProgress,
        phase,
        imgData,
        seeds,
      );
      offCtx.putImageData(imgData, 0, 0);

      const size = map.getSize();
      displayCtx.clearRect(0, 0, size.x, size.y);

      const { bounds, width, height } = pack.meta;
      const nw = map.latLngToContainerPoint([bounds.north, bounds.west]);
      const se = map.latLngToContainerPoint([bounds.south, bounds.east]);
      const drawW = se.x - nw.x;
      const drawH = se.y - nw.y;

      displayCtx.imageSmoothingEnabled = true;
      displayCtx.drawImage(offscreen, nw.x, nw.y, drawW, drawH);

      // Draw downslope debris-flow streaks in landslide mode when motion is active.
      if (mode === "landslide" && seeds.length > 0 && revealProgress > 0.45) {
        const targetCount = Math.min(84, seeds.length);
        if (particles.length !== targetCount) {
          particles.length = 0;
          for (let i = 0; i < targetCount; i++) {
            particles.push(spawnParticle(Math.floor((i * seeds.length) / targetCount)));
          }
        }

        const scaleX = drawW / width;
        const scaleY = drawH / height;
        displayCtx.lineCap = "round";

        for (let i = 0; i < particles.length; i++) {
          const p = particles[i];
          if (animateMotion) {
            p.x += p.vx;
            p.y += p.vy;
            p.life += 1;
            if (p.life >= p.maxLife) {
              particles[i] = spawnParticle(Math.floor(Math.random() * seeds.length));
              continue;
            }
          }
          const alpha = animateMotion
            ? Math.sin((p.life / p.maxLife) * Math.PI) * 0.92
            : 0.72;
          const sx = nw.x + p.x * scaleX;
          const sy = nw.y + p.y * scaleY;
          const tx = nw.x + (p.x - p.vx * 5.5) * scaleX;
          const ty = nw.y + (p.y - p.vy * 5.5) * scaleY;

          displayCtx.strokeStyle =
            p.tier === 3
              ? `rgba(127, 29, 29, ${alpha.toFixed(2)})`
              : `rgba(154, 52, 18, ${alpha.toFixed(2)})`;
          displayCtx.lineWidth = p.tier === 3 ? 2.4 : 1.8;
          displayCtx.beginPath();
          displayCtx.moveTo(tx, ty);
          displayCtx.lineTo(sx, sy);
          displayCtx.stroke();
        }
      }
    };

    const tick = (now: number) => {
      const stillRevealing = !reduced && revealStartRef.current > 0 && now - revealStartRef.current < 650;
      if (now - lastFrameTime >= 42 || stillRevealing) {
        lastFrameTime = now;
        if (animateMotion) phase += 0.22;
        drawFrame(now);
      }
      if (animateMotion || stillRevealing) {
        rafId = window.requestAnimationFrame(tick);
      }
    };

    const handleViewChange = () => drawFrame(performance.now());
    map.on("move zoom viewreset resize", handleViewChange);
    drawFrame(performance.now());
    if (animateMotion || (!reduced && performance.now() - revealStartRef.current < 650)) {
      rafId = window.requestAnimationFrame(tick);
    }

    return () => {
      window.cancelAnimationFrame(rafId);
      map.off("move zoom viewreset resize", handleViewChange);
      if (displayCanvas.parentElement) displayCanvas.remove();
      void container;
    };
  }, [map, enabled, pack, resolved, mode, params, paused]);

  return null;
}
