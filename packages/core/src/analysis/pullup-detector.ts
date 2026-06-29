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
  /** Motherboard only: optional force distribution across zones. */
  distribution?: {
    left?: { current: number; unit?: ForceUnit }
    center?: { current: number; unit?: ForceUnit }
    right?: { current: number; unit?: ForceUnit }
  }
}

export interface PullupRep {
  index: number
  /**
   * Force-derived rep cycle.
   * This does not verify chin-over-bar, full range of motion, or true
   * top/bottom body position.
   */
  detectionType: "forceCycle"
  strictPullupVerified: false

  startedAtMs: number
  endedAtMs: number
  forceTroughAtMs: number
  forcePeakAtMs: number

  startForceKg: number
  peakForceKg: number
  endForceKg: number

  durationMs: number
  forceRiseKg: number
  forceDropKg: number

  /**
   * Estimated loaded bodyweight / system weight from the force stream.
   * This is estimated from loaded samples, not user input.
   */
  bodyWeightKg: number | null

  /** Force features normalized to estimated bodyweight. */
  forceRiseRatio: number | null
  forceDropRatio: number | null
  maxLoadRatio: number | null
  minLoadRatio: number | null

  /**
   * Bodyweight-normalized force impulse. This is dimensionless acceleration
   * integrated over time, not mechanical impulse in N*s.
   */
  positiveImpulseS: number | null
  negativeImpulseS: number | null
  netImpulseS: number | null
  impulseBalance: number | null

  completedBy: "reversal" | "unloaded" | "finalize"

  /** Optional Motherboard distribution diagnostics. */
  maxAbsLeftRightBalance?: number
  meanAbsLeftRightBalance?: number
  meanCenterShare?: number
  confidence?: number
}

export interface PullupDetectorSnapshot {
  repCount: number
  reps: PullupRep[]
  forcePhase: "idle" | "forceLoading" | "forceUnloading"
  smoothedForceKg: number | null
  bodyWeightKg: number | null
}

export interface PullupDetectorUpdate extends PullupDetectorSnapshot {
  newRep: PullupRep | null
}

interface DetectorPoint {
  elapsedMs: number
  forceKg: number
  forceSlopeKgPerS: number
  leftKg: number | null
  centerKg: number | null
  rightKg: number | null
  balance: number
  centerShare: number
}

interface AdaptiveThresholds {
  unloadedForceKg: number
  reversalThresholdKg: number
  minForceRiseKg: number
  minForceDropKg: number
  minPeakForceKg: number
}

interface ImpulseMetrics {
  positiveImpulseS: number | null
  negativeImpulseS: number | null
  netImpulseS: number | null
  impulseBalance: number | null
  maxLoadRatio: number | null
  minLoadRatio: number | null
}

interface ActiveForcePoint {
  elapsedMs: number
  forceKg: number
}

type ForcePhase = "idle" | "forceLoading" | "forceUnloading"

const DEFAULT_UNIT: ForceUnit = "kg"

/**
 * Smoothing:
 * 120ms removes packet jitter without delaying short reps too much.
 */
const SMOOTHING_MS = 120
const MAX_SAMPLE_GAP_MS = 1500

/**
 * Rep duration boundaries.
 * These are time-domain sanity checks, not athlete strength thresholds.
 */
const MIN_REP_DURATION_MS = 650
const MAX_REP_DURATION_MS = 9000

/**
 * Bodyweight-normalized rep thresholds.
 *
 * These define the pull-up force cycle relative to estimated bodyweight.
 * They scale for lighter/heavier athletes.
 */
const REVERSAL_THRESHOLD_RATIO = 0.055
const MIN_FORCE_RISE_RATIO = 0.18
const MIN_FORCE_DROP_RATIO = 0.12
const MIN_PEAK_FORCE_RATIO = 1.03
const UNLOADED_FORCE_RATIO = 0.12

