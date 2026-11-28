export type HeroWeatherPhaseId = "cerah" | "hujan-pasang";

export interface HeroWeatherPhase {
  id: HeroWeatherPhaseId;
  label: string;
  scrollTarget: number;
}

export const HERO_WEATHER_PHASES: readonly HeroWeatherPhase[] = [
  { id: "cerah", label: "Cerah", scrollTarget: 0 },
  { id: "hujan-pasang", label: "Hujan & Pasang", scrollTarget: 0.96 },
] as const;

export function clampHeroProgress(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(1, Math.max(0, value));
}

export function getHeroWeatherPhaseIndex(progress: number): number {
  return clampHeroProgress(progress) < 0.4 ? 0 : 1;
}
