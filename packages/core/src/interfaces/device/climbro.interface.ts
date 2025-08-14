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
}
