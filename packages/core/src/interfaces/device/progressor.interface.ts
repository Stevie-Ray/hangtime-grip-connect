import type { INordicDfuDevice } from "../nordic.interface.js"

/**
 * Interface representing the Tindeq Progressor device, extending the base Device interface.
 */
export interface IProgressor extends INordicDfuDevice {
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
   * Retrieves the linear calibration block from the device (opcode 0x72).
   * Parsed for display as raw hex plus 3× float32 LE coefficients:
   * slope, intercept, and trim. Firmware uses: value = raw * slope + intercept + trim.
   */
  calibration(): Promise<string | undefined>

  /**
   * Retrieves the hidden 15-entry piecewise calibration table.
   * Returns newline-separated decoded records in export order.
   */
  calibrationTable(): Promise<string | undefined>

  /**
   * Computes calibration curve from stored points and saves to flash.
   * Call after addCalibrationPoint() for zero and reference. Normal flow: i → i → j.
   */
  saveCalibration(): Promise<void>

  /**
   * Puts the device to sleep / shutdown.
   * @returns {Promise<void>} A Promise that resolves when the command is sent.
   */
  sleep(): Promise<void>

  /**
   * Reboots the device immediately.
   * Intended for diagnostic flows. Sends the firmware's required reboot-confirmation payload.
   */
  reboot(): Promise<void>

  /**
   * Set a new calibration block.
   * @warning Expert only. This will overwrite the current calibration curve.
   * @param curve - The 12-byte calibration block to set (3× float32 LE: slope, intercept, trim).
   */
  setCalibration(curve: Uint8Array): Promise<void>

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
   * Adds a calibration point by capturing the current live ADC reading.
   * Call with no load for zero point, then with known weight; then saveCalibration().
   */
  addCalibrationPoint(): Promise<void>

  /** True if tare() uses device hardware tare rather than software averaging. */
  readonly usesHardwareTare: true
}
