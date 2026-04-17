/**
 * Represents the available commands for various devices such as the Motherboard and Tindeq Progressor.
 */
export interface Commands {
  // Motherboard, Progressor

  /**
   * Starts a weight measurement on the device.
   * Used to begin collecting weight or force data.
   */
  START_WEIGHT_MEAS?: string | Uint8Array

  /**
   * Stops the current weight measurement on the device.
   * Used to end the data collection.
   */
  STOP_WEIGHT_MEAS?: string | Uint8Array

  /**
   * Puts the device to sleep or in a low-power mode.
   * The format can be a string or a number depending on the device.
   */
  SLEEP?: number | string | Uint8Array

  /**
   * Retrieves the serial number of the device.
   * This command fetches the unique identifier assigned by the manufacturer.
   */
  GET_SERIAL?: string | Uint8Array

  // Griptonite Motherboard

  /**
   * Retrieves textual information from the device.
   * May include readable data.
   */
  GET_TEXT?: string | Uint8Array

  /**
   * Starts or stops a debug data stream from the device.
   * Used for diagnostic purposes or to monitor real-time data.
   */
  DEBUG_STREAM?: string | Uint8Array

  /**
   * Retrieves calibration data from the device.
   * Used to ensure accurate measurements by applying calibration points.
   */
  GET_CALIBRATION?: string | Uint8Array

  // Force Board Portable

  /**
   * Sets the Force Board into Quick Start mode.
   * In this mode, data transmission starts when force exceeds the threshold
   * and stops when force drops below the threshold.
   */
  START_QUICK_MEAS?: string | Uint8Array

  // Tindeq Progressor

  /**
   * Tares the scale, zeroing the current weight measurement.
   * Used to reset the baseline for weight data.
   */
  TARE_SCALE?: string | Uint8Array

  /**
   * Starts measuring the peak rate of force development (RFD).
   * Captures how quickly force is applied over time.
   */
  START_PEAK_RFD_MEAS?: string | Uint8Array

  /**
   * Starts measuring a series of peak RFD measurements.
   * This captures multiple RFD data points over a period of time.
   */
  START_PEAK_RFD_MEAS_SERIES?: string | Uint8Array

  /**
   * Adds a calibration point to the device.
   * Used to improve the accuracy of future measurements.
   */
  ADD_CALIBRATION_POINT?: string | Uint8Array

  /**
   * Saves the current calibration settings to the device.
   * Ensures the device remembers the calibration for future sessions.
   */
  SAVE_CALIBRATION?: string | Uint8Array

  /**
   * Retrieves the firmware version of the device.
   * Useful for ensuring compatibility and tracking updates.
   */
  GET_FIRMWARE_VERSION?: string | Uint8Array

  /**
   * Retrieves error information from the device.
   * Provides details on any faults or issues that occurred during operation.
   */
  GET_ERROR_INFORMATION?: string | Uint8Array

  /**
   * Clears the error information on the device.
   * Used to reset error logs after troubleshooting or repair.
   */
  CLR_ERROR_INFORMATION?: string | Uint8Array

  /**
   * Retrieves the battery voltage level of the device.
   * Provides insight into the device's remaining battery power.
   */
  GET_BATTERY_VOLTAGE?: string | Uint8Array

  /**
   * Retrieves a temperature reading from the device.
   */
  GET_TEMPERATURE?: string | Uint8Array

  /**
   * Retrieves the current weight from the device.
   */
  GET_WEIGHT?: string | Uint8Array

  /**
   * Sets the device capacity/range.
   * Payload selects the target range.
   */
  SET_RANGE?: string | number | Uint8Array

  /**
   * Sets the display division value.
   * Payload selects the target division.
   */
  SET_DIVISION?: string | number | Uint8Array

  /**
   * Sets the first calibration reference weight.
   * Payload selects the target calibration mass.
   */
  SET_FIRST_CALIBRATION_WEIGHT?: string | number | Uint8Array

  /**
   * Sets the second calibration reference weight.
   * Payload selects the target calibration mass.
   */
  SET_SECOND_CALIBRATION_WEIGHT?: string | number | Uint8Array

  /**
   * Runs the no-load calibration routine.
   */
  NO_LOAD_CALIBRATION?: string | Uint8Array

  /**
   * Runs the first calibration step after the reference mass is applied.
   */
  RUN_FIRST_CALIBRATION?: string | Uint8Array

  /**
   * Runs the second calibration step after the reference mass is applied.
   */
  RUN_SECOND_CALIBRATION?: string | Uint8Array

  /**
   * Configures the automatic shutdown timer.
   * Payload selects the timeout or disables it.
   */
  SET_SHUTDOWN_TIME?: string | number | Uint8Array

  /**
   * Configures the upper temperature limit threshold.
   */
  SET_UPPER_TEMPERATURE_LIMIT?: string | number | Uint8Array

  /**
   * Configures the lower temperature limit threshold.
   */
  SET_LOWER_TEMPERATURE_LIMIT?: string | number | Uint8Array

  /**
   * Configures the upper/max weight limit threshold.
   */
  SET_MAX_WEIGHT_LIMIT?: string | number | Uint8Array

  /**
   * Configures the lower/min weight limit threshold.
   */
  SET_MIN_WEIGHT_LIMIT?: string | number | Uint8Array

  /**
   * Configures the weight-alarm behavior for the configured upper/lower thresholds.
   */
  SET_WEIGHT_ALARM_MODE?: string | number | Uint8Array

  /**
   * Enables or disables alarm-frame output over the serial/BLE transport.
   */
  SET_ALARM_OUTPUT?: string | number | Uint8Array

  /**
   * Get the Progressor ID.
   */
  GET_PROGRESSOR_ID?: string | Uint8Array

  /**
   * Set calibration block. Payload at offsets +2,+6,+10.
   * The 12-byte block is interpreted as 3× float32 LE: slope, intercept, trim.
   */
  SET_CALIBRATION?: string | Uint8Array

  /**
   * Retrieves the advanced calibration table from the device.
   * Used to inspect the hidden piecewise interpolation table exported by v2 firmware.
   */
  GET_CALIBRATION_TABLE?: string | Uint8Array

  /**
   * Controls whether the device resets to zero on power-up.
   */
  POWER_ON_RESET?: string | number | Uint8Array

  /**
   * Updates the device's hardware zero point.
   */
  ZERO_SCALE?: string | number | Uint8Array

  /**
   * Toggles the device's peak mode.
   */
  PEAK_MODE?: string | number | Uint8Array

  /**
   * Configures the device UART baud rate.
   */
  SET_BAUD_RATE?: string | number | Uint8Array

  /**
   * Configures the device sampling rate.
   */
  SET_SAMPLING_RATE?: string | number | Uint8Array

  /**
   * Reboots the device immediately.
   * Intended for diagnostic flows.
   */
  REBOOT?: string | Uint8Array
}
