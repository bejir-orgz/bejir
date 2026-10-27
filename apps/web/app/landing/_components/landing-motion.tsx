"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { animate, domAnimation, LazyMotion, MotionConfig, useInView, useReducedMotion, useScroll, useSpring, useTransform } from "framer-motion";
import * as m from "framer-motion/m";

const formatter = new Intl.NumberFormat("id-ID");
const revealVariants = { hidden: { opacity: 0, y: 28 }, visible: { opacity: 1, y: 0 } };

export function LandingMotion({ children }: { children: ReactNode }) {
  return <MotionConfig reducedMotion="user"><LazyMotion features={domAnimation} strict>{children}</LazyMotion></MotionConfig>;
}

export function MotionReveal({ children, className, as = "div", delay = 0 }: { children: ReactNode; className?: string; as?: "div" | "article" | "li"; delay?: number }) {
  const Component = { div: m.div, article: m.article, li: m.li }[as];
  return <Component className={className} initial={{ opacity: 1, y: 0 }} animate="hidden" whileInView="visible" viewport={{ amount: 0.12 }} variants={revealVariants} transition={{ duration: 0.65, delay, ease: [0.22, 1, 0.36, 1] }} whileHover={as === "article" ? { y: -4 } : undefined} data-framer-reveal>{children}</Component>;
}

export function MotionMap({ children, className }: { children: ReactNode; className?: string }) {
  const reduced = useReducedMotion();
  const { scrollY } = useScroll();
  const offset = useTransform(scrollY, [0, 650], [0, 42]);
  const y = useSpring(offset, { stiffness: 120, damping: 28 });
  return <m.div className={`${className ?? ""} max-[760px]:!transform-none`} style={{ y: reduced ? 0 : y }} data-framer-map>{children}</m.div>;
}

export function MotionProgress() {
  const { scrollYProgress } = useScroll();
  const reduced = useReducedMotion();
  return reduced ? null : <m.div className="pointer-events-none fixed inset-x-0 top-0 z-[60] h-[3px] origin-left bg-blue-600" style={{ scaleX: scrollYProgress }} aria-hidden="true" />;
}

export function AnimatedNumber({ value }: { value: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.5 });
  const reduced = useReducedMotion();
  useEffect(() => {
    if (!inView || reduced) return;
    const element = ref.current;
    if (!element) return;
    const controls = animate(0, value, { duration: 1.1, ease: "easeOut", onUpdate: (latest) => { element.textContent = formatter.format(Math.round(latest)); } });
    return () => { controls.stop(); element.textContent = formatter.format(value); };
  }, [inView, reduced, value]);
  return <><span className="sr-only">{formatter.format(value)}</span><span ref={ref} aria-hidden="true" data-count={value}>{formatter.format(value)}</span></>;
}
