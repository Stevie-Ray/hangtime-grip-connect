import assert from "node:assert/strict"
import { describe, it } from "node:test"

import { convertForce, convertForceMeasurement } from "../dist/utils.js"
import { assertAlmostEqual } from "./helpers.mjs"

describe("force conversion utilities", () => {
  it("converts force values between kg, lbs, and newtons", () => {
    assertAlmostEqual(convertForce(1, "kg", "n"), 9.80665)
    assertAlmostEqual(convertForce(1, "lbs", "n"), 4.4482216152605)
    assertAlmostEqual(convertForce(9.80665, "n", "kg"), 1)
    assertAlmostEqual(convertForce(4.4482216152605, "n", "lbs"), 1)
    assertAlmostEqual(convertForce(10, "kg", "lbs"), 22.046226218487757)
  })

  it("returns the same value or measurement when units already match", () => {
    assert.equal(convertForce(12.5, "kg", "kg"), 12.5)

    const measurement = {
      unit: "kg",
      timestamp: 123,
      current: 1,
      peak: 2,
      mean: 1.5,
      min: 0.5,
    }

    assert.equal(convertForceMeasurement(measurement, "kg", "kg"), measurement)
  })

  it("converts nested force measurements while preserving metadata", () => {
    const measurement = {
      unit: "kg",
      timestamp: 123,
      current: 10,
      peak: 12,
      mean: 8,
      min: 2,
      performance: {
        packetIndex: 3,
        sampleIndex: 5,
        samplesPerPacket: 2,
        notifyIntervalMs: 20,
        samplingRateHz: 80,
      },
      distribution: {
        left: {
          unit: "kg",
          timestamp: 123,
          current: 4,
          peak: 6,
          mean: 3,
          min: 1,
        },
        right: {
          unit: "kg",
          timestamp: 123,
          current: 6,
          peak: 7,
          mean: 5,
          min: 2,
        },
      },
    }

    const converted = convertForceMeasurement(measurement, "kg", "n")

    assert.equal(converted.unit, "n")
    assert.equal(converted.timestamp, measurement.timestamp)
    assert.deepEqual(converted.performance, measurement.performance)
    assert.notEqual(converted.performance, measurement.performance)
    assertAlmostEqual(converted.current, 98.0665)
    assertAlmostEqual(converted.peak, 117.6798)
    assertAlmostEqual(converted.mean, 78.4532)
    assertAlmostEqual(converted.min, 19.6133)
    assertAlmostEqual(converted.distribution.left.current, 39.2266)
    assertAlmostEqual(converted.distribution.right.current, 58.8399)
  })
})
