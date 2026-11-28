"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { IconArrowUpRight } from "@tabler/icons-react";
import { useReducedMotion } from "framer-motion";
import { TutorialStagePreview } from "./tutorial-stage-preview";
import {
  TUTORIAL_STEPS,
  getTutorialStepIndexFromProgress,
  getTutorialStepScrollTarget,
} from "./tutorial-steps";
import styles from "./landing.module.css";

export function WatershedScrollStage() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [scrollNudgeDeg, setScrollNudgeDeg] = useState(0);
  const sectionRef = useRef<HTMLElement>(null);
  const manualLockUntilRef = useRef(0);
  const reduced = useReducedMotion();

  useEffect(() => {
    let raf = 0;

    const syncFromScroll = () => {
      raf = 0;
      const sec = sectionRef.current;
      if (!sec || window.innerWidth < 1000) return;

      const travel = sec.offsetHeight - window.innerHeight;
      if (travel <= 1) return;

      const rect = sec.getBoundingClientRect();
      const progress = Math.min(1, Math.max(0, -rect.top / travel));

      if (!reduced) {
        setScrollNudgeDeg((progress - 0.5) * 8);
      }

      if (performance.now() < manualLockUntilRef.current) return;

      const nextIdx = getTutorialStepIndexFromProgress(progress);
      setActiveIndex((prev) => (prev === nextIdx ? prev : nextIdx));
    };

    const onScroll = () => {
      if (raf !== 0) return;
      raf = window.requestAnimationFrame(syncFromScroll);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    onScroll();

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf !== 0) window.cancelAnimationFrame(raf);
    };
  }, [reduced]);

  const activeStep = TUTORIAL_STEPS[activeIndex] ?? TUTORIAL_STEPS[0];

  const selectStep = (idx: number) => {
    manualLockUntilRef.current = performance.now() + 700;
    setActiveIndex(idx);

    const sec = sectionRef.current;
    if (sec && window.innerWidth >= 1000 && !reduced) {
      const travel = sec.offsetHeight - window.innerHeight;
      if (travel > 1) {
        const trackTop = sec.getBoundingClientRect().top + window.scrollY;
        const targetY = trackTop + getTutorialStepScrollTarget(idx) * travel;
        window.scrollTo({ top: targetY, behavior: "smooth" });
      }
    }
  };

  return (
    <section ref={sectionRef} id="cara-kerja" className={styles.watershedTrack}>
      <div className={styles.watershedStickyFrame}>
        <div className={styles.watershedInner}>
          <div className={styles.watershedHeader}>
            <div>
              <p className={styles.watershedEyebrow}>PANDUAN SINGKAT</p>
              <h2>Cara pakai SIBAJAWA dalam 4 langkah</h2>
            </div>
            <p className={styles.watershedIntro}>
              Gulir atau klik tiap langkah untuk melihat langsung bagaimana peta 3D, simulasi banjir, rute evakuasi, dan Aji bekerja.
            </p>
          </div>

          <div className={styles.watershedGrid}>
            <div className={styles.watershedStageCol}>
              <div className={styles.watershedStageCard}>
                <TutorialStagePreview
                  activeStep={activeIndex}
                  onSelectStep={selectStep}
                  scrollNudgeDeg={reduced ? 0 : scrollNudgeDeg}
                />
              </div>
            </div>

            <ol className={styles.watershedStops} aria-label="Langkah panduan penggunaan SIBAJAWA">
              {TUTORIAL_STEPS.map((step, idx) => {
                const isActive = activeIndex === idx;
                return (
                  <li
                    key={step.id}
                    data-chapter-index={idx}
                    data-active={isActive}
                    className={styles.watershedStop}
                  >
                    <button
                      type="button"
                      className={styles.watershedStopButton}
                      aria-current={isActive ? "step" : undefined}
                      onClick={() => selectStep(idx)}
                    >
                      <span className={styles.watershedStopNum}>{step.number}</span>
                      <div>
                        <h3>{step.title}</h3>
                        <p>{step.summary}</p>
                      </div>
                    </button>
                  </li>
                );
              })}

              <li className={styles.watershedFooterCta}>
                <Link href={activeStep.ctaHref} className={styles.textLink}>
                  {activeStep.ctaLabel} <IconArrowUpRight size={17} aria-hidden="true" />
                </Link>
              </li>
            </ol>
          </div>
        </div>
      </div>
    </section>
  );
}
