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
   * Retrieves the Progressor ID from the device. Formatted as hex MSB-first to match the official app.
   * @returns {Promise<string | undefined>} A Promise that resolves with the device ID hex string.
   */
  progressorId(): Promise<string | undefined>

  /**
   * Retrieves calibration curve from the device (opcode 0x72). Payload is 12 opaque bytes;
   * parsed for display as zero-point, ref-point, and version (3× uint32 LE) plus hex.
   * @returns {Promise<string | undefined>} A Promise that resolves with a display string (e.g. "hex — zero-point: X | ref-point: Y | version: Z").
   */
  calibration(): Promise<string | undefined>

  /**
   * Saves the current calibration settings to the device.
   * @returns {Promise<void>} A Promise that resolves when the command is sent.
   */
  saveCalibration(): Promise<void>

  /**
   * Puts the device to sleep / shutdown.
   * @returns {Promise<void>} A Promise that resolves when the command is sent.
   */
  sleep(): Promise<void>

  /**
   * Retrieves error information from the device.
   * @returns {Promise<string | undefined>} A Promise that resolves with the error info text.
   */
  errorInfo(): Promise<string | undefined>

  /**
   * Clears error information on the device.
   * @returns {Promise<void>} A Promise that resolves when the command is sent.
   */
  clearErrorInfo(): Promise<void>

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
   * Adds a calibration point. Use 0 for zero point, then known weight; then saveCalibration().
   * @param weightKg - Weight in kg (0 or known reference &lt; 150 kg).
   */
  addCalibrationPoint(weightKg: number): Promise<void>

  /**
   * Sends the device tare command to zero the scale (hardware tare).
   * For software tare over a duration, use the base tare(duration) method.
   * @returns {Promise<void>} A Promise that resolves when the command is sent.
   */
  tareScale(): Promise<void>
}
