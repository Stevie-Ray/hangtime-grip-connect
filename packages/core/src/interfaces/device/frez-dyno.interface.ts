import type { IDevice } from "../device.interface.js"

/**
 * Interface representing the Frez Dyno device, extending the base Device interface.
 */
export interface IFrezDyno extends IDevice {
  /**
   * Retrieves battery level from the standard Battery service.
   * @returns {Promise<string | undefined>} A Promise that resolves with the battery percentage.
   */
  battery(): Promise<string | undefined>

  /**
   * Retrieves battery voltage through the Frez Dyno command characteristic.
   * @returns {Promise<string | undefined>} A Promise that resolves with the battery voltage response.
   */
  batteryVoltage(): Promise<string | undefined>

  /**
   * Retrieves firmware version from the standard Software Revision characteristic.
   * @returns {Promise<string | undefined>} A Promise that resolves with the firmware version.
   */
  firmware(): Promise<string | undefined>

  /**
   * Retrieves serial number from the standard Device Information service.
   * @returns {Promise<string | undefined>} A Promise that resolves with the serial number.
   */
  serial(): Promise<string | undefined>

  /**
   * Retrieves software version from the standard Device Information service.
   * @returns {Promise<string | undefined>} A Promise that resolves with the software version.
   */
  software(): Promise<string | undefined>

  /**
   * Stops the data stream on the Frez Dyno.
   * @returns {Promise<void>} A promise that resolves when the stream is stopped.
   */
  stop(): Promise<void>

  /**
   * Starts streaming data from the Frez Dyno.
   * @param {number} [duration=0] - The duration of the stream in milliseconds. If set to 0, stream will continue indefinitely.
   * @returns {Promise<void>} A promise that resolves when the streaming operation is completed.
   */
  stream(duration?: number): Promise<void>

  /** True if tare() uses device hardware tare rather than software averaging. */
  readonly usesHardwareTare: true
}
