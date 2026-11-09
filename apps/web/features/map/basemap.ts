/** Approximate initial viewing extent, not an administrative boundary or analysis area. */
export const westJavaBasemap = {
  bounds: [[-8.05, 106.35], [-5.85, 108.85]] as [[number, number], [number, number]],
  tileUrl: "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  minZoom: 5,
  maxZoom: 19,
};
