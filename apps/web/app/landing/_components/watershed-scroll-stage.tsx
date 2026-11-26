"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { IconArrowUpRight } from "@tabler/icons-react";
import { useReducedMotion } from "framer-motion";
import { TerrainDioramaCanvas, type DioramaCalloutPin } from "./terrain-diorama-canvas";
import type { DioramaCameraPose, DioramaLayerMode } from "./terrain-diorama-gl";
import styles from "./landing.module.css";

interface WatershedChapter {
  id: string;
  number: string;
  tag: string;
  title: string;
  summary: string;
  detail: string;
  mode: DioramaLayerMode;
  waterRiseM: number;
  showEvacRoute: boolean;
  pose: DioramaCameraPose;
  activePinId: string;
}

const chapters: WatershedChapter[] = [
  {
    id: "hulu",
    number: "01",
    tag: "01 · HULU HUJAN & LERENG",
    title: "Curah hujan tinggi turun di pegunungan hulu",
    summary:
      "Intensitas hujan di kawasan perbukitan selatan dan utara (>3.400 mm/tahun) jatuh pada lereng vulkanik curam sebelum meluncur cepat menuju alur sungai.",
    detail: "Kontur DEM 30 m & kemiringan lereng membaca arah aliran permukaan.",
    mode: "rainfall",
    waterRiseM: 0,
    showEvacRoute: false,
    pose: { yawDeg: -32, pitchDeg: 45, distance: 3.75, panX: 0.08, panZ: -0.08 },
    activePinId: "p1",
  },
  {
    id: "cekungan",
    number: "02",
    tag: "02 · ALIRAN DAS & GENANGAN",
    title: "Limpasan sungai terkumpul di cekungan permukiman",
    summary:
      "Saat debit sungai melewati kapasitas saluran, cekungan aluvial berelevasi rendah (HAND tipis) menjadi titik pertama genangan yang mengelilingi blok bangunan.",
    detail: "Simulasi banjir DEM memodelkan tinggi genangan dan estimasi bangunan serta penduduk terpapar.",
    mode: "flood-sim",
    waterRiseM: 4.2,
    showEvacRoute: false,
    pose: { yawDeg: 10, pitchDeg: 42, distance: 3.65, panX: -0.04, panZ: 0.04 },
    activePinId: "p2",
  },
  {
    id: "evakuasi",
    number: "03",
    tag: "03 · TITIK & RUTE EVAKUASI AMAN",
    title: "Menemukan titik evakuasi kering di luar zona genangan",
    summary:
      "Dari titik klik di peta 3D, SIBAJAWA menyaring fasilitas kesehatan, pendidikan, dan ibadah yang berada di tanah lebih tinggi serta menggambar jalur panduan di atas bangunan 3D.",
    detail: "Rute berkendara dan pencarian Evakuasi Aman langsung tersedia pada halaman Map Interaktif.",
    mode: "evacuation",
    waterRiseM: 3.6,
    showEvacRoute: true,
    pose: { yawDeg: 32, pitchDeg: 44, distance: 3.55, panX: -0.10, panZ: 0.08 },
    activePinId: "p3",
  },
];

