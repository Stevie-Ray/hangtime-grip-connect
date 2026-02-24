import type { ForceUnit } from "./types.js"

const KG_TO_NEWTON = 9.80665
const KG_TO_LBS = 2.2046226218
const LBS_TO_KG = 0.45359237
const LBS_TO_NEWTON = 4.4482216152605

export function toKg(force: number, unit: ForceUnit): number {
  if (unit === "kg") return force
  if (unit === "lbs") return force * LBS_TO_KG
  return force / KG_TO_NEWTON
}

export function fromKg(forceKg: number, unit: ForceUnit): number {
  if (unit === "kg") return forceKg
  if (unit === "lbs") return forceKg * KG_TO_LBS
  return forceKg * KG_TO_NEWTON
}

export function toNewtons(force: number, unit: ForceUnit): number {
  if (unit === "n") return force
  if (unit === "lbs") return force * LBS_TO_NEWTON
  return force * KG_TO_NEWTON
}

export function convertForce(value: number, from: ForceUnit, to: "kg" | "lbs"): number {
  if (to === "kg") {
    if (from === "kg") return value
    if (from === "lbs") return value * LBS_TO_KG
    return value / KG_TO_NEWTON
  }
  if (from === "lbs") return value
  if (from === "kg") return value * KG_TO_LBS
  return value / LBS_TO_NEWTON
}
