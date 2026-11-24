"use client";

import { useEffect, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import { animate, domAnimation, LazyMotion, MotionConfig, useInView, useReducedMotion, useScroll } from "framer-motion";
import * as m from "framer-motion/m";
import { IconPlayerPause, IconPlayerPlay } from "@tabler/icons-react";

const formatter = new Intl.NumberFormat("id-ID");

function subscribeVisibility(callback: () => void) {
  document.addEventListener("visibilitychange", callback);
  return () => document.removeEventListener("visibilitychange", callback);
}

function getPageVisible() { return !document.hidden; }
function getServerVisible() { return true; }

function subscribeScroll(callback: () => void) {
  window.addEventListener("scroll", callback, { passive: true });
  return () => window.removeEventListener("scroll", callback);
}

function getNavbarFloating() { return window.scrollY > 64; }
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

export function MotionArtwork({ children, className, controlClassName }: { children: ReactNode; className?: string; controlClassName?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { amount: 0.05 });
  const pageVisible = useSyncExternalStore(subscribeVisibility, getPageVisible, getServerVisible);
  const reduced = useReducedMotion();
  const [userPaused, setUserPaused] = useState(false);
  const running = inView && pageVisible && !reduced && !userPaused;

  return (
    <>
      <m.div ref={ref} className={className} data-ambient={running ? "running" : "paused"} data-hero-art aria-hidden="true">
        {children}
      </m.div>
      {!reduced && (
        <button
          type="button"
          className={controlClassName}
          aria-pressed={userPaused}
          aria-label={userPaused ? "Putar animasi lanskap" : "Jeda animasi lanskap"}
          onClick={() => setUserPaused((prev) => !prev)}
        >
          {userPaused ? <IconPlayerPlay size={14} aria-hidden="true" /> : <IconPlayerPause size={14} aria-hidden="true" />}
          <span>{userPaused ? "Putar arus" : "Jeda arus"}</span>
        </button>
      )}
    </>
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
  const reduced = useReducedMotion();
  return reduced ? null : <m.div className="pointer-events-none fixed inset-x-0 top-0 z-[60] h-[3px] origin-left bg-blue-600" style={{ scaleX: scrollYProgress }} aria-hidden="true" />;
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