/**
 * Sensor/noise floors.
 *
 * These are the only absolute kg values. They are not rep definitions;
 * they only prevent tare noise and tiny partial bumps from becoming reps.
 */
const MIN_SENSOR_REVERSAL_KG = 2.5
const MIN_SENSOR_SWING_KG = 5
const MIN_SENSOR_PEAK_KG = 18
const UNLOADED_SENSOR_FLOOR_KG = 6
const MIN_BODYWEIGHT_SAMPLE_KG = 18

/**
 * Rolling bodyweight estimation.
 * Median of loaded samples is robust against peaks and unloading.
 */
const BODYWEIGHT_WINDOW_SIZE = 240
const MIN_BODYWEIGHT_SAMPLES = 80
const BODYWEIGHT_UPDATE_ALPHA = 0.08
const MIN_BODYWEIGHT_SAMPLE_RATIO = 0.55
const MAX_BODYWEIGHT_SLOPE_KG_PER_S = 6

/**
 * Force-only impulse diagnostics.
 *
 * Positive and negative impulse are required to confirm a full load/unload
 * force cycle. Impulse balance is not a hard validity criterion because real
 * captures can be imbalanced due to smoothing, bodyweight estimation,
 * sampling windows, technique, and reps not starting/ending at identical
 * mechanical states.
 */
const MIN_POSITIVE_IMPULSE_S = 0.025
const MIN_NEGATIVE_IMPULSE_S = 0.02
const GOOD_IMPULSE_BALANCE_RATIO = 0.65
const MIN_DISTRIBUTION_FORCE_RATIO = 0.35

/**
 * Dismount filtering.
 *
 * A fast loaded-trough rise that unloads quickly after a completed set is
 * often a dismount/re-grip spike, not a pull-up.
 */
const MIN_LOADED_UNLOAD_RISE_MS = 1500
const DISMOUNT_MAX_FORCE_RISE_RATIO = 0.45
const DISMOUNT_MAX_PEAK_RATIO = 1.45

/**
 * Detects force-derived pull-up cycles from load-cell data.
 *
 * A detected rep is defined as a loaded force trough, followed by a meaningful
 * bodyweight-normalized force rise and drop, with positive and negative
 * normalized force impulse inside plausible duration bounds.
 *
 * This detector cannot verify strict pull-up validity: no chin-over-bar check,
 * no full range-of-motion check, no true top/bottom position, and no vertical
 * velocity signal are available from force samples alone.
 */
export class PullupDetector {
  private reps: PullupRep[] = []

  private smoothedForceKg: number | null = null
  private lastElapsedMs: number | null = null
  private firstTimestampMs: number | null = null

  private forcePhaseState: ForcePhase = "idle"

  private high: DetectorPoint | null = null
  private low: DetectorPoint | null = null

  private lastUnloadedPoint: DetectorPoint | null = null
  private trough: DetectorPoint | null = null
  private peak: DetectorPoint | null = null

  private bodyWeightKg: number | null = null
  private loadedForceWindow: number[] = []

  private activeBalances: number[] = []
  private activeCenterShares: number[] = []
  private activeForcePoints: ActiveForcePoint[] = []

  /** Clears all rep history, bodyweight state, smoothing state, and active cycle tracking. */
  reset(): void {
    this.reps = []
    this.bodyWeightKg = null
    this.loadedForceWindow = []
    this.resetTracking()
    this.firstTimestampMs = null
  }