export function WatershedScrollStage() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [scrollNudgeDeg, setScrollNudgeDeg] = useState(0);
  const sectionRef = useRef<HTMLElement>(null);
  const stopRefs = useRef<(HTMLLIElement | null)[]>([]);
  const reduced = useReducedMotion();

  useEffect(() => {
    const items = stopRefs.current.filter((node): node is HTMLLIElement => node !== null);
    if (!items.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        let bestIdx = -1;
        let bestRatio = 0;
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const idx = Number(entry.target.getAttribute("data-chapter-index"));
          if (Number.isInteger(idx) && entry.intersectionRatio >= bestRatio) {
            bestRatio = entry.intersectionRatio;
            bestIdx = idx;
          }
        }
        if (bestIdx >= 0) setActiveIndex(bestIdx);
      },
      { rootMargin: "-32% 0px -38% 0px", threshold: [0.15, 0.4, 0.7] },
    );

    for (const item of items) observer.observe(item);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (reduced) {
      queueMicrotask(() => setScrollNudgeDeg(0));
      return;
    }
    let raf = 0;
    const onScroll = () => {
      if (raf !== 0) return;
      raf = window.requestAnimationFrame(() => {
        raf = 0;
        const sec = sectionRef.current;
        if (!sec) return;
        const rect = sec.getBoundingClientRect();
        const total = Math.max(1, rect.height - window.innerHeight * 0.4);
        const progress = Math.min(1, Math.max(0, -rect.top / total));
        setScrollNudgeDeg((progress - 0.5) * 10);
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (raf !== 0) window.cancelAnimationFrame(raf);
    };
  }, [reduced]);

  const activeChapter = chapters[activeIndex] ?? chapters[0];

  const pose = useMemo<DioramaCameraPose>(
    () => ({
      ...activeChapter.pose,
      yawDeg: activeChapter.pose.yawDeg + scrollNudgeDeg,
    }),
    [activeChapter, scrollNudgeDeg],
  );

  const pins = useMemo<DioramaCalloutPin[]>(
    () => [
      { id: "p1", badge: "01", label: "Hulu · 1.870 mdpl", anchor: "upstream", active: activeChapter.activePinId === "p1" },
      { id: "p2", badge: "02", label: "Cekungan · 660 mdpl", anchor: "basin", active: activeChapter.activePinId === "p2" },
      { id: "p3", badge: "03", label: "Evakuasi · 810 mdpl", anchor: "evacSafe", active: activeChapter.activePinId === "p3" },
    ],
    [activeChapter.activePinId],
  );

  const selectChapter = (idx: number) => {
    setActiveIndex(idx);
    const node = stopRefs.current[idx];
    if (node && window.innerWidth >= 1000) {
      node.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "center" });
    }
  };

  return (
    <section ref={sectionRef} id="tentang" className={`${styles.section} ${styles.watershedSection}`}>
      <div className={styles.watershedHeader}>
        <div>
          <p className={styles.watershedEyebrow}>ALUR HIDROLOGI JAWA BARAT</p>
          <h2>Menghubungkan hulu hujan, kemiringan lereng, dan aliran sungai</h2>
        </div>
        <p className={styles.watershedIntro}>
          Genangan di wilayah hilir jarang berdiri sendiri. Gulir tiga tahap di bawah ini untuk melihat bagaimana hujan hulu, kontur cekungan, bangunan, dan jalur evakuasi saling terhubung pada maket 3D Cekungan Bandung.
        </p>
      </div>

      <div className={styles.watershedGrid}>
        <div className={styles.watershedStickyCol}>
          <div className={styles.watershedStageCard}>
            <div className={styles.watershedStageBar}>
              <span className={styles.watershedStageLabel}>{activeChapter.tag}</span>
              <div className={styles.watershedStepPills} role="tablist" aria-label="Pilih tahap alur hidrologi 3D">
                {chapters.map((ch, idx) => (
                  <button
                    key={ch.id}
                    type="button"
                    role="tab"
                    aria-selected={activeIndex === idx}
                    className={styles.watershedStepPill}
                    data-active={activeIndex === idx}
                    onClick={() => selectChapter(idx)}
                  >
                    {ch.number}
                  </button>
                ))}
              </div>
            </div>

            <TerrainDioramaCanvas
              mode={activeChapter.mode}
              targetPose={pose}
              waterRiseM={activeChapter.waterRiseM}
              pins={pins}
              showEvacRoute={activeChapter.showEvacRoute}
              ariaLabel={`Maket 3D Cekungan Bandung tahap ${activeChapter.number}: ${activeChapter.title}`}
              className={styles.watershedDiorama}
            />
          </div>
        </div>

        <ol className={styles.watershedStops} aria-label="Tahap alur hidrologi dari hulu ke evakuasi">
          {chapters.map((chapter, idx) => {
            const isActive = activeIndex === idx;
            return (
              <li
                key={chapter.id}
                ref={(el) => {
                  stopRefs.current[idx] = el;
                }}
                data-chapter-index={idx}
                data-active={isActive}
                className={styles.watershedStop}
              >
                <button
                  type="button"
                  className={styles.watershedStopButton}
                  aria-current={isActive ? "step" : undefined}
                  onClick={() => setActiveIndex(idx)}
                >
                  <span className={styles.watershedStopTag}>{chapter.tag}</span>
                  <h3>{chapter.title}</h3>
                  <p>{chapter.summary}</p>
                  <small>{chapter.detail}</small>
                </button>
              </li>
            );
          })}

          <li className={styles.watershedFooterCta}>
            <Link href="/analisis" className={styles.textLink}>
              Buka halaman Analisis Wilayah <IconArrowUpRight size={18} aria-hidden="true" />
            </Link>
          </li>
        </ol>
      </div>
    </section>
  );
}
