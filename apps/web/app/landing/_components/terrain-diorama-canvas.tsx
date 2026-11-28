"use client";

import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";
import { IconPlayerPause, IconPlayerPlay, IconRotate360 } from "@tabler/icons-react";
import {
  clampNumber,
  createDioramaRenderer,
  decodeDioramaGrid,
  gridToWorld,
  projectDioramaAnchor,
  type DecodedDioramaGrid,
  type DioramaCameraPose,
  type DioramaLayerMode,
  type LandingDioramaGridJson,
} from "./terrain-diorama-gl";
import styles from "./landing.module.css";

export interface DioramaCalloutPin {
  id: string;
  badge: string;
  label: string;
  anchor: "upstream" | "basin" | "evacSafe";
  active?: boolean;
}

let cachedGridPromise: Promise<DecodedDioramaGrid> | null = null;

function loadLandingDioramaGrid(): Promise<DecodedDioramaGrid> {
  if (!cachedGridPromise) {
    cachedGridPromise = fetch("/simulation/landing-diorama-grid.json")
      .then((res) => {
        if (!res.ok) throw new Error("Gagal memuat grid diorama 3D.");
        return res.json();
      })
      .then((json: LandingDioramaGridJson) => decodeDioramaGrid(json));
  }
  return cachedGridPromise;
}

function getAnchorWorldPos(
  grid: DecodedDioramaGrid,
  anchor: "upstream" | "basin" | "evacSafe",
  yOffset = 0.055,
): [number, number, number] {
  const [gx, gy] = grid.meta.anchors[anchor];
  const demNorm = grid.dem[gy * grid.meta.width + gx] / 255;
  const [x, y, z] = gridToWorld(gx, gy, grid.meta.width, grid.meta.height, demNorm);
  return [x, y + yOffset, z];
}

