import type { IDevice } from "../device.interface.js"

/**
 * Interface representing the PitchSix ForceBoard device, extending the base Device interface.
 */
export interface IForceBoard extends IDevice {
  /**
   * Retrieves battery or voltage information from the device.
   * @returns {Promise<string | undefined>} A Promise that resolves with the battery or voltage information.
   */
  battery(): Promise<string | undefined>

  /**
   * Retrieves humidity level from the device.
   * @returns {Promise<string | undefined>} A Promise that resolves with the humidity level.
   */
  humidity(): Promise<string | undefined>

  /**
   * Retrieves manufacturer information from the device.
   * @returns {Promise<string | undefined>} A Promise that resolves with the manufacturer information.
   */
  manufacturer(): Promise<string | undefined>

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

  /**
   * Retrieves temperature information from the device.
   * @returns {Promise<string | undefined>} A Promise that resolves with the humidity level.
   */
  temperature(): Promise<string | undefined>
}
