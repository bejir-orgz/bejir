"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { AnimatePresence, useReducedMotion } from "framer-motion";
import * as m from "framer-motion/m";
import {
  IconBrandGithubCopilot,
  IconCalendarWeek,
  IconLayoutSidebarRightCollapse,
  IconListDetails,
  IconMap,
  IconMapPin,
  IconPlayerPause,
  IconPlayerPlay,
  IconRipple,
  IconRotate360,
  IconRoute,
  IconSearch,
  IconShieldCheck,
  IconStackFront,
} from "@tabler/icons-react";
import { TerrainDioramaCanvas, type DioramaCalloutPin } from "./terrain-diorama-canvas";
import type { DioramaCameraPose } from "./terrain-diorama-gl";
import { TUTORIAL_STEPS, clampTutorialStepIndex } from "./tutorial-steps";
import styles from "./landing.module.css";

const easeOutStrong = [0.23, 1, 0.32, 1] as const;

const mapToolbarPills = [
  { id: "daerah", label: "Daerah", icon: IconMap },
  { id: "timeline", label: "Timeline", icon: IconCalendarWeek },
  { id: "legenda", label: "Legenda", icon: IconListDetails },
  { id: "simulasi", label: "Simulasi", icon: IconRipple },
  { id: "layer", label: "Layer", icon: IconStackFront },
] as const;

