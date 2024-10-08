/**
 * Represents the available commands for various devices such as the Motherboard and Tindeq Progressor.
 */
export interface Commands {
  // Motherboard, Progressor

  /**
   * Starts a weight measurement on the device.
   * Used to begin collecting weight or force data.
   */
  START_WEIGHT_MEAS?: string

  /**
   * Stops the current weight measurement on the device.
   * Used to end the data collection.
   */
  STOP_WEIGHT_MEAS?: string

  /**
   * Puts the device to sleep or in a low-power mode.
   * The format can be a string or a number depending on the device.
   */
  SLEEP?: number | string

  /**
   * Retrieves the serial number of the device.
   * This command fetches the unique identifier assigned by the manufacturer.
   */
  GET_SERIAL?: string

  // Griptonite Motherboard

  /**
   * Retrieves textual information from the device.
   * May include readable data.
   */
  GET_TEXT?: string

  /**
   * Starts or stops a debug data stream from the device.
   * Used for diagnostic purposes or to monitor real-time data.
   */
  DEBUG_STREAM?: string

  /**
   * Retrieves calibration data from the device.
   * Used to ensure accurate measurements by applying calibration points.
   */
  GET_CALIBRATION?: string

  // Tindeq Progressor

  /**
   * Tares the scale, zeroing the current weight measurement.
   * Used to reset the baseline for weight data.
   */
  TARE_SCALE?: string

  /**
   * Starts measuring the peak rate of force development (RFD).
   * Captures how quickly force is applied over time.
   */
  START_PEAK_RFD_MEAS?: string

  /**
   * Starts measuring a series of peak RFD measurements.
   * This captures multiple RFD data points over a period of time.
   */
  START_PEAK_RFD_MEAS_SERIES?: string

  /**
   * Adds a calibration point to the device.
   * Used to improve the accuracy of future measurements.
   */
  ADD_CALIB_POINT?: string

  /**
   * Saves the current calibration settings to the device.
   * Ensures the device remembers the calibration for future sessions.
   */
  SAVE_CALIB?: string

  /**
   * Retrieves the firmware version of the device.
   * Useful for ensuring compatibility and tracking updates.
   */
  GET_FW_VERSION?: string

  /**
   * Retrieves error information from the device.
   * Provides details on any faults or issues that occurred during operation.
   */
  GET_ERR_INFO?: string

  /**
   * Clears the error information on the device.
   * Used to reset error logs after troubleshooting or repair.
   */
  CLR_ERR_INFO?: string

  /**
   * Retrieves the battery voltage level of the device.
   * Provides insight into the device's remaining battery power.
   */
  GET_BATT_VLTG?: string
}
