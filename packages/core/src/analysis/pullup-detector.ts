import type { ForceUnit } from "../interfaces/callback.interface.js"
import { convertForce } from "../utils.js"

export interface PullupDetectorSample {
  /** Force at this sample. ForceMeasurement.current is accepted structurally. */
  current: number
  /** Unit of current. Falls back to kg. */
  unit?: ForceUnit
  /** Milliseconds since session start. Preferred when available. */
  elapsedMs?: number
  /** Absolute timestamp in milliseconds. Used when elapsedMs is absent. */
  timestamp?: number
}

export interface PullupRep {
  index: number
  startedAtMs: number
  peakAtMs: number
  endedAtMs: number
  startForceKg: number
  peakForceKg: number
  endForceKg: number
  durationMs: number
  upSwingKg: number
  downSwingKg: number
  completedBy: "reversal" | "unloaded" | "finalize"
}

export interface PullupDetectorSnapshot {
  repCount: number
  reps: PullupRep[]
  phase: "idle" | "rising" | "falling"
  smoothedForceKg: number | null
}

export interface PullupDetectorUpdate extends PullupDetectorSnapshot {
  newRep: PullupRep | null
}

interface DetectorPoint {
  elapsedMs: number
  forceKg: number
}

type Direction = "rising" | "falling" | null

const DEFAULT_UNIT: ForceUnit = "kg"
const SMOOTHING_MS = 260
const REVERSAL_THRESHOLD_KG = 8
const MIN_UP_SWING_KG = 20
const MIN_DOWN_SWING_KG = 16
const MIN_PEAK_FORCE_KG = 50
const UNLOADED_FORCE_KG = 10
const MIN_REP_DURATION_MS = 700
const MAX_REP_DURATION_MS = 4500
const MAX_SAMPLE_GAP_MS = 1500
// Fast loaded-to-unloaded spikes after a completed rep are usually dismounts, not another pull-up.
const MIN_LOADED_UNLOAD_RISE_MS = 1100

export class PullupDetector {
  private reps: PullupRep[] = []
  private smoothedForceKg: number | null = null
  private lastElapsedMs: number | null = null
  private firstTimestampMs: number | null = null
  private direction: Direction = null
  private high: DetectorPoint | null = null
  private low: DetectorPoint | null = null
  private lastUnloadedPoint: DetectorPoint | null = null
  private trough: DetectorPoint | null = null
  private peak: DetectorPoint | null = null

  reset(): void {
    this.reps = []
    this.resetTracking()
    this.firstTimestampMs = null
  }

  update(sample: PullupDetectorSample): PullupDetectorUpdate {
    const elapsedMs = this.resolveElapsedMs(sample)
    const currentKg = this.resolveCurrentKg(sample)
    if (!Number.isFinite(elapsedMs) || !Number.isFinite(currentKg)) {
      return { ...this.snapshot(), newRep: null }
    }

    if (this.lastElapsedMs != null && elapsedMs - this.lastElapsedMs > MAX_SAMPLE_GAP_MS) {
      this.resetTracking()
    }

    if (this.smoothedForceKg == null || this.lastElapsedMs == null) {
      this.smoothedForceKg = currentKg
      this.lastElapsedMs = elapsedMs
      const point = this.point(elapsedMs)
      this.high = point
      this.low = point
      this.lastUnloadedPoint = point.forceKg <= UNLOADED_FORCE_KG ? point : null
      return { ...this.snapshot(), newRep: null }
    }

    const dt = Math.max(0, elapsedMs - this.lastElapsedMs)
    this.lastElapsedMs = elapsedMs
    const alpha = dt <= 0 ? 1 : Math.min(1, dt / (SMOOTHING_MS + dt))
    this.smoothedForceKg += alpha * (currentKg - this.smoothedForceKg)

    const point = this.point(elapsedMs)
    if (point.forceKg <= UNLOADED_FORCE_KG) {
      this.lastUnloadedPoint = point
    }
    let newRep: PullupRep | null = null

    if (!this.high || !this.low) {
      this.high = point
      this.low = point
      return { ...this.snapshot(), newRep }
    }

    if (this.direction == null) {
      this.high = point.forceKg > this.high.forceKg ? point : this.high
      this.low = point.forceKg < this.low.forceKg ? point : this.low
      if (this.high.forceKg - this.low.forceKg >= REVERSAL_THRESHOLD_KG) {
        this.direction = this.high.elapsedMs > this.low.elapsedMs ? "rising" : "falling"
        if (this.direction === "rising" && this.low.forceKg <= UNLOADED_FORCE_KG) {
          this.trough = this.lastUnloadedPoint ?? this.low
        }
      }
      return { ...this.snapshot(), newRep }
    }

    if (this.direction === "rising") {
      this.high = point.forceKg > this.high.forceKg ? point : this.high
      if (this.high.forceKg - point.forceKg >= REVERSAL_THRESHOLD_KG) {
        if (
          this.trough &&
          this.high.forceKg - this.trough.forceKg >= MIN_UP_SWING_KG &&
          this.high.forceKg >= MIN_PEAK_FORCE_KG
        ) {
          this.peak = this.high
        }
        this.direction = "falling"
        this.low = point
      }
      return { ...this.snapshot(), newRep }
    }

    this.low = point.forceKg < this.low.forceKg ? point : this.low

    if (this.peak && point.forceKg <= UNLOADED_FORCE_KG) {
      if (this.isLikelyDismountSpike()) {
        this.resetTracking(point)
        return { ...this.snapshot(), newRep }
      }
      newRep = this.completeRep(point, "unloaded")
      this.resetTracking(point)
      return { ...this.snapshot(), newRep }
    }

    if (point.forceKg - this.low.forceKg >= REVERSAL_THRESHOLD_KG) {
      newRep = this.completeRep(this.low, "reversal")
      if (newRep || !this.trough || this.low.forceKg < this.trough.forceKg) {
        this.trough = this.low
      }
      this.peak = null
      this.direction = "rising"
      this.high = point
    }

    return { ...this.snapshot(), newRep }
  }

