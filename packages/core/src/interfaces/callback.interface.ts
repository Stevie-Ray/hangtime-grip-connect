/**
 * Represents the mass data collected from a device.
 */
export interface massObject {
  /**
   * The total mass measured from the device.
   * This is the overall weight or force reading.
   */
  massTotal: string

  /**
   * The maximum mass recorded during the session.
   * This is the highest weight or force value detected.
   */
  massMax: string

  /**
   * The average mass calculated from all the recorded data points.
   * This represents the mean value of the mass measurements.
   */
  massAverage: string

  /**
   * The mass recorded on the left side of the device (optional for Motherboard devices).
   * Used for devices that measure force across multiple zones.
   */
  massLeft?: string

  /**
   * The mass recorded at the center of the device (optional for Motherboard devices).
   * Used for devices that measure force distribution across a center zone.
   */
  massCenter?: string

  /**
   * The mass recorded on the right side of the device (optional for Motherboard devices).
   * Used for devices that measure force across multiple zones.
   */
  massRight?: string
}

/**
 * Defines the type for a callback function that handles mass data notifications.
 * The callback receives a `massObject` as the parameter.
 * @callback NotifyCallback
 * @param {massObject} data - The mass data passed to the callback.
 */
export type NotifyCallback = (data: massObject) => void

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
