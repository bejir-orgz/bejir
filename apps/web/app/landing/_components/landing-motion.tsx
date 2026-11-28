"use client";

import { useEffect, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import {
  animate,
  domAnimation,
  LazyMotion,
  MotionConfig,
  useInView,
  useMotionValue,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
} from "framer-motion";
import * as m from "framer-motion/m";
import { IconArrowDown, IconPlayerPause, IconPlayerPlay } from "@tabler/icons-react";
import { HeroLandscape } from "./hero-landscape";
import { HERO_WEATHER_PHASES, getHeroWeatherPhaseIndex } from "./hero-weather";
import styles from "./landing.module.css";

const formatter = new Intl.NumberFormat("id-ID");

function subscribeVisibility(callback: () => void) {
  document.addEventListener("visibilitychange", callback);
  return () => document.removeEventListener("visibilitychange", callback);
}

function getPageVisible() { return !document.hidden; }
function getServerVisible() { return true; }

function subscribeScroll(callback: () => void) {
  window.addEventListener("scroll", callback, { passive: true });
  window.addEventListener("resize", callback, { passive: true });
  return () => {
    window.removeEventListener("scroll", callback);
    window.removeEventListener("resize", callback);
  };
}

function getNavbarFloating() {
  const track = document.getElementById("jelajahi");
  if (!track) return window.scrollY > 64;
  const stickyHeight = track.firstElementChild?.getBoundingClientRect().height ?? window.innerHeight;
  return track.getBoundingClientRect().bottom < stickyHeight - 64;
}
function getNavbarServerSnapshot() { return false; }

export function LandingNavbar({ children, className }: { children: ReactNode; className: string }) {
  const floating = useSyncExternalStore(subscribeScroll, getNavbarFloating, getNavbarServerSnapshot);
  return <div className={className} data-floating={floating}>{children}</div>;
}

export function LandingMotion({ children }: { children: ReactNode }) {
  return <MotionConfig reducedMotion="user"><LazyMotion features={domAnimation} strict>{children}</LazyMotion></MotionConfig>;
}

export function MotionReveal({ children, className, as = "div", delay = 0 }: { children: ReactNode; className?: string; as?: "div" | "article" | "li"; delay?: number }) {
  const reduced = useReducedMotion();
  const Component = { div: m.div, article: m.article, li: m.li }[as];
  if (reduced) {
    return <Component className={className} data-framer-reveal>{children}</Component>;
  }
  return (
    <Component
      className={className}
      initial={{ opacity: 0, transform: "translateY(16px)" }}
      whileInView={{ opacity: 1, transform: "translateY(0px)" }}
      viewport={{ once: true, amount: 0.01, margin: "120px 0px 120px 0px" }}
      transition={{ duration: 0.5, delay, ease: [0.23, 1, 0.32, 1] }}
      data-framer-reveal
    >
      {children}
    </Component>
  );
}

export function HeroWeatherStage({ children }: { children: ReactNode }) {
  const trackRef = useRef<HTMLElement>(null);
  const artRef = useRef<HTMLDivElement>(null);
  const inView = useInView(artRef, { amount: 0.05 });
  const pageVisible = useSyncExternalStore(subscribeVisibility, getPageVisible, getServerVisible);
  const reduced = useReducedMotion();
  const [userPaused, setUserPaused] = useState(false);
  const [phaseIndex, setPhaseIndex] = useState(0);
  const [cueDismissed, setCueDismissed] = useState(false);

  const { scrollYProgress } = useScroll({
    target: trackRef,
    offset: ["start start", "end end"],
  });
  const smoothScroll = useSpring(scrollYProgress, {
    stiffness: 170,
    damping: 28,
    mass: 0.35,
  });
  const manualProgress = useMotionValue(0);
  const activeProgress = reduced ? manualProgress : smoothScroll;
  const shoreTransform = useTransform(
    activeProgress,
    [0.15, 0.95],
    ["translateY(8px)", "translateY(-4px)"],
  );
  const scrollCueOpacity = useTransform(activeProgress, [0, 0.14], [1, 0]);
  const scrollCueTransform = useTransform(activeProgress, [0, 0.14], ["translateY(0px)", "translateY(8px)"]);

  useMotionValueEvent(activeProgress, "change", (latest) => {
    const next = getHeroWeatherPhaseIndex(latest);
    setPhaseIndex((prev) => (prev === next ? prev : next));
    const dismissed = latest > 0.14;
    setCueDismissed((prev) => (prev === dismissed ? prev : dismissed));
  });

  const running = inView && pageVisible && !reduced && !userPaused;
  const activePhase = HERO_WEATHER_PHASES[phaseIndex] ?? HERO_WEATHER_PHASES[0];

  const selectPhase = (index: number) => {
    const targetPhase = HERO_WEATHER_PHASES[index];
    if (!targetPhase) return;
    if (reduced) {
      manualProgress.set(targetPhase.scrollTarget);
      setPhaseIndex(index);
      return;
    }
    const track = trackRef.current;
    if (!track) return;
    const rect = track.getBoundingClientRect();
    const trackTop = window.scrollY + rect.top;
    const maxScroll = Math.max(1, track.offsetHeight - window.innerHeight);
    window.scrollTo({
      top: trackTop + maxScroll * targetPhase.scrollTarget,
      behavior: "smooth",
    });
  };

  return (
    <section
      ref={trackRef}
      id="jelajahi"
      className={styles.heroScrollTrack}
      data-weather-phase={activePhase.id}
    >
      <div className={styles.heroSticky}>
        <m.div
          ref={artRef}
          className={styles.heroArt}
          data-ambient={running ? "running" : "paused"}
          data-hero-art
          aria-hidden="true"
        >
          <HeroLandscape progress={activeProgress} />
        </m.div>

        {children}

        <div className={styles.heroControlsCluster} data-ambient={running ? "running" : "paused"}>
          <m.button
            type="button"
            className={styles.heroScrollCue}
            data-dismissed={cueDismissed}
            style={{ opacity: scrollCueOpacity, transform: scrollCueTransform }}
            tabIndex={cueDismissed ? -1 : 0}
            aria-hidden={cueDismissed}
            aria-label="Gulir untuk melihat hujan dan air pasang"
            onClick={() => selectPhase(1)}
          >
            <IconArrowDown size={14} className={styles.heroScrollCueIcon} aria-hidden="true" />
            <span>Gulir untuk hujan &amp; pasang</span>
          </m.button>

          <div className={styles.heroControlsRight}>
            <div className={styles.heroPhaseNav} role="group" aria-label="Tahap cuaca dan tinggi air ilustrasi">
              {HERO_WEATHER_PHASES.map((phase, idx) => (
                <button
                  key={phase.id}
                  type="button"
                  className={styles.heroPhaseBtn}
                  data-active={phaseIndex === idx}
                  aria-pressed={phaseIndex === idx}
                  onClick={() => selectPhase(idx)}
                >
                  {phase.label}
                </button>
              ))}
            </div>

            <button
              type="button"
              className={styles.heroAmbientToggle}
              aria-pressed={userPaused}
              aria-label={userPaused ? "Putar animasi lanskap" : "Jeda animasi lanskap"}
              onClick={() => setUserPaused((prev) => !prev)}
            >
              {userPaused ? <IconPlayerPlay size={14} aria-hidden="true" /> : <IconPlayerPause size={14} aria-hidden="true" />}
              <span>{userPaused ? "Putar arus" : "Jeda arus"}</span>
            </button>
          </div>
        </div>

        <m.svg
          className={styles.heroShore}
          viewBox="0 0 1440 120"
          preserveAspectRatio="none"
          aria-hidden="true"
          style={{ transform: shoreTransform }}
        >
          <path d="M0 60C220 118 390 18 680 65S1180 110 1440 42V120H0Z" fill="#bde6ff" />
          <path d="M0 82C220 125 420 48 710 85S1190 105 1440 65V120H0Z" fill="#eaf4ff" />
        </m.svg>
      </div>
    </section>
  );
}

export function MotionDataBar() {
  const reduced = useReducedMotion();
  if (reduced) {
    return <span style={{ transform: "scaleX(1)", transformOrigin: "left" }} data-motion-bar />;
  }
  return (
    <m.span
      initial={{ transform: "scaleX(0)" }}
      whileInView={{ transform: "scaleX(1)" }}
      viewport={{ once: true, amount: 0.25 }}
      transition={{ duration: 0.85, ease: [0.23, 1, 0.32, 1] }}
      style={{ transformOrigin: "left" }}
      data-motion-bar
    />
  );
}

export function MotionProgress() {
  const { scrollYProgress } = useScroll();
  return <m.div className="pointer-events-none fixed inset-x-0 top-0 z-[60] h-[3px] origin-left bg-blue-600 motion-reduce:hidden" style={{ scaleX: scrollYProgress }} aria-hidden="true" />;
}

export function AnimatedNumber({ value, delay = 0 }: { value: number; delay?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.35 });
  const reduced = useReducedMotion();
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    if (reduced) {
      element.textContent = formatter.format(value);
      return;
    }
    if (!inView) return;
    element.textContent = "0";
    element.dataset.counterState = "running";
    const controls = animate(0, value, {
      duration: 1.1,
      delay,
      ease: [0.23, 1, 0.32, 1],
      onUpdate: (latest) => { element.textContent = formatter.format(Math.round(latest)); },
      onComplete: () => { element.textContent = formatter.format(value); element.dataset.counterState = "settled"; },
    });
    return () => {
      controls.stop();
      element.textContent = formatter.format(value);
    };
  }, [inView, reduced, value, delay]);
  return <><span className="sr-only">{formatter.format(value)}</span><span ref={ref} aria-hidden="true" data-count={value}>{formatter.format(value)}</span></>;
}
