/** Approximate initial viewing extent, not an administrative boundary or analysis area. */
const bounds: [[number, number], [number, number]] = [[-8.05, 106.35], [-5.85, 108.85]];
const [[south, west], [north, east]] = bounds;
const panMargin = 4;
const panBounds: typeof bounds = [
  [south - panMargin, west - panMargin],
  [north + panMargin, east + panMargin],
];

export const westJavaBasemap = {
  bounds,
  panBounds,
  tileUrl: "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  minZoom: 5,
  maxZoom: 19,
};
