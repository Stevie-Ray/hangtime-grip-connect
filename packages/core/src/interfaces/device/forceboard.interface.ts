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
   * Stops the data stream on the specified device by setting it to Idle mode.
   * Writes 0x07 to the Device Mode characteristic.
   * @returns {Promise<void>} A promise that resolves when the stream is stopped.
   */
  stop(): Promise<void>

  /**
   * Starts streaming data from the specified device in Streaming Data Mode.
   * Writes 0x04 to the Device Mode characteristic.
   * @param {number} [duration=0] - The duration of the stream in milliseconds. If set to 0, stream will continue indefinitely.
   * @returns {Promise<void>} A promise that resolves when the streaming operation is completed.
   */
  stream(duration?: number): Promise<void>

  /**
   * Tares the Force Board device using a characteristic to zero out the current load value.
   * @returns {Promise<void>} A promise that resolves when the tare operation is completed.
   */
  tareByCharacteristic(): Promise<void>

  /**
   * Tares the Force Board device using the Device Mode characteristic.
   * Writes 0x05 to the Device Mode characteristic to zero out the current load value.
   * @returns {Promise<void>} A promise that resolves when the tare operation is completed.
   */
  tareByMode(): Promise<void>

  /**
   * Sets the threshold for the Quick Start mode.
   * @param {number} thresholdLbs - The threshold value in pounds.
   * @returns {Promise<void>} A promise that resolves when the threshold is set.
   */
  threshold(thresholdLbs: number): Promise<void>

  /**
   * Retrieves temperature information from the device.
   * @returns {Promise<string | undefined>} A Promise that resolves with the temperature information.
   */
  temperature(): Promise<string | undefined>

  /**
   * Starts the Force Board in Quick Start mode.
   * Writes 0x06 to the Device Mode characteristic.
   * @param {number} [duration=0] - The duration in milliseconds. If set to 0, mode will continue indefinitely.
   * @returns {Promise<void>} A promise that resolves when the operation is completed.
   */
  quick(duration?: number): Promise<void>
}