  /** Processes one force sample and returns the updated detector state. */
  update(sample: PullupDetectorSample): PullupDetectorUpdate {
    const elapsedMs = this.resolveElapsedMs(sample)
    const currentKg = this.resolveCurrentKg(sample.current, sample.unit)

    if (!Number.isFinite(elapsedMs) || !Number.isFinite(currentKg)) {
      return { ...this.snapshot(), newRep: null }
    }

    if (this.lastElapsedMs != null && elapsedMs - this.lastElapsedMs > MAX_SAMPLE_GAP_MS) {
      this.resetTracking()
    }

    if (this.smoothedForceKg == null || this.lastElapsedMs == null) {
      this.smoothedForceKg = currentKg
      this.lastElapsedMs = elapsedMs

      const point = this.point(sample, elapsedMs, 0)

      this.updateBodyWeightEstimate(point)

      this.high = point
      this.low = point

      const thresholds = this.thresholds()
      this.lastUnloadedPoint = point.forceKg <= thresholds.unloadedForceKg ? point : null
      this.trough = this.lastUnloadedPoint

      return { ...this.snapshot(), newRep: null }
    }

    const dt = Math.max(0, elapsedMs - this.lastElapsedMs)
    this.lastElapsedMs = elapsedMs

    const previousForceKg = this.smoothedForceKg
    const alpha = dt <= 0 ? 1 : Math.min(1, dt / (SMOOTHING_MS + dt))
    this.smoothedForceKg += alpha * (currentKg - this.smoothedForceKg)
    const forceSlopeKgPerS = dt > 0 ? (this.smoothedForceKg - previousForceKg) / (dt / 1000) : 0

    const point = this.point(sample, elapsedMs, forceSlopeKgPerS)
    this.updateBodyWeightEstimate(point)

    const thresholds = this.thresholds()

    if (point.forceKg <= thresholds.unloadedForceKg) {
      this.lastUnloadedPoint = point

      if (this.forcePhaseState === "idle") {
        this.trough = point
        this.high = point
        this.low = point
      }
    }

    let newRep: PullupRep | null = null

    if (!this.high || !this.low) {
      this.high = point
      this.low = point
      return { ...this.snapshot(), newRep }
    }

    if (this.forcePhaseState === "idle") {
      this.high = point.forceKg > this.high.forceKg ? point : this.high
      this.low = point.forceKg < this.low.forceKg ? point : this.low

      if (this.high.forceKg - this.low.forceKg >= thresholds.reversalThresholdKg) {
        // This is a force transition, not a direct movement phase.
        this.forcePhaseState = this.high.elapsedMs > this.low.elapsedMs ? "forceLoading" : "forceUnloading"

        if (this.forcePhaseState === "forceLoading") {
          // First reps usually start unloaded; later reps usually start from a loaded trough.
          this.trough = this.lastUnloadedPoint ?? this.low
          this.high = point
          this.resetActiveDistribution(point)
        }
      }

      return { ...this.snapshot(), newRep }
    }

    this.collectDistribution(point)

    if (this.forcePhaseState === "forceLoading") {
      this.high = point.forceKg > this.high.forceKg ? point : this.high

      if (!this.trough) {
        this.trough = this.lastUnloadedPoint ?? this.low ?? point
      }

      if (this.high.forceKg - point.forceKg >= thresholds.reversalThresholdKg) {
        if (
          this.trough &&
          this.high.forceKg - this.trough.forceKg >= thresholds.minForceRiseKg &&
          this.high.forceKg >= thresholds.minPeakForceKg
        ) {
          this.peak = this.high
        }

        this.forcePhaseState = "forceUnloading"
        this.low = point
      }

      return { ...this.snapshot(), newRep }
    }

    this.low = point.forceKg < this.low.forceKg ? point : this.low

    if (this.peak && point.forceKg <= thresholds.unloadedForceKg) {
      if (this.isLikelyDismountSpike(point)) {
        this.resetTracking(point)
        return { ...this.snapshot(), newRep }
      }

      newRep = this.completeRep(point, "unloaded")
      this.resetTracking(point)

      return { ...this.snapshot(), newRep }
    }

    if (point.forceKg - this.low.forceKg >= thresholds.reversalThresholdKg) {
      newRep = this.completeRep(this.low, "reversal")

      // If a small bump was rejected, keep the lower trough for the next larger valid peak.
      if (newRep || !this.trough || this.low.forceKg < this.trough.forceKg) {
        this.trough = this.low
        this.resetActiveDistribution(this.low)
      }

      this.peak = null
      this.forcePhaseState = "forceLoading"
      this.high = point

      return { ...this.snapshot(), newRep }
    }

    return { ...this.snapshot(), newRep }
  }

