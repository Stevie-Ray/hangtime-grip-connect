import type { IDevice } from "../device.interface.js"

/**
 * Interface representing the Tindeq Progressor device, extending the base Device interface.
 */
export interface IProgressor extends IDevice {
  /**
   * Retrieves battery or voltage information from the device.
   * @returns {Promise<string | undefined>} A Promise that resolves with the battery or voltage information.
   */
  battery(): Promise<string | undefined>

  /**
   * Retrieves firmware version from the device.
   * @returns {Promise<string>} A Promise that resolves with the firmware version.
   */
  firmware(): Promise<string | undefined>

  /**
   * Stops the data stream on the specified device.
   * @returns {Promise<void>} A promise that resolves when the stream is stopped.
   */
  stop(): Promise<void>

  /**
   * Starts streaming data from the specified device.
   * @param {number} [duration=0] - The duration of the stream in milliseconds. If set to 0, stream will continue indefinitely.
   * @returns {Promise<void>} A promise that resolves when the streaming operation is completed.
   */
  stream(duration?: number): Promise<void>
}
