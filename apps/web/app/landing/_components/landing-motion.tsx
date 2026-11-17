"use client";

import { useEffect, useRef, useSyncExternalStore, type ReactNode } from "react";
import { animate, domAnimation, LazyMotion, MotionConfig, useInView, useReducedMotion, useScroll } from "framer-motion";
import * as m from "framer-motion/m";

const formatter = new Intl.NumberFormat("id-ID");
const revealVariants = { hidden: { opacity: 0, y: 28 }, visible: { opacity: 1, y: 0 } };

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
  const Component = { div: m.div, article: m.article, li: m.li }[as];
  return <Component className={className} initial={{ opacity: 1, y: 0 }} animate="hidden" whileInView="visible" viewport={{ amount: 0.12 }} variants={revealVariants} transition={{ duration: 0.65, delay, ease: [0.22, 1, 0.36, 1] }} whileHover={as === "article" ? { y: -4 } : undefined} data-framer-reveal>{children}</Component>;
}

export function MotionArtwork({ children, className }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { amount: 0.05 });
  const pageVisible = useSyncExternalStore(subscribeVisibility, getPageVisible, getServerVisible);
  const reduced = useReducedMotion();
  return <m.div ref={ref} className={className} data-ambient={inView && pageVisible && !reduced ? "running" : "paused"} data-hero-art aria-hidden="true">{children}</m.div>;
}

export function MotionDataBar() {
  return <m.span initial={{ scaleX: 1 }} animate={{ scaleX: 0 }} whileInView={{ scaleX: 1 }} viewport={{ amount: 0.5 }} transition={{ duration: 1.25, ease: [0.22, 1, 0.36, 1] }} style={{ originX: 0 }} data-motion-bar />;
}

export function MotionProgress() {
  const { scrollYProgress } = useScroll();
  const reduced = useReducedMotion();
  return reduced ? null : <m.div className="pointer-events-none fixed inset-x-0 top-0 z-[60] h-[3px] origin-left bg-blue-600" style={{ scaleX: scrollYProgress }} aria-hidden="true" />;
}

export function AnimatedNumber({ value, delay = 0 }: { value: number; delay?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { amount: 0.55 });
  const reduced = useReducedMotion();
  useEffect(() => {
    if (!inView || reduced) return;
    const element = ref.current;
    if (!element) return;
    element.textContent = "0";
    element.dataset.counterState = "running";
    const controls = animate(0, value, { duration: 1.4, delay, ease: "easeOut", onUpdate: (latest) => { element.textContent = formatter.format(Math.round(latest)); }, onComplete: () => { element.textContent = formatter.format(value); element.dataset.counterState = "settled"; } });
    return () => { controls.stop(); element.textContent = formatter.format(value); };
  }, [inView, reduced, value, delay]);
  return <><span className="sr-only">{formatter.format(value)}</span><span ref={ref} aria-hidden="true" data-count={value}>{formatter.format(value)}</span></>;
}