  /** Attempts to complete a pending force cycle when streaming stops. */
  finalize(): PullupDetectorUpdate {
    let newRep: PullupRep | null = null

    if (this.low && this.peak && !this.isLikelyDismountSpike(this.low)) {
      newRep = this.completeRep(this.low, "finalize")
    }

    return { ...this.snapshot(), newRep }
  }

  /** Returns an immutable snapshot of the current detector state. */
  snapshot(): PullupDetectorSnapshot {
    return {
      repCount: this.reps.length,
      reps: this.reps.map((rep) => ({ ...rep })),
      forcePhase: this.forcePhaseState,
      smoothedForceKg: this.smoothedForceKg,
      bodyWeightKg: this.bodyWeightKg,
    }
  }

  /** Validates and records one completed force cycle. */
  private completeRep(end: DetectorPoint, completedBy: PullupRep["completedBy"]): PullupRep | null {
    if (!this.trough || !this.peak) return null

    const durationMs = end.elapsedMs - this.trough.elapsedMs
    const forceRiseKg = this.peak.forceKg - this.trough.forceKg
    const forceDropKg = this.peak.forceKg - end.forceKg

    const bodyWeightKg = this.bodyWeightKg ?? this.estimateBodyWeightFromRep(this.trough, this.peak, end)
    const thresholds = this.thresholds(bodyWeightKg)

    const impulse = this.impulseMetrics(bodyWeightKg)
    const forceRiseRatio = bodyWeightKg ? forceRiseKg / bodyWeightKg : null
    const forceDropRatio = bodyWeightKg ? forceDropKg / bodyWeightKg : null

    // Require both sides of the force cycle; impulse balance stays diagnostic.
    const hasEnoughImpulse =
      impulse.positiveImpulseS != null &&
      impulse.negativeImpulseS != null &&
      impulse.positiveImpulseS >= MIN_POSITIVE_IMPULSE_S &&
      impulse.negativeImpulseS >= MIN_NEGATIVE_IMPULSE_S

    if (
      durationMs < MIN_REP_DURATION_MS ||
      durationMs > MAX_REP_DURATION_MS ||
      forceRiseKg < thresholds.minForceRiseKg ||
      forceDropKg < thresholds.minForceDropKg ||
      this.peak.forceKg < thresholds.minPeakForceKg ||
      !hasEnoughImpulse
    ) {
      return null
    }

    const rep: PullupRep = {
      index: this.reps.length + 1,
      detectionType: "forceCycle",
      strictPullupVerified: false,

      startedAtMs: this.trough.elapsedMs,
      endedAtMs: end.elapsedMs,
      forceTroughAtMs: this.trough.elapsedMs,
      forcePeakAtMs: this.peak.elapsedMs,

      startForceKg: this.trough.forceKg,
      peakForceKg: this.peak.forceKg,
      endForceKg: end.forceKg,

      durationMs,
      forceRiseKg,
      forceDropKg,

      bodyWeightKg,
      forceRiseRatio,
      forceDropRatio,
      maxLoadRatio: impulse.maxLoadRatio,
      minLoadRatio: impulse.minLoadRatio,

      positiveImpulseS: impulse.positiveImpulseS,
      negativeImpulseS: impulse.negativeImpulseS,
      netImpulseS: impulse.netImpulseS,
      impulseBalance: impulse.impulseBalance,

      completedBy,
      confidence: this.scoreConfidence({
        durationMs,
        forceRiseRatio,
        forceDropRatio,
        maxLoadRatio: impulse.maxLoadRatio,
        impulseBalance: impulse.impulseBalance,
      }),
    }

    if (this.activeBalances.length) {
      rep.maxAbsLeftRightBalance = Math.max(...this.activeBalances)
      rep.meanAbsLeftRightBalance = mean(this.activeBalances)
    }

    if (this.activeCenterShares.length) {
      rep.meanCenterShare = mean(this.activeCenterShares)
    }

    this.updateBodyWeightFromRep(bodyWeightKg)

    this.reps.push(rep)
    this.peak = null

    return rep
  }

