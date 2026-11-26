"use client";

import { useEffect, useRef } from "react";
import { animate, useReducedMotion } from "framer-motion";
import { formatIndonesianNumber, parseIndonesianMetric } from "@/lib/metric-format";

export function AnimatedMetricValue({ value, className }: { value: string; className?: string }) {
  const reduced = useReducedMotion();
  const displayRef = useRef<HTMLSpanElement>(null);
  const previousNumeric = useRef<number | null>(null);

  useEffect(() => {
    const node = displayRef.current;
    if (!node) return;
    const parsed = parseIndonesianMetric(value);
    if (!parsed || reduced) {
      node.textContent = value;
      previousNumeric.current = parsed ? parsed.numeric : null;
      return;
    }

    const startValue = previousNumeric.current ?? 0;
    previousNumeric.current = parsed.numeric;
    if (startValue === parsed.numeric) {
      node.textContent = value;
      return;
    }

    const controls = animate(startValue, parsed.numeric, {
      duration: 0.45,
      ease: [0.23, 1, 0.32, 1],
      onUpdate: (latest) => {
        node.textContent = `${parsed.prefix}${formatIndonesianNumber(latest, parsed.decimals)}${parsed.suffix}`;
      },
      onComplete: () => {
        node.textContent = value;
      },
    });

    return () => {
      controls.stop();
    };
  }, [value, reduced]);

  return (
    <span className={className} style={{ fontVariantNumeric: "tabular-nums" }}>
      <span className="sr-only">{value}</span>
      <span ref={displayRef} aria-hidden="true">{value}</span>
    </span>
  );
}
