import type { ForcePoint } from "./types.js"

export function toFixed(value: number, digits = 2): string {
  if (!Number.isFinite(value)) return "0.00"
  return value.toFixed(digits)
}

export function maxCurrent(points: ForcePoint[]): number {
  return points.reduce((max, point) => (point.current > max ? point.current : max), 0)
}

export function meanCurrent(points: ForcePoint[]): number {
  if (points.length === 0) return 0
  return points.reduce((sum, point) => sum + point.current, 0) / points.length
}