  /** Builds adaptive thresholds from the current or supplied bodyweight estimate. */
  private thresholds(bodyWeightKg = this.bodyWeightKg): AdaptiveThresholds {
    if (!bodyWeightKg) {
      return {
        unloadedForceKg: UNLOADED_SENSOR_FLOOR_KG,
        reversalThresholdKg: MIN_SENSOR_REVERSAL_KG,
        minForceRiseKg: MIN_SENSOR_SWING_KG,
        minForceDropKg: MIN_SENSOR_SWING_KG,
        minPeakForceKg: MIN_SENSOR_PEAK_KG,
      }
    }

    return {
      unloadedForceKg: Math.max(UNLOADED_SENSOR_FLOOR_KG, bodyWeightKg * UNLOADED_FORCE_RATIO),
      reversalThresholdKg: Math.max(MIN_SENSOR_REVERSAL_KG, bodyWeightKg * REVERSAL_THRESHOLD_RATIO),
      minForceRiseKg: Math.max(MIN_SENSOR_SWING_KG, bodyWeightKg * MIN_FORCE_RISE_RATIO),
      minForceDropKg: Math.max(MIN_SENSOR_SWING_KG, bodyWeightKg * MIN_FORCE_DROP_RATIO),
      minPeakForceKg: Math.max(MIN_SENSOR_PEAK_KG, bodyWeightKg * MIN_PEAK_FORCE_RATIO),
    }
  }

  /**
   * Learns bodyweight only from stable idle/baseline samples. Updating during
   * active loading/unloading would let slow lock-offs or force peaks drift the
   * bodyweight estimate upward.
   */
  private updateBodyWeightEstimate(point: DetectorPoint): void {
    if (!this.isStableLoadedBaseline(point)) return

    this.loadedForceWindow.push(point.forceKg)

    while (this.loadedForceWindow.length > BODYWEIGHT_WINDOW_SIZE) {
      this.loadedForceWindow.shift()
    }

    if (this.loadedForceWindow.length < MIN_BODYWEIGHT_SAMPLES) return

    const windowMedianKg = median(this.loadedForceWindow)

    if (!Number.isFinite(windowMedianKg) || windowMedianKg < MIN_BODYWEIGHT_SAMPLE_KG) return

    if (this.bodyWeightKg == null) {
      this.bodyWeightKg = windowMedianKg
      return
    }

    this.bodyWeightKg += BODYWEIGHT_UPDATE_ALPHA * (windowMedianKg - this.bodyWeightKg)
  }

  /** Checks whether a sample is stable enough to update the rolling bodyweight baseline. */
  private isStableLoadedBaseline(point: DetectorPoint): boolean {
    if (this.forcePhaseState !== "idle") return false
    if (Math.abs(point.forceSlopeKgPerS) > MAX_BODYWEIGHT_SLOPE_KG_PER_S) return false
    if (point.forceKg < MIN_BODYWEIGHT_SAMPLE_KG) return false

    if (this.bodyWeightKg == null) return true

    return point.forceKg >= this.bodyWeightKg * 0.75 && point.forceKg <= this.bodyWeightKg * 1.15
  }

