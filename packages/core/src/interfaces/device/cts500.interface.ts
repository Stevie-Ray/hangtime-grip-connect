import type { IDevice } from "../device.interface.js"

export type CTS500BaudRate = 9600 | 19200 | 38400 | 57600 | 115200

export type CTS500SamplingRate = 10 | 20 | 40 | 80 | 160 | 320

/**
 * Interface representing the CTS500 device, extending the base Device interface.
 */
export interface ICTS500 extends IDevice {
  /**
   * Retrieves battery voltage from the device.
   * The returned string is the voltage in volts with two decimal places.
   * @returns {Promise<string | undefined>} A Promise that resolves with the battery voltage.
   */
  battery(): Promise<string | undefined>

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

  /**
   * Sets whether the device should reset to zero on power-up.
   * @param {boolean} enabled - Whether to reset to zero on power-up.
   * @returns {Promise<void>} A Promise that resolves when the command has been acknowledged.
   */
  powerOnReset(enabled: boolean): Promise<void>

  /**
   * Enables or disables peak mode.
   * @param {boolean} enabled - Whether peak mode should be enabled.
   * @returns {Promise<void>} A Promise that resolves when the command has been acknowledged.
   */
  peakMode(enabled?: boolean): Promise<void>

  /**
   * Configures the transparent UART baud rate on the device.
   * @param {CTS500BaudRate} baudRate - Desired baud rate.
   * @returns {Promise<void>} A Promise that resolves when the command has been acknowledged.
   */
  setBaudRate(baudRate: CTS500BaudRate): Promise<void>

  /**
   * Configures the device A/D sampling rate.
   * @param {CTS500SamplingRate} samplingRate - Desired A/D sampling rate in Hz.
   * @returns {Promise<void>} A Promise that resolves when the command has been acknowledged.
   */
  setSamplingRate(samplingRate: CTS500SamplingRate): Promise<void>

  /**
   * Starts automatic weight uploads over the notify characteristic.
   * @param {number} [duration=0] - Optional delay before the promise resolves.
   * @returns {Promise<void>} A Promise that resolves once automatic upload has been enabled.
   */
  stream(duration?: number): Promise<void>

  /**
   * Stops automatic weight uploads over the notify characteristic.
   * @returns {Promise<void>} A Promise that resolves once automatic upload has been disabled.
   */
  stop(): Promise<void>

  /**
   * Retrieves the current temperature reading from the device.
   * The returned string is the temperature in Celsius.
   * @returns {Promise<string | undefined>} A Promise that resolves with the temperature.
   */
  temperature(): Promise<string | undefined>

  /**
   * Retrieves the current weight from the device in kilograms.
   * @returns {Promise<number | undefined>} A Promise that resolves with the current weight.
   */
  weight(): Promise<number | undefined>

  /**
   * Updates the hardware zero point.
   * @returns {Promise<void>} A Promise that resolves when the command has been acknowledged.
   */
  zero(): Promise<void>
}
