/** Force-equivalent display unit used for all values in this measurement */
export type ForceUnit = "kg" | "lbs"

/**
 * Core statistical values describing force over a time window or session.
 */
export interface ForceStats {
  /** Instantaneous total force at the current sample moment */
  current: number

  /** Highest instantaneous force recorded within the measured window or session */
  peak: number

  /** Mean (average) force across all samples in the measured window or session */
  mean: number
}

/**
 * Complete force measurement including timing, unit, and optional spatial distribution.
 * Can represent either a single real-time sample or a rolling/session summary.
 */
export interface ForceMeasurement extends ForceStats {
  /** Display unit for all force values (force-equivalent kgf or lbf) */
  unit: ForceUnit

  /** Unix epoch timestamp in milliseconds indicating when the measurement was recorded */
  timestamp: number

  /**
   * Sampling frequency of the underlying force signal in Hertz.
   * Required for time-dependent metrics such as RFD, impulse, or filtering.
   */
  samplingRateHz?: number

  /**
   * Optional force distribution across multiple sensor zones.
   * Each zone follows the exact same measurement structure as the parent.
   * Nested distributions should be avoided to keep the model one level deep.
   */
  distribution?: {
    /** Force statistics for the left sensor zone */
    left?: ForceMeasurement

    /** Force statistics for the center sensor zone */
    center?: ForceMeasurement

    /** Force statistics for the right sensor zone */
    right?: ForceMeasurement
  }
}

/**
 * Defines the type for a callback function that handles mass data notifications.
 * The callback receives a `ForceMeasurement` as the parameter.
 * @callback NotifyCallback
 * @param {ForceMeasurement} data - The force measurement data passed to the callback.
 */
export type NotifyCallback = (data: ForceMeasurement) => void

/**
 * Defines the type for a callback function that handles write operations to the device.
 * The callback receives the data string written to the device.
 * @callback WriteCallback
 * @param {string} data - The string data passed to the callback.
 */
export type WriteCallback = (data: string) => void

/**
 * Type definition for the callback function that is called when the activity status changes.
 * @callback ActiveCallback
 * @param {boolean} value - The new activity status (true if active, false if not).
 */
export type ActiveCallback = (data: boolean) => void