  /**
   * Estimates bodyweight from the current rep when the rolling idle baseline is
   * not ready yet. The upper loaded percentile is intentional: many samples in
   * a force cycle are below bodyweight during unloading/deceleration, so a raw
   * median can under-estimate bodyweight and make later gates too permissive.
   */
  private estimateBodyWeightFromRep(start: DetectorPoint, peak: DetectorPoint, end: DetectorPoint): number | null {
    const loadedRepForces = this.activeForcePoints
      .map((point) => point.forceKg)
      .filter((forceKg) => Number.isFinite(forceKg) && forceKg >= MIN_BODYWEIGHT_SAMPLE_KG)

    if (loadedRepForces.length >= MIN_BODYWEIGHT_SAMPLES / 2) {
      return percentile(loadedRepForces, 0.65)
    }

    const candidates = [start.forceKg, end.forceKg, peak.forceKg * 0.75].filter(
      (value) => Number.isFinite(value) && value >= MIN_BODYWEIGHT_SAMPLE_KG,
    )

    if (candidates.length === 0) return null

    return median(candidates)
  }

  /** Blends an accepted rep-level bodyweight estimate back into the rolling estimate. */
  private updateBodyWeightFromRep(bodyWeightKg: number | null): void {
    if (!bodyWeightKg) return

    if (this.bodyWeightKg == null) {
      this.bodyWeightKg = bodyWeightKg
      return
    }

    this.bodyWeightKg += BODYWEIGHT_UPDATE_ALPHA * (bodyWeightKg - this.bodyWeightKg)
  }

  /**
   * Filters short unload spikes after at least one accepted rep. This is a
   * deliberately narrow heuristic: first reps and loaded endings are passed
   * through to completeRep so legitimate force cycles remain countable.
   */
  private isLikelyDismountSpike(end: DetectorPoint): boolean {
    if (!this.trough || !this.peak) return false
    if (this.reps.length === 0) return false

    const bodyWeightKg = this.bodyWeightKg ?? this.estimateBodyWeightFromRep(this.trough, this.peak, end)
    if (!bodyWeightKg) return false

    const thresholds = this.thresholds(bodyWeightKg)
    if (end.forceKg > thresholds.unloadedForceKg) return false

    // Only loaded-trough cycles can be dismounts; first unloaded reps stay eligible.
    if (this.trough.forceKg <= thresholds.unloadedForceKg) return false

    const riseDurationMs = this.peak.elapsedMs - this.trough.elapsedMs
    const forceRiseKg = this.peak.forceKg - this.trough.forceKg

    const forceRiseRatio = forceRiseKg / bodyWeightKg
    const peakLoadRatio = this.peak.forceKg / bodyWeightKg

    return (
      riseDurationMs < MIN_LOADED_UNLOAD_RISE_MS &&
      forceRiseRatio < DISMOUNT_MAX_FORCE_RISE_RATIO &&
      peakLoadRatio < DISMOUNT_MAX_PEAK_RATIO
    )
  }

  /** Scores the quality of an accepted force cycle from force, impulse, and distribution features. */
  private scoreConfidence(params: {
    durationMs: number
    forceRiseRatio: number | null
    forceDropRatio: number | null
    maxLoadRatio: number | null
    impulseBalance: number | null
  }): number {
    let score = 0.55

    if (params.durationMs >= 900 && params.durationMs <= 6500) score += 0.1

    if (params.forceRiseRatio != null && params.forceRiseRatio >= MIN_FORCE_RISE_RATIO * 1.35) {
      score += 0.1
    }

    if (params.forceDropRatio != null && params.forceDropRatio >= MIN_FORCE_DROP_RATIO * 1.35) {
      score += 0.1
    }

    if (params.maxLoadRatio != null && params.maxLoadRatio >= MIN_PEAK_FORCE_RATIO * 1.05) {
      score += 0.1
    }

    score += this.scoreImpulseBalance(params.impulseBalance)

    const maxBalance = this.activeBalances.length ? Math.max(...this.activeBalances) : 0
    if (maxBalance <= 0.45) score += 0.05

    return Math.max(0, Math.min(1, score))
  }

  /** Gives balanced force cycles a confidence bonus without making balance a validity gate. */
  private scoreImpulseBalance(impulseBalance: number | null): number {
    if (impulseBalance == null) return 0

    if (impulseBalance <= GOOD_IMPULSE_BALANCE_RATIO) return 0.1
    if (impulseBalance <= 0.8) return 0.05

    return 0
  }

