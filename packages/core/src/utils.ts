import type { ForceMeasurement, ForceUnit } from "./interfaces/callback.interface.js"

/** 1 kgf = this many N (standard gravity) */
const KG_TO_N = 9.80665
/** 1 lbf = this many N */
const LBS_TO_N = 4.4482216152605

function toNewtons(value: number, from: ForceUnit): number {
  switch (from) {
    case "kg":
      return value * KG_TO_N
    case "lbs":
      return value * LBS_TO_N
    case "n":
      return value
  }
}

function fromNewtons(value: number, to: ForceUnit): number {
  switch (to) {
    case "kg":
      return value / KG_TO_N
    case "lbs":
      return value / LBS_TO_N
    case "n":
      return value
  }
}

/**
 * Converts a force value between kg, lbs, and newtons.
 * @param value - The numeric force value in the source unit.
 * @param from - The unit of the input value.
 * @param to - The unit for the output value.
 * @returns The force value in the target unit.
 */
export function convertForce(value: number, from: ForceUnit, to: ForceUnit): number {
  if (from === to) return value
  return fromNewtons(toNewtons(value, from), to)
}

/**
 * Converts all numeric force fields in a ForceMeasurement from one unit to another.
 * Recurses one level into distribution.left / center / right.
 * Used internally by the device model when building notify payloads.
 */
export function convertForceMeasurement(
  measurement: ForceMeasurement,
  from: ForceUnit,
  to: ForceUnit,
): ForceMeasurement {
  if (from === to) return measurement
  const out: ForceMeasurement = {
    unit: to,
    timestamp: measurement.timestamp,
    current: convertForce(measurement.current, from, to),
    peak: convertForce(measurement.peak, from, to),
    mean: convertForce(measurement.mean, from, to),
    min: convertForce(measurement.min, from, to),
  }
  if (measurement.performance !== undefined) {
    out.performance = { ...measurement.performance }
  }
  if (
    measurement.distribution &&
    (measurement.distribution.left !== undefined ||
      measurement.distribution.center !== undefined ||
      measurement.distribution.right !== undefined)
  ) {
    out.distribution = {}
    if (measurement.distribution.left !== undefined) {
      out.distribution.left = convertForceMeasurement(measurement.distribution.left, from, to)
    }
    if (measurement.distribution.center !== undefined) {
      out.distribution.center = convertForceMeasurement(measurement.distribution.center, from, to)
    }
    if (measurement.distribution.right !== undefined) {
      out.distribution.right = convertForceMeasurement(measurement.distribution.right, from, to)
    }
  }
  return out
}