export function TerrainDioramaCanvas({
  mode,
  targetPose,
  waterRiseM,
  pins,
  showEvacRoute,
  allowDragOrbit = false,
  externalPaused = false,
  hideControls = false,
  ariaLabel,
  className,
}: {
  mode: DioramaLayerMode;
  targetPose: DioramaCameraPose;
  waterRiseM: number;
  pins: DioramaCalloutPin[];
  showEvacRoute?: boolean;
  allowDragOrbit?: boolean;
  externalPaused?: boolean;
  hideControls?: boolean;
  ariaLabel: string;
  className?: string;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const routeCasingRef = useRef<SVGPathElement>(null);
  const routeStrokeRef = useRef<SVGPathElement>(null);
  const pinElsRef = useRef<Map<string, HTMLDivElement>>(new Map());

  const reduced = useReducedMotion();
  const [paused, setPaused] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [grid, setGrid] = useState<DecodedDioramaGrid | null>(null);
  const [webglFailed, setWebglFailed] = useState(false);

  const dragYawOffsetRef = useRef(0);
  const dragStartRef = useRef<{ x: number; startYaw: number } | null>(null);
  const targetRef = useRef({
    mode,
    pose: targetPose,
    waterRiseM,
    showEvacRoute: Boolean(showEvacRoute),
    pins,
    paused: Boolean(paused || externalPaused || reduced),
  });

  useEffect(() => {
    targetRef.current = {
      mode,
      pose: targetPose,
      waterRiseM,
      showEvacRoute: Boolean(showEvacRoute),
      pins,
      paused: Boolean(paused || externalPaused || reduced),
    };
  }, [mode, targetPose, waterRiseM, showEvacRoute, pins, paused, externalPaused, reduced]);

  useEffect(() => {
    let active = true;
    loadLandingDioramaGrid()
      .then((loaded) => {
        if (active) setGrid(loaded);
      })
      .catch(() => {
        if (active) setWebglFailed(true);
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap || !grid) return;

    const renderer = createDioramaRenderer(canvas, grid);
    if (!renderer) {
      queueMicrotask(() => setWebglFailed(true));
      return;
    }

    let inView = true;
    let tabVisible = !document.hidden;
    let rafId = 0;
    let lastTs = performance.now();
    let elapsedSec = 0;

    const currentPose: DioramaCameraPose = { ...targetRef.current.pose };
    let currentWater = targetRef.current.waterRiseM;

    const syncSize = () => {
      const rect = wrap.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        renderer.resize(rect.width, rect.height, window.devicePixelRatio || 1);
      }
    };
    syncSize();

    const syncOverlays = (mvp: Float32Array) => {
      const rect = wrap.getBoundingClientRect();
      const vw = rect.width;
      const vh = rect.height;
      if (vw <= 0 || vh <= 0) return;

      const curPins = targetRef.current.pins;
      for (const pin of curPins) {
        const el = pinElsRef.current.get(pin.id);
        if (!el) continue;
        const pos = projectDioramaAnchor(mvp, getAnchorWorldPos(grid, pin.anchor, 0.07), vw, vh);
        if (pos.visible) {
          el.style.opacity = "1";
          el.style.transform = `translate3d(${pos.x.toFixed(1)}px, ${pos.y.toFixed(1)}px, 0) translate(-50%, -100%)`;
        } else {
          el.style.opacity = "0";
        }
      }

      const casing = routeCasingRef.current;
      const stroke = routeStrokeRef.current;
      if (casing && stroke) {
        if (!targetRef.current.showEvacRoute) {
          casing.setAttribute("d", "");
          stroke.setAttribute("d", "");
        } else {
          const [bx, by] = grid.meta.anchors.basin;
          const [ex, ey] = grid.meta.anchors.evacSafe;
          let d = "";
          const steps = 18;
          for (let i = 0; i <= steps; i++) {
            const t = i / steps;
            const gx = Math.round(bx + (ex - bx) * t);
            const gy = Math.round(by + (ey - by) * t);
            const demNorm = grid.dem[gy * grid.meta.width + gx] / 255;
            const arcLift = 0.075 + Math.sin(t * Math.PI) * 0.055;
            const world = gridToWorld(gx, gy, grid.meta.width, grid.meta.height, demNorm);
            const pt = projectDioramaAnchor(mvp, [world[0], world[1] + arcLift, world[2]], vw, vh);
            if (pt.visible) {
              d += `${d.length === 0 ? "M" : "L"}${pt.x.toFixed(1)},${pt.y.toFixed(1)}`;
            }
          }
          casing.setAttribute("d", d);
          stroke.setAttribute("d", d);
        }
      }
    };

    const drawFrame = (now: number) => {
      const dt = Math.min(0.05, Math.max(0.001, (now - lastTs) / 1000));
      lastTs = now;

      const tState = targetRef.current;
      const isStatic = tState.paused;
      if (!isStatic) {
        elapsedSec += dt;
      }

      // Exponential damping equivalent to --ease-out-strong (~520ms settle) for interruptible camera/water transitions.
      const smooth = isStatic ? 1 : 1 - Math.exp(-dt * 7.2);
      const ambientSway = isStatic || dragStartRef.current ? 0 : Math.sin(elapsedSec * 0.45) * 3.2;
      const goalYaw = tState.pose.yawDeg + dragYawOffsetRef.current + ambientSway;

      currentPose.yawDeg += (goalYaw - currentPose.yawDeg) * smooth;
      currentPose.pitchDeg += (tState.pose.pitchDeg - currentPose.pitchDeg) * smooth;
      currentPose.distance += (tState.pose.distance - currentPose.distance) * smooth;
      currentPose.panX += (tState.pose.panX - currentPose.panX) * smooth;
      currentPose.panZ += (tState.pose.panZ - currentPose.panZ) * smooth;
      currentWater += (tState.waterRiseM - currentWater) * smooth;

      const mvp = renderer.render({
        mode: tState.mode,
        pose: currentPose,
        waterRiseM: currentWater,
        timeSec: elapsedSec,
      });
      syncOverlays(mvp);

      if (inView && tabVisible) {
        const needsSettle =
          Math.abs(goalYaw - currentPose.yawDeg) > 0.08 ||
          Math.abs(tState.pose.pitchDeg - currentPose.pitchDeg) > 0.08 ||
          Math.abs(tState.waterRiseM - currentWater) > 0.03;
        if (!isStatic || needsSettle) {
          rafId = window.requestAnimationFrame(drawFrame);
        } else {
          rafId = 0;
        }
      } else {
        rafId = 0;
      }
    };

    const kick = () => {
      if (rafId === 0 && inView && tabVisible) {
        lastTs = performance.now();
        rafId = window.requestAnimationFrame(drawFrame);
      }
    };

    const resizeObserver = new ResizeObserver(() => {
      syncSize();
      kick();
    });
    resizeObserver.observe(wrap);

    const intersectionObserver = new IntersectionObserver(
      (entries) => {
        inView = entries.some((entry) => entry.isIntersecting);
        if (inView) {
          kick();
        } else if (rafId !== 0) {
          window.cancelAnimationFrame(rafId);
          rafId = 0;
        }
      },
      { threshold: 0.02 },
    );
    intersectionObserver.observe(wrap);

    const onVisChange = () => {
      tabVisible = !document.hidden;
      if (tabVisible) kick();
      else if (rafId !== 0) {
        window.cancelAnimationFrame(rafId);
        rafId = 0;
      }
    };
    document.addEventListener("visibilitychange", onVisChange);

    // Expose a custom event trigger so prop updates immediately wake a static/reduced-motion frame.
    const onSyncEvent = () => kick();
    wrap.addEventListener("diorama-sync", onSyncEvent);

    kick();

    return () => {
      if (rafId !== 0) window.cancelAnimationFrame(rafId);
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
      document.removeEventListener("visibilitychange", onVisChange);
      wrap.removeEventListener("diorama-sync", onSyncEvent);
      renderer.dispose();
    };
  }, [grid]);

  // Wake renderer cleanly whenever mode, camera pose, water level, or pause state changes.
  useEffect(() => {
    wrapRef.current?.dispatchEvent(new CustomEvent("diorama-sync"));
  }, [mode, targetPose, waterRiseM, showEvacRoute, paused, externalPaused, reduced]);

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!allowDragOrbit || event.button !== 0) return;
    if (event.target instanceof Element && event.target.closest("button")) return;
    dragStartRef.current = { x: event.clientX, startYaw: dragYawOffsetRef.current };
    setDragging(true);
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const active = dragStartRef.current;
    if (!active) return;
    const dx = event.clientX - active.x;
    dragYawOffsetRef.current = clampNumber(active.startYaw + dx * 0.28, -58, 58);
    wrapRef.current?.dispatchEvent(new CustomEvent("diorama-sync"));
  };

  const handlePointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!dragStartRef.current) return;
    dragStartRef.current = null;
    setDragging(false);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  if (webglFailed) {
    return (
      <div className={`${styles.dioramaViewport} ${className ?? ""}`} role="img" aria-label={ariaLabel}>
        <div className={styles.dioramaFallback}>
          <p>Pratinjau 3D memerlukan dukungan WebGL pada peramban.</p>
          <span>Data kontur 3D, bangunan 3D, dan simulasi banjir tetap tersedia penuh di Map Interaktif.</span>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={wrapRef}
      className={`${styles.dioramaViewport} ${allowDragOrbit ? styles.dioramaDraggable : ""} ${className ?? ""}`}
      data-dragging={dragging}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      <canvas ref={canvasRef} className={styles.dioramaCanvas} role="img" aria-label={ariaLabel} />

      <svg className={styles.dioramaOverlaySvg} aria-hidden="true">
        <path
          ref={routeCasingRef}
          fill="none"
          stroke="#ffffff"
          strokeWidth={6}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeOpacity={0.95}
        />
        <path
          ref={routeStrokeRef}
          fill="none"
          stroke="#15803d"
          strokeWidth={3.2}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray="7 5"
        />
      </svg>

      <div className={styles.dioramaPinsLayer} aria-hidden="true">
        {pins.map((pin) => (
          <div
            key={pin.id}
            ref={(el) => {
              if (el) pinElsRef.current.set(pin.id, el);
              else pinElsRef.current.delete(pin.id);
            }}
            className={styles.dioramaPin}
            data-active={Boolean(pin.active)}
          >
            <span className={styles.dioramaPinBadge}>{pin.badge}</span>
            <span className={styles.dioramaPinLabel}>{pin.label}</span>
          </div>
        ))}
      </div>

      {!hideControls && (
        <div className={styles.dioramaControlsBar}>
          {allowDragOrbit && (
            <span className={styles.dioramaOrbitHint}>
              <IconRotate360 size={13} aria-hidden="true" />
              Geser untuk putar 3D
            </span>
          )}
          <button
            type="button"
            className={styles.dioramaPauseBtn}
            aria-pressed={paused}
            aria-label={paused ? "Putar animasi maket 3D" : "Jeda animasi maket 3D"}
            onClick={() => setPaused((prev) => !prev)}
          >
            {paused ? <IconPlayerPlay size={13} aria-hidden="true" /> : <IconPlayerPause size={13} aria-hidden="true" />}
            <span>{paused ? "Putar 3D" : "Jeda 3D"}</span>
          </button>
        </div>
      )}
    </div>
  );
}