  /**
   * Integrates normalized net load around estimated bodyweight.
   *
   * force/bodyweight - 1 is a force-only acceleration surrogate, not a direct
   * velocity or displacement signal. Positive and negative areas provide
   * evidence of a complete load/unload force cycle.
   */
  private impulseMetrics(bodyWeightKg: number | null): ImpulseMetrics {
    if (!bodyWeightKg) {
      return {
        positiveImpulseS: null,
        negativeImpulseS: null,
        netImpulseS: null,
        impulseBalance: null,
        maxLoadRatio: null,
        minLoadRatio: null,
      }
    }

    const minLoadedForceKg = Math.max(UNLOADED_SENSOR_FLOOR_KG, bodyWeightKg * MIN_BODYWEIGHT_SAMPLE_RATIO)
    const points = this.activeForcePoints.filter((point) => point.forceKg >= minLoadedForceKg)

    if (points.length < 2) {
      return {
        positiveImpulseS: null,
        negativeImpulseS: null,
        netImpulseS: null,
        impulseBalance: null,
        maxLoadRatio: null,
        minLoadRatio: null,
      }
    }

    let positiveImpulseS = 0
    let negativeImpulseS = 0
    let maxLoadRatio = Number.NEGATIVE_INFINITY
    let minLoadRatio = Number.POSITIVE_INFINITY

    for (const point of points) {
      const loadRatio = point.forceKg / bodyWeightKg
      maxLoadRatio = Math.max(maxLoadRatio, loadRatio)
      minLoadRatio = Math.min(minLoadRatio, loadRatio)
    }

    for (let index = 1; index < points.length; index += 1) {
      const previousNetG = points[index - 1].forceKg / bodyWeightKg - 1
      const currentNetG = points[index].forceKg / bodyWeightKg - 1
      const dtS = Math.max(0, points[index].elapsedMs - points[index - 1].elapsedMs) / 1000

      positiveImpulseS += ((Math.max(0, previousNetG) + Math.max(0, currentNetG)) / 2) * dtS
      negativeImpulseS += ((Math.max(0, -previousNetG) + Math.max(0, -currentNetG)) / 2) * dtS
    }

    const netImpulseS = positiveImpulseS - negativeImpulseS
    const totalImpulseS = positiveImpulseS + negativeImpulseS
    const impulseBalance = totalImpulseS > 0 ? Math.abs(netImpulseS) / totalImpulseS : null

    return {
      positiveImpulseS,
      negativeImpulseS,
      netImpulseS,
      impulseBalance,
      maxLoadRatio,
      minLoadRatio,
    }
  }

  /** Converts an input sample into the normalized point representation used by the detector. */
  private point(sample: PullupDetectorSample, elapsedMs: number, forceSlopeKgPerS: number): DetectorPoint {
    const leftKg = this.resolveZoneKg(sample, "left")
    const centerKg = this.resolveZoneKg(sample, "center")
    const rightKg = this.resolveZoneKg(sample, "right")

    const totalForDistribution = Math.max(1, Math.abs(leftKg ?? 0) + Math.abs(centerKg ?? 0) + Math.abs(rightKg ?? 0))

    const balance = leftKg != null && rightKg != null ? (rightKg - leftKg) / totalForDistribution : 0

    const centerShare = centerKg != null ? Math.abs(centerKg) / totalForDistribution : 0

    return {
      elapsedMs,
      forceKg: this.smoothedForceKg ?? 0,
      forceSlopeKgPerS,
      leftKg,
      centerKg,
      rightKg,
      balance,
      centerShare,
    }
  }

