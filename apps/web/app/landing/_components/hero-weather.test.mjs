import test from "node:test";
import assert from "node:assert/strict";
import "../../../lib/api/test-setup.mjs";

const weatherMod = await import("./hero-weather.ts");

test("clampHeroProgress bounds progress cleanly to [0, 1]", () => {
  assert.equal(weatherMod.clampHeroProgress(-0.5), 0);
  assert.equal(weatherMod.clampHeroProgress(0), 0);
  assert.equal(weatherMod.clampHeroProgress(0.42), 0.42);
  assert.equal(weatherMod.clampHeroProgress(1.8), 1);
  assert.equal(weatherMod.clampHeroProgress(Number.NaN), 0);
});

test("getHeroWeatherPhaseIndex maps Cerah and Hujan & Pasang scroll bands", () => {
  assert.equal(weatherMod.getHeroWeatherPhaseIndex(0), 0);
  assert.equal(weatherMod.getHeroWeatherPhaseIndex(0.39), 0);
  assert.equal(weatherMod.getHeroWeatherPhaseIndex(0.4), 1);
  assert.equal(weatherMod.getHeroWeatherPhaseIndex(1), 1);
});

test("HERO_WEATHER_PHASES exposes 2 sequences whose scroll targets match their bands", () => {
  assert.equal(weatherMod.HERO_WEATHER_PHASES.length, 2);
  weatherMod.HERO_WEATHER_PHASES.forEach((phase, index) => {
    assert.equal(weatherMod.getHeroWeatherPhaseIndex(phase.scrollTarget), index);
  });
});
