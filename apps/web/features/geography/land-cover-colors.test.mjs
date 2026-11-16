import test from "node:test";
import assert from "node:assert/strict";
import { landCoverColors, landCoverColor, landCoverTagStyle } from "./land-cover-colors.ts";

test("tags and polygons use one palette, including unknown classes", () => {
  for (const label of [...Object.keys(landCoverColors), "—"]) {
    const style = landCoverTagStyle(label);
    assert.equal(style.backgroundColor, landCoverColor(label));
    const channels = style.backgroundColor.slice(1).match(/../g).map((hex) => parseInt(hex, 16) / 255).map((v) => v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
    const luminance = channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
    const contrast = style.color === "#000000" ? (luminance + 0.05) / 0.05 : 1.05 / (luminance + 0.05);
    assert.ok(contrast >= 4.5, label);
  }
  assert.equal(landCoverColor("Pemukiman"), "#ef4444");
  assert.equal(landCoverColor(null), "#a3a3a3");
});
