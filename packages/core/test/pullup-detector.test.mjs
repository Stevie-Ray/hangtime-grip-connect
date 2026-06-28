import assert from "node:assert/strict"
import { describe, it } from "node:test"

import { detectPullups, PullupDetector } from "../dist/analysis/pullup-detector.js"

function segment(points, startMs, endMs, startForce, endForce, stepMs = 40) {
  const duration = Math.max(stepMs, endMs - startMs)
  for (let elapsedMs = startMs; elapsedMs <= endMs; elapsedMs += stepMs) {
    const progress = Math.min(1, Math.max(0, (elapsedMs - startMs) / duration))
    const eased = 0.5 - Math.cos(progress * Math.PI) / 2
    const ripple = Math.sin(elapsedMs / 57) * 0.8
    points.push({ elapsedMs, current: startForce + (endForce - startForce) * eased + ripple, unit: "kg" })
  }
}

function buildSevenRepTrace() {
  const samples = []
  segment(samples, 0, 2800, 2, 2, 40)
  segment(samples, 2800, 4200, 2, 103, 40)
  segment(samples, 4200, 5220, 103, 56, 40)
  segment(samples, 5220, 6350, 56, 113, 40)
  segment(samples, 6350, 7030, 113, 49, 40)
  segment(samples, 7030, 8200, 49, 112, 40)
  segment(samples, 8200, 9140, 112, 59, 40)
  segment(samples, 9140, 11030, 59, 100, 40)
  segment(samples, 11030, 12200, 100, 62, 40)
  segment(samples, 12200, 13700, 62, 110, 40)
  segment(samples, 13700, 14730, 110, 65, 40)
  segment(samples, 14730, 16200, 65, 105, 40)
  segment(samples, 16200, 17470, 105, 68, 40)
  segment(samples, 17470, 18720, 68, 118, 40)
  segment(samples, 18720, 20120, 118, 54, 40)
  segment(samples, 20120, 21840, 54, 2, 40)
  return samples
}

function buildThreeRepTraceWithDismountSpike() {
  const samples = []
  segment(samples, 0, 1800, 2, 2, 40)
  segment(samples, 1800, 3400, 2, 100, 40)
  segment(samples, 3400, 4500, 100, 62, 40)
  segment(samples, 4500, 6100, 62, 106, 40)
  segment(samples, 6100, 7000, 106, 66, 40)
  segment(samples, 7000, 9100, 66, 98, 40)
  segment(samples, 9100, 10400, 98, 66, 40)
  segment(samples, 10400, 11200, 66, 95, 40)
  segment(samples, 11200, 12800, 95, 2, 40)
  segment(samples, 12800, 14000, 2, 2, 40)
  return samples
}

describe("pull-up detector", () => {
  it("detects a seven-rep Motherboard-style force cycle session", () => {
    const result = detectPullups(buildSevenRepTrace())

    assert.equal(result.repCount, 7)
    assert.deepEqual(
      result.reps.map((rep) => rep.index),
      [1, 2, 3, 4, 5, 6, 7],
    )
    assert.equal(result.reps[0].completedBy, "reversal")
    assert.ok(result.reps[0].peakForceKg > 95)
    assert.ok(result.reps[6].durationMs >= 700)
  })

  it("matches offline detection with incremental updates", () => {
    const samples = buildSevenRepTrace()
    const offline = detectPullups(samples)
    const detector = new PullupDetector()
    const detected = []

    for (const sample of samples) {
      const update = detector.update(sample)
      if (update.newRep) detected.push(update.newRep)
    }
    const final = detector.finalize()
    if (final.newRep) detected.push(final.newRep)

    assert.equal(detected.length, offline.repCount)
    assert.deepEqual(
      detected.map((rep) => rep.index),
      offline.reps.map((rep) => rep.index),
    )
  })

  it("accepts ForceMeasurement-shaped timestamp samples and converts force units", () => {
    const kgSamples = buildSevenRepTrace().map(({ elapsedMs, current }) => ({
      timestamp: 1_000_000 + elapsedMs,
      current: current * 2.2046226218,
      unit: "lbs",
      peak: current * 2.2046226218,
      mean: current * 2.2046226218,
      min: current * 2.2046226218,
    }))

    const result = detectPullups(kgSamples)

    assert.equal(result.repCount, 7)
    assert.ok(result.reps[0].peakForceKg > 95)
  })

  it("ignores small partial oscillations", () => {
    const samples = [
      ...buildSevenRepTrace().slice(0, 180),
      { elapsedMs: 21000, current: 2, unit: "kg" },
      { elapsedMs: 21040, current: 22, unit: "kg" },
      { elapsedMs: 21080, current: 17, unit: "kg" },
      { elapsedMs: 21120, current: 2, unit: "kg" },
    ]

    const result = detectPullups(samples)

    assert.ok(result.repCount < 7)
    assert.equal(
      result.reps.some((rep) => rep.peakForceKg < 50),
      false,
    )
  })

  it("does not count a post-set dismount force spike as another pull-up", () => {
    const result = detectPullups(buildThreeRepTraceWithDismountSpike())

    assert.equal(result.repCount, 3)
    assert.deepEqual(
      result.reps.map((rep) => rep.completedBy),
      ["reversal", "reversal", "reversal"],
    )
  })
})
