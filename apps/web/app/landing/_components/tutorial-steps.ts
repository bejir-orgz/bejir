import type { DioramaCameraPose, DioramaLayerMode } from "./terrain-diorama-gl";

export type TutorialStepId = "search-region" | "layers-simulation" | "evacuation-route" | "overview-assistant";

export interface TutorialStep {
  id: TutorialStepId;
  number: string;
  pillLabel: string;
  title: string;
  summary: string;
  ctaLabel: string;
  ctaHref: string;
  mode: DioramaLayerMode;
  waterRiseM: number;
  showEvacRoute: boolean;
  pose: DioramaCameraPose;
  activePinId: string;
}

export const TUTORIAL_STEPS: readonly TutorialStep[] = [
  {
    id: "search-region",
    number: "01",
    pillLabel: "Dayeuhkolot, Kab. Bandung",
    title: "Cari wilayah di Jawa Barat",
    summary:
      "Ketik nama kabupaten atau kecamatan di kolom Cari daerah untuk langsung menuju batas wilayahnya dalam 3D.",
    ctaLabel: "Buka Map Interaktif",
    ctaHref: "/map",
    mode: "dem",
    waterRiseM: 0,
    showEvacRoute: false,
    pose: { yawDeg: -26, pitchDeg: 45, distance: 3.65, panX: 0.04, panZ: -0.02 },
    activePinId: "p1",
  },
  {
    id: "layers-simulation",
    number: "02",
    pillLabel: "Simulasi · Banjir DEM",
    title: "Nyalakan layer dan simulasi",
    summary:
      "Pilih tombol Layer atau Simulasi untuk memantau kerawanan dan menggeser tinggi genangan edukatif.",
    ctaLabel: "Coba simulasi di Map",
    ctaHref: "/map",
    mode: "flood-sim",
    waterRiseM: 4.2,
    showEvacRoute: false,
    pose: { yawDeg: 10, pitchDeg: 42, distance: 3.55, panX: -0.02, panZ: 0.04 },
    activePinId: "p2",
  },
  {
    id: "evacuation-route",
    number: "03",
    pillLabel: "Evakuasi Aman",
    title: "Temukan rute evakuasi aman",
    summary:
      "Klik titik pada peta untuk melihat jalur terdekat menuju fasilitas evakuasi di dataran lebih tinggi.",
    ctaLabel: "Cari titik evakuasi di Map",
    ctaHref: "/map",
    mode: "evacuation",
    waterRiseM: 3.6,
    showEvacRoute: true,
    pose: { yawDeg: 30, pitchDeg: 44, distance: 3.55, panX: -0.06, panZ: 0.05 },
    activePinId: "p3",
  },
  {
    id: "overview-assistant",
    number: "04",
    pillLabel: "Tanya Aji",
    title: "Cek ringkasan atau tanya Aji",
    summary:
      "Buka panel samping untuk membaca statistik wilayah atau bertanya langsung ke asisten AI Aji.",
    ctaLabel: "Buka halaman Analisis Wilayah",
    ctaHref: "/analisis",
    mode: "susceptibility",
    waterRiseM: 0,
    showEvacRoute: false,
    pose: { yawDeg: -16, pitchDeg: 45, distance: 3.85, panX: -0.18, panZ: 0.02 },
    activePinId: "p2",
  },
] as const;

export function clampTutorialStepIndex(index: number): number {
  if (!Number.isFinite(index)) return 0;
  const rounded = Math.trunc(index);
  return Math.min(TUTORIAL_STEPS.length - 1, Math.max(0, rounded));
}

export function getTutorialStepIndexFromProgress(progress: number): number {
  if (!Number.isFinite(progress) || progress <= 0) return 0;
  if (progress >= 1) return TUTORIAL_STEPS.length - 1;
  return clampTutorialStepIndex(Math.floor(progress * TUTORIAL_STEPS.length));
}

export function getTutorialStepScrollTarget(stepIndex: number): number {
  const clamped = clampTutorialStepIndex(stepIndex);
  return (clamped + 0.5) / TUTORIAL_STEPS.length;
}
