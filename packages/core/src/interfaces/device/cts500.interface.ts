import type { IDevice } from "../device.interface.js"

/**
 * Interface representing the CTS500 device, extending the base Device interface.
 */
export interface ICTS500 extends IDevice {
  /**
   * Retrieves firmware version from the device.
   * @returns {Promise<string | undefined>} A Promise that resolves with the firmware version.
   */
  firmware(): Promise<string | undefined>

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
   * Retrieves serial number from the device.
   * @returns {Promise<string | undefined>} A Promise that resolves with the serial number.
   */
  serial(): Promise<string | undefined>

  /**
   * Retrieves software version from the device.
   * @returns {Promise<string | undefined>} A Promise that resolves with the software version.
   */
  software(): Promise<string | undefined>
}
