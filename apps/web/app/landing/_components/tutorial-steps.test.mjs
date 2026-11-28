import test from "node:test";
import assert from "node:assert/strict";
import "../../../lib/api/test-setup.mjs";

const tutorialMod = await import("./tutorial-steps.ts");

const validModes = new Set(["susceptibility", "flood-sim", "rivers", "rainfall", "dem", "evacuation"]);

test("TUTORIAL_STEPS defines 4 concise interactive 3D walkthrough steps with valid routes and poses", () => {
  assert.equal(tutorialMod.TUTORIAL_STEPS.length, 4);
  tutorialMod.TUTORIAL_STEPS.forEach((step, idx) => {
    assert.equal(step.number, `0${idx + 1}`);
    assert.ok(step.ctaHref.startsWith("/"), `expected internal route, got ${step.ctaHref}`);
    assert.ok(validModes.has(step.mode), `unexpected 3D diorama mode: ${step.mode}`);
    assert.ok(step.waterRiseM >= 0 && step.waterRiseM <= 6);
    assert.ok(step.pose.distance > 2 && step.pose.distance < 6);
    assert.ok(step.summary.length <= 125, `expected concise summary <= 125 chars, got ${step.summary.length}`);
  });
  assert.equal(tutorialMod.TUTORIAL_STEPS[2].showEvacRoute, true);
});

test("clampTutorialStepIndex clamps out-of-range and invalid indices cleanly", () => {
  assert.equal(tutorialMod.clampTutorialStepIndex(-3), 0);
  assert.equal(tutorialMod.clampTutorialStepIndex(0), 0);
  assert.equal(tutorialMod.clampTutorialStepIndex(2.9), 2);
  assert.equal(tutorialMod.clampTutorialStepIndex(3), 3);
  assert.equal(tutorialMod.clampTutorialStepIndex(99), 3);
  assert.equal(tutorialMod.clampTutorialStepIndex(Number.NaN), 0);
});

test("getTutorialStepIndexFromProgress advances monotonically and aligns with step scroll targets", () => {
  let prev = 0;
  for (let p = 0; p <= 1; p += 0.05) {
    const next = tutorialMod.getTutorialStepIndexFromProgress(p);
    assert.ok(next >= prev, `expected monotonic non-decreasing index at progress=${p}, got ${next} after ${prev}`);
    prev = next;
  }
  assert.equal(prev, 3);
  assert.equal(tutorialMod.getTutorialStepIndexFromProgress(-0.5), 0);
  assert.equal(tutorialMod.getTutorialStepIndexFromProgress(1.5), 3);

  for (let i = 0; i < tutorialMod.TUTORIAL_STEPS.length; i += 1) {
    const target = tutorialMod.getTutorialStepScrollTarget(i);
    assert.equal(tutorialMod.getTutorialStepIndexFromProgress(target), i);
  }
});
