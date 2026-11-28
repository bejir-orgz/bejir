"use client";

import Link from "next/link";
import { IconArrowUpRight } from "@tabler/icons-react";
import { useRegionSelection } from "@/features/regions/region-selection";
import { AnimatedNumber, MotionDataBar, MotionReveal } from "./landing-motion";
import { topFloodRegions } from "./flood-data";
import styles from "./landing.module.css";

function normalizeName(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

export function InteractiveFloodRanking() {
  const { tree, toMapIds } = useRegionSelection();
  const regencies = tree[0]?.children ?? [];

  function resolveMapHref(regionName: string, shortName: string) {
    const targetFull = normalizeName(regionName);
    const targetShort = normalizeName(`kabupaten ${shortName}`);
    const match = regencies.find((node) => {
      const candidate = normalizeName(node.name);
      return candidate === targetFull || candidate === targetShort || candidate === normalizeName(shortName);
    });
    const mapId = match ? toMapIds([match.id])[0] : undefined;
    return mapId ? `/map?region=${encodeURIComponent(mapId)}` : "/map";
  }

  return (
    <ol className={styles.regionList} role="list" aria-label="Peringkat kejadian banjir">
      {topFloodRegions.map((region, i) => {
        const href = resolveMapHref(region.name, region.shortName);
        return (
          <MotionReveal as="li" key={region.code} delay={i * 0.05}>
            <Link
              href={href}
              className={styles.regionLink}
              aria-label={`${region.name}, ${region.count} kejadian banjir. Buka wilayah ini di Map Interaktif`}
            >
              <span className={styles.regionRank} aria-hidden="true">{i + 1}</span>
              <span className={styles.regionName}>
                {region.name}
                <span className={styles.regionJump}>
                  Buka peta <IconArrowUpRight size={13} aria-hidden="true" />
                </span>
              </span>
              <strong className={styles.regionCount}>
                <AnimatedNumber value={region.count} delay={i * 0.05} />
                <small>kejadian</small>
              </strong>
              <div className={styles.regionBar} aria-hidden="true">
                <div style={{ width: `${(region.count / topFloodRegions[0].count) * 100}%` }}>
                  <MotionDataBar />
                </div>
              </div>
            </Link>
          </MotionReveal>
        );
      })}
    </ol>
  );
}
