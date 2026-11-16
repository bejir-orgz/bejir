export const landCoverColors: Record<string, string> = {
  "Badan Air": "#2563eb", "Hutan Lahan Kering Primer": "#166534", "Hutan Lahan Kering Sekunder": "#15803d",
  "Hutan Tanaman": "#65a30d", Pemukiman: "#ef4444", Perkebunan: "#a16207", "Pertanian Lahan Kering": "#eab308",
  "Pertanian Lahan Kering Campur": "#d97706", Sawah: "#84cc16", Tambak: "#06b6d4", "Tanah Terbuka": "#a8a29e",
};

export function landCoverColor(label: string | null): string {
  return landCoverColors[label || ""] || "#a3a3a3";
}

export function landCoverTagStyle(label: string) {
  const backgroundColor = landCoverColor(label);
  const channels = [1, 3, 5].map((offset) => parseInt(backgroundColor.slice(offset, offset + 2), 16) / 255)
    .map((value) => value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4);
  const luminance = channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
  return { backgroundColor, color: luminance > 0.179 ? "#000000" : "#ffffff" };
}
