import type { IDevice } from "../device.interface.js"

/**
 * Interface representing the Climbro device, extending the base Device interface.
 */
export interface IClimbro extends IDevice {
  /**
   * Retrieves battery level from the device.
   * @returns {Promise<string | undefined>} A Promise that resolves with the battery level.
   */
  battery(): Promise<string | undefined>

  /**
   * Retrieves hardware version from the device.
   * @returns {Promise<string | undefined>} A Promise that resolves with the hardware version.
   */
  hardware(): Promise<string | undefined>

  /**
   * Retrieves manufacturer information from the device.
   * @returns {Promise<string | undefined>} A Promise that resolves with the manufacturer information.
   */
  manufacturer(): Promise<string | undefined>

  /**
   * Retrieves model number from the device.
   * @returns {Promise<string | undefined>} A Promise that resolves with the model number.
   */
  model(): Promise<string | undefined>

  /**
   * Retrieves software version from the device.
   * @returns {Promise<string | undefined>} A Promise that resolves with the software version.
   */
  software(): Promise<string | undefined>

  /**
   * Retrieves system id from the device.
   * @returns {Promise<string | undefined>} A Promise that resolves with the system id.
   */
  system(): Promise<string | undefined>
}
