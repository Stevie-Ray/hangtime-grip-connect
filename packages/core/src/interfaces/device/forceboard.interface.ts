import type { IDevice } from "../device.interface"

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
}