  /** Collects force samples for impulse metrics and loaded per-zone diagnostics. */
  private collectDistribution(point: DetectorPoint): void {
    this.activeForcePoints.push({ elapsedMs: point.elapsedMs, forceKg: point.forceKg })

    const thresholds = this.thresholds()
    const minDistributionForceKg =
      this.bodyWeightKg == null
        ? thresholds.unloadedForceKg
        : Math.max(thresholds.unloadedForceKg, this.bodyWeightKg * MIN_DISTRIBUTION_FORCE_RATIO)

    if (point.forceKg < minDistributionForceKg) return

    // At tare/no-load, tiny per-zone offsets can look like extreme asymmetry.
    if (point.leftKg != null && point.rightKg != null) {
      this.activeBalances.push(Math.abs(point.balance))
    }

    if (point.centerKg != null) {
      this.activeCenterShares.push(point.centerShare)
    }
  }

  /** Clears active cycle samples and optionally seeds the next cycle with a known trough. */
  private resetActiveDistribution(point?: DetectorPoint): void {
    this.activeBalances = []
    this.activeCenterShares = []
    this.activeForcePoints = []

    if (point) {
      this.collectDistribution(point)
    }
  }

  /** Reads one optional Motherboard zone force and converts it to kilograms. */
  private resolveZoneKg(sample: PullupDetectorSample, zone: "left" | "center" | "right"): number | null {
    const value = sample.distribution?.[zone]
    if (!value) return null

    return this.resolveCurrentKg(value.current, value.unit ?? sample.unit)
  }

  /** Resolves sample time to milliseconds since session start. */
  private resolveElapsedMs(sample: PullupDetectorSample): number {
    if (sample.elapsedMs != null) return sample.elapsedMs
    if (sample.timestamp == null) return Number.NaN

    this.firstTimestampMs ??= sample.timestamp

    return sample.timestamp - this.firstTimestampMs
  }

  /** Converts a force value to kilograms, using kg when the unit is omitted. */
  private resolveCurrentKg(value: number, unit: ForceUnit = DEFAULT_UNIT): number {
    return convertForce(value, unit, "kg")
  }

  /** Resets force-cycle tracking while preserving accepted reps and bodyweight history. */
  private resetTracking(point?: DetectorPoint): void {
    this.smoothedForceKg = point?.forceKg ?? null
    this.lastElapsedMs = point?.elapsedMs ?? null

    this.forcePhaseState = "idle"

    this.high = point ?? null
    this.low = point ?? null

    if (point) {
      const thresholds = this.thresholds()
      this.lastUnloadedPoint = point.forceKg <= thresholds.unloadedForceKg ? point : null
      this.trough = this.lastUnloadedPoint
    } else {
      this.lastUnloadedPoint = null
      this.trough = null
    }

    this.peak = null
    this.resetActiveDistribution(point)
  }
}

/** Returns the arithmetic mean, or zero for an empty array. */
function mean(values: number[]): number {
  if (values.length === 0) return 0

  return values.reduce((sum, value) => sum + value, 0) / values.length
}

/** Returns the median value, or NaN for an empty array. */
function median(values: number[]): number {
  if (values.length === 0) return Number.NaN

  const sorted = [...values].sort((a, b) => a - b)
  const middle = Math.floor(sorted.length / 2)

  if (sorted.length % 2 === 1) {
    return sorted[middle]
  }

  return (sorted[middle - 1] + sorted[middle]) / 2
}

/** Returns a clamped percentile from a numeric sample set. */
function percentile(values: number[], ratio: number): number {
  if (values.length === 0) return Number.NaN

  const sorted = [...values].sort((a, b) => a - b)
  const clampedRatio = Math.max(0, Math.min(1, ratio))
  const index = Math.round((sorted.length - 1) * clampedRatio)

  return sorted[index]
}

/** Detects all force-derived pull-up cycles in a finite sample list. */
export function detectPullups(samples: PullupDetectorSample[]): PullupDetectorSnapshot {
  const detector = new PullupDetector()

  for (const sample of samples) {
    detector.update(sample)
  }

  detector.finalize()

  return detector.snapshot()
}
