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

function buildScaledBodyweightTrace(bodyWeightKg) {
  const samples = []
  const trough = bodyWeightKg * 0.72
  const peak = bodyWeightKg * 1.22
  let elapsedMs = 0

  segment(samples, elapsedMs, elapsedMs + 1800, 2, 2, 40)
  elapsedMs += 1800

  segment(samples, elapsedMs, elapsedMs + 1250, 2, peak, 40)
  segment(samples, elapsedMs + 1250, elapsedMs + 2250, peak, trough, 40)
  elapsedMs += 2250

  for (let index = 0; index < 2; index += 1) {
    segment(samples, elapsedMs, elapsedMs + 1300, trough, peak, 40)
    segment(samples, elapsedMs + 1300, elapsedMs + 2350, peak, trough, 40)
    elapsedMs += 2350
  }

  segment(samples, elapsedMs, elapsedMs + 1300, trough, peak, 40)
  segment(samples, elapsedMs + 1300, elapsedMs + 2500, peak, 2, 40)

  return samples
}

function buildLongUnloadedTraceWithDismount() {
  const samples = [{ elapsedMs: 0, current: -3.5, unit: "kg" }]

  segment(samples, 40, 12000, 1.8, 1.8, 40)
  segment(samples, 12000, 13400, 1.8, 101, 40)
  segment(samples, 13400, 14800, 101, 65, 40)
  segment(samples, 14800, 16200, 65, 108, 40)
  segment(samples, 16200, 17600, 108, 65, 40)
  segment(samples, 17600, 19500, 65, 99, 40)
  segment(samples, 19500, 21100, 99, 65, 40)
  segment(samples, 21100, 22200, 65, 95, 40)
  segment(samples, 22200, 23400, 95, 2, 40)

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
    assert.equal(result.reps[0].detectionType, "forceCycle")
    assert.equal(result.reps[0].strictPullupVerified, false)
    assert.equal(result.reps[0].forceTroughAtMs, result.reps[0].startedAtMs)
    assert.ok(result.reps[0].forcePeakAtMs > result.reps[0].forceTroughAtMs)
    assert.ok(result.reps[0].positiveImpulseS > 0)
    assert.ok(result.reps[0].negativeImpulseS > 0)
    assert.ok(result.reps[0].impulseBalance >= 0)
    assert.ok(result.reps[0].impulseBalance <= 1)
    assert.ok(result.reps[0].maxLoadRatio > 1)
    assert.ok(result.reps[0].minLoadRatio < result.reps[0].maxLoadRatio)
  })

  it("matches offline detection with incremental updates", () => {
    const samples = buildSevenRepTrace()
    const offline = detectPullups(samples)
    const detector = new PullupDetector()
    const detected = []

    assert.equal(detector.snapshot().forcePhase, "idle")
    assert.equal("phase" in detector.snapshot(), false)

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

  it("scales rep thresholds for light and heavy climbers", () => {
    for (const bodyWeightKg of [50, 100]) {
      const result = detectPullups(buildScaledBodyweightTrace(bodyWeightKg))

      assert.equal(result.repCount, 4)
      assert.ok(result.bodyWeightKg > bodyWeightKg * 0.85)
      assert.ok(result.bodyWeightKg < bodyWeightKg * 1.15)
      assert.equal(
        result.reps.every((rep) => rep.maxLoadRatio === null || rep.maxLoadRatio > 1),
        true,
      )
      assert.equal(
        result.reps.every((rep) => rep.positiveImpulseS > 0 && rep.negativeImpulseS > 0),
        true,
      )
    }
  })

  it("ignores low-load distribution noise in balance diagnostics", () => {
    const samples = buildScaledBodyweightTrace(75).map((sample) => {
      const noisyUnloaded = sample.current < 15
      const zoneForce = noisyUnloaded ? 20 : sample.current / 3

      return {
        ...sample,
        distribution: noisyUnloaded
          ? {
              left: { current: zoneForce, unit: "kg" },
              center: { current: 0, unit: "kg" },
              right: { current: -zoneForce, unit: "kg" },
            }
          : {
              left: { current: zoneForce, unit: "kg" },
              center: { current: zoneForce, unit: "kg" },
              right: { current: zoneForce, unit: "kg" },
            },
      }
    })

    const result = detectPullups(samples)

    assert.equal(result.repCount, 4)
    assert.equal(
      result.reps.every((rep) => rep.maxAbsLeftRightBalance != null && rep.maxAbsLeftRightBalance < 0.05),
      true,
    )
  })

  it("does not let unloaded tare noise start a long false rep", () => {
    const result = detectPullups(buildLongUnloadedTraceWithDismount())

    assert.equal(result.repCount, 3)
    assert.ok(result.reps[0].startedAtMs > 11000)
    assert.equal(
      result.reps.some((rep) => rep.completedBy === "unloaded"),
      false,
    )
  })
})