export function TutorialStagePreview({
  activeStep,
  onSelectStep,
  scrollNudgeDeg = 0,
}: {
  activeStep: number;
  onSelectStep: (idx: number) => void;
  scrollNudgeDeg?: number;
}) {
  const reduced = useReducedMotion();
  const [userPaused, setUserPaused] = useState(false);
  const [simWaterM, setSimWaterM] = useState(4.2);

  const stepIndex = clampTutorialStepIndex(activeStep);
  const step = TUTORIAL_STEPS[stepIndex];
  const animate = !reduced && !userPaused;

  const targetPose = useMemo<DioramaCameraPose>(
    () => ({
      ...step.pose,
      yawDeg: step.pose.yawDeg + scrollNudgeDeg,
    }),
    [step.pose, scrollNudgeDeg],
  );

  const activeWaterRiseM = stepIndex === 1 ? simWaterM : step.waterRiseM;

  const pins = useMemo<DioramaCalloutPin[]>(
    () => [
      { id: "p1", badge: "01", label: "Hulu · 1.870 mdpl", anchor: "upstream", active: step.activePinId === "p1" },
      { id: "p2", badge: "02", label: "Cekungan · 660 mdpl", anchor: "basin", active: step.activePinId === "p2" },
      { id: "p3", badge: "03", label: "Evakuasi · 810 mdpl", anchor: "evacSafe", active: step.activePinId === "p3" },
    ],
    [step.activePinId],
  );

  const formattedWaterM = simWaterM.toFixed(1).replace(".", ",");

  return (
    <div
      className={styles.tutorialViewport}
      data-step={step.id}
      data-ambient={animate ? "running" : "paused"}
      role="region"
      aria-label={`Pratinjau 3D langkah ${step.number}: ${step.title}`}
    >
      {/* Miniature Header mirroring sibajawa.vercel.app/map */}
      <div className={styles.tutorialTopBar}>
        <div className={styles.tutorialBrandPill} aria-hidden="true">
          <Image
            src="/images/sibajawa-logo.svg"
            alt=""
            width={88}
            height={20}
            unoptimized
            className={styles.tutorialBrandLogo}
          />
        </div>

        <div className={styles.tutorialRouteTabs} aria-hidden="true">
          <span data-active={stepIndex < 3}>Map Interaktif</span>
          <span data-active={false}>Histori</span>
          <span data-active={stepIndex === 3}>Analisis</span>
        </div>

        <div
          className={styles.watershedStepPills}
          role="tablist"
          aria-label="Pilih langkah panduan 3D"
          onPointerDown={(e) => e.stopPropagation()}
        >
          {TUTORIAL_STEPS.map((item, idx) => (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={stepIndex === idx}
              className={styles.watershedStepPill}
              data-active={stepIndex === idx}
              onClick={() => onSelectStep(idx)}
            >
              {item.number}
            </button>
          ))}
        </div>
      </div>

      {/* Live WebGL 3D Workspace mirroring deployed /map controls */}
      <div className={styles.tutorialMapArea}>
        <TerrainDioramaCanvas
          mode={step.mode}
          targetPose={targetPose}
          waterRiseM={activeWaterRiseM}
          pins={pins}
          showEvacRoute={step.showEvacRoute}
          allowDragOrbit
          externalPaused={userPaused}
          hideControls
          ariaLabel={`Maket 3D WebGL langkah ${step.number}: ${step.title}`}
          className={styles.tutorialDioramaFill}
        />

        {/* Real /map Top Floating Tool Strip */}
        <div className={styles.tutorialMapHudTop} aria-hidden="true">
          <div className={styles.tutorialToolPills}>
            {mapToolbarPills.map(({ id, label, icon: Icon }) => {
              const isActive =
                (stepIndex === 0 && id === "daerah") ||
                (stepIndex === 1 && (id === "simulasi" || id === "layer")) ||
                (stepIndex === 2 && id === "legenda") ||
                (stepIndex === 3 && id === "layer");
              return (
                <span key={id} className={styles.tutorialToolPill} data-active={isActive}>
                  <Icon size={12} />
                  <span>{label}</span>
                </span>
              );
            })}
          </div>

          <span className={styles.tutorialDrawerToggle} data-active={stepIndex === 3}>
            <IconLayoutSidebarRightCollapse size={14} />
          </span>
        </div>

        {/* Real Step-by-Step Floating Panels inside the 3D Map */}
        <AnimatePresence mode="wait">
          {stepIndex === 0 && (
            <m.div
              key="overlay-search"
              className={styles.tutorialSearchCard}
              onPointerDown={(e) => e.stopPropagation()}
              initial={animate ? { opacity: 0, transform: "translateY(8px)" } : false}
              animate={{ opacity: 1, transform: "translateY(0px)" }}
              exit={animate ? { opacity: 0, transform: "translateY(-6px)" } : { opacity: 0 }}
              transition={{ duration: 0.24, ease: easeOutStrong }}
            >
              <div className={styles.tutorialSearchInput}>
                <IconSearch size={13} className={styles.tutorialBlueIcon} aria-hidden="true" />
                <span>Kec. Dayeuhkolot</span>
                <span className={styles.tutorialCaret} aria-hidden="true" />
              </div>
              <div className={styles.tutorialSearchHit}>
                <strong>Kecamatan Dayeuhkolot</strong>
                <span>Kab. Bandung · 660 mdpl</span>
              </div>
            </m.div>
          )}

          {stepIndex === 1 && (
            <m.div
              key="overlay-sim"
              className={styles.tutorialSimCard}
              onPointerDown={(e) => e.stopPropagation()}
              initial={animate ? { opacity: 0, transform: "translateY(8px)" } : false}
              animate={{ opacity: 1, transform: "translateY(0px)" }}
              exit={animate ? { opacity: 0, transform: "translateY(-6px)" } : { opacity: 0 }}
              transition={{ duration: 0.24, ease: easeOutStrong }}
            >
              <div className={styles.tutorialSimHead}>
                <label htmlFor="tutorial-water-slider">Simulasi Banjir (DEM)</label>
                <strong>+{formattedWaterM} m</strong>
              </div>
              <input
                id="tutorial-water-slider"
                type="range"
                min={0}
                max={5.5}
                step={0.1}
                value={simWaterM}
                onChange={(e) => setSimWaterM(Number(e.target.value))}
                className={styles.tutorialSimRange}
                aria-label="Atur tinggi kenaikan muka air pada maket 3D"
              />
              <small>Simulasi Edukatif · Bukan Kondisi Aktual</small>
            </m.div>
          )}

          {stepIndex === 2 && (
            <m.div
              key="overlay-evac"
              className={styles.tutorialEvacCard}
              onPointerDown={(e) => e.stopPropagation()}
              initial={animate ? { opacity: 0, transform: "translateY(8px)" } : false}
              animate={{ opacity: 1, transform: "translateY(0px)" }}
              exit={animate ? { opacity: 0, transform: "translateY(-6px)" } : { opacity: 0 }}
              transition={{ duration: 0.24, ease: easeOutStrong }}
            >
              <div className={styles.tutorialEvacRow}>
                <span className={styles.tutorialEvacDotDanger}><IconMapPin size={12} aria-hidden="true" /></span>
                <span>Titik klik: Zona genangan</span>
              </div>
              <div className={styles.tutorialEvacRow}>
                <span className={styles.tutorialEvacDotSafe}><IconShieldCheck size={12} aria-hidden="true" /></span>
                <strong>Zona Aman · 810 mdpl</strong>
              </div>
              <div className={styles.tutorialEvacBadge}>
                <IconRoute size={12} aria-hidden="true" />
                <span>Rute evakuasi 3D ditampilkan</span>
              </div>
            </m.div>
          )}

          {stepIndex === 3 && (
            <m.div
              key="overlay-aji"
              className={styles.tutorialAjiDrawer}
              onPointerDown={(e) => e.stopPropagation()}
              initial={animate ? { opacity: 0, transform: "translateX(16px)" } : false}
              animate={{ opacity: 1, transform: "translateX(0px)" }}
              exit={animate ? { opacity: 0, transform: "translateX(12px)" } : { opacity: 0 }}
              transition={{ duration: 0.26, ease: easeOutStrong }}
            >
              <div className={styles.tutorialSegment} aria-hidden="true">
                <span>Overview</span>
                <span data-active="true">
                  <IconBrandGithubCopilot size={12} />
                  Aji
                </span>
              </div>
              <p className={styles.tutorialChatQ}>
                &ldquo;Daerah mana di Jawa Barat yang paling sering banjir?&rdquo;
              </p>
              <div className={styles.tutorialChatA}>
                <p>Catatan BNPB 2024: Kab. Karawang (19), Bogor (18), dan Bandung (14 kejadian).</p>
                <div className={styles.tutorialSourceChips}>
                  <span>BNPB 2024</span>
                  <span>AHP 627 Kec.</span>
                </div>
              </div>
            </m.div>
          )}
        </AnimatePresence>

        {/* Bottom Controls mirroring /map Terrain·3D + Jeda 3D */}
        <div className={styles.tutorialBottomBar}>
          <span className={styles.tutorialStepCaption}>
            <IconRotate360 size={12} aria-hidden="true" />
            <span>Geser putar 3D</span>
          </span>
          <div className={styles.tutorialBottomRight}>
            <span className={styles.tutorialModeChip} aria-hidden="true">Terrain · 3D</span>
            {!reduced && (
              <button
                type="button"
                className={styles.tutorialPauseBtn}
                aria-pressed={userPaused}
                aria-label={userPaused ? "Putar animasi maket 3D" : "Jeda animasi maket 3D"}
                onClick={() => setUserPaused((prev) => !prev)}
              >
                {userPaused ? <IconPlayerPlay size={12} aria-hidden="true" /> : <IconPlayerPause size={12} aria-hidden="true" />}
                <span>{userPaused ? "Putar 3D" : "Jeda 3D"}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