  finalize(): PullupDetectorUpdate {
    const newRep = this.low ? this.completeRep(this.low, "finalize") : null
    return { ...this.snapshot(), newRep }
  }

  snapshot(): PullupDetectorSnapshot {
    return {
      repCount: this.reps.length,
      reps: this.reps.map((rep) => ({ ...rep })),
      phase: this.direction ?? "idle",
      smoothedForceKg: this.smoothedForceKg,
    }
  }

  private completeRep(end: DetectorPoint, completedBy: PullupRep["completedBy"]): PullupRep | null {
    if (!this.trough || !this.peak) return null

    const durationMs = end.elapsedMs - this.trough.elapsedMs
    const upSwingKg = this.peak.forceKg - this.trough.forceKg
    const downSwingKg = this.peak.forceKg - end.forceKg

    if (
      durationMs < MIN_REP_DURATION_MS ||
      durationMs > MAX_REP_DURATION_MS ||
      upSwingKg < MIN_UP_SWING_KG ||
      downSwingKg < MIN_DOWN_SWING_KG
    ) {
      return null
    }

    const rep: PullupRep = {
      index: this.reps.length + 1,
      startedAtMs: this.trough.elapsedMs,
      peakAtMs: this.peak.elapsedMs,
      endedAtMs: end.elapsedMs,
      startForceKg: this.trough.forceKg,
      peakForceKg: this.peak.forceKg,
      endForceKg: end.forceKg,
      durationMs,
      upSwingKg,
      downSwingKg,
      completedBy,
    }
    this.reps.push(rep)
    this.peak = null
    return rep
  }

  private isLikelyDismountSpike(): boolean {
    if (!this.trough || !this.peak) return false
    if (this.reps.length === 0) return false
    if (this.trough.forceKg <= UNLOADED_FORCE_KG) return false

    return this.peak.elapsedMs - this.trough.elapsedMs < MIN_LOADED_UNLOAD_RISE_MS
  }

  private resolveElapsedMs(sample: PullupDetectorSample): number {
    if (sample.elapsedMs != null) return sample.elapsedMs
    if (sample.timestamp == null) return Number.NaN
    this.firstTimestampMs ??= sample.timestamp
    return sample.timestamp - this.firstTimestampMs
  }

  private resolveCurrentKg(sample: PullupDetectorSample): number {
    const unit = sample.unit ?? DEFAULT_UNIT
    return convertForce(sample.current, unit, "kg")
  }

  private point(elapsedMs: number): DetectorPoint {
    return {
      elapsedMs,
      forceKg: this.smoothedForceKg ?? 0,
    }
  }

  private resetTracking(point?: DetectorPoint): void {
    this.smoothedForceKg = point?.forceKg ?? null
    this.lastElapsedMs = point?.elapsedMs ?? null
    this.direction = null
    this.high = point ?? null
    this.low = point ?? null
    this.lastUnloadedPoint = point && point.forceKg <= UNLOADED_FORCE_KG ? point : null
    this.trough = null
    this.peak = null
  }
}

export function detectPullups(samples: PullupDetectorSample[]): PullupDetectorSnapshot {
  const detector = new PullupDetector()
  for (const sample of samples) {
    detector.update(sample)
  }
  detector.finalize()
  return detector.snapshot()
}
