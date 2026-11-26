export type MapEngineMode = "3d-natural" | "3d-satellite" | "2d-classic";

let cachedWebGLSupport: boolean | null = null;

/** Checks WebGL availability once on the client so devices without GPU fall back cleanly to 2D Leaflet. */
export function supportsWebGL(): boolean {
  if (typeof window === "undefined") return false;
  if (cachedWebGLSupport !== null) return cachedWebGLSupport;
  try {
    const canvas = document.createElement("canvas");
    const gl = canvas.getContext("webgl2") || canvas.getContext("webgl");
    cachedWebGLSupport = Boolean(gl);
  } catch {
    cachedWebGLSupport = false;
  }
  return cachedWebGLSupport;
}
