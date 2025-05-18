import type { IDevice } from "../device.interface.js"

/**
 * Interface representing the Entralpi device, extending the base Device interface.
 */
export interface IEntralpi extends IDevice {
  /**
   * Retrieves battery or voltage information from the device.
   * @returns {Promise<string | undefined>} A Promise that resolves with the battery or voltage information.
   */
  battery(): Promise<string | undefined>

  /**
   * Retrieves IEEE 11073-20601 Regulatory Certification from the device.
   * @returns {Promise<string | undefined>} A Promise that resolves with the firmware version.
   */
  certification(): Promise<string | undefined>

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
   * Retrieves PnP ID from the device, a set of values that used to create a device ID value that is unique for this device.
   * Included in the characteristic is a Vendor ID Source field, a Vendor ID field, a Product ID field and a Product Version field
   * @returns {Promise<string | undefined>} A Promise that resolves with the PnP ID.
   */
  pnp(): Promise<string | undefined>

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
