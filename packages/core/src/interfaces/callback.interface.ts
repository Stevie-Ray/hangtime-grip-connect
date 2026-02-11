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

  /** Lowest instantaneous force recorded within the measured window or session (e.g. for charts and Min/Max UI) */
  min: number
}

export interface ForcePerformance {
  /** Time in ms since the previous BLE notification (packet). */
  notifyIntervalMs?: number
  /** Cumulative count of data packets received this session (one BLE notification = one packet). */
  packetIndex?: number
  /** Number of samples in the current packet (e.g. Progressor: payload length / 8). */
  samplesPerPacket?: number
  /** Data rate in Hz: samples per second from device timestamps (samples in last 1s of device time). */
  samplingRateHz?: number
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

  /** Performance metadata (notify interval, packet count, samples/packet, Hz). */
  performance?: ForcePerformance

  /** Motherboard only: Force distribution across multiple sensor zones. */
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
