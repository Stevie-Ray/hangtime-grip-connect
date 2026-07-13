import type { IDevice } from "../device.interface.js"

export interface FrezDynoCalibrationPoint {
  /** Raw sensor count as emitted by the Frez Dyno. */
  raw: number

  /** Calibrated load in kilograms for the raw sensor count. */
  weight: number
}

export interface FrezDynoCalibrationData {
  points: FrezDynoCalibrationPoint[]
  actualSampleRate?: number
  zeroOffset?: number
}

export type FrezDynoPacketFormat = "auto" | "float" | "raw"

export interface FrezDynoCalibrationLookupParams {
  deviceId?: string
  deviceName?: string
  deviceSerialNumber?: string
}

export type FrezDynoCalibrationLookup = (
  params: FrezDynoCalibrationLookupParams,
) => Promise<FrezDynoCalibrationPoint[] | FrezDynoCalibrationData | null>

export interface FrezDynoOptions {
  /**
   * Device-specific calibration points used to convert raw sensor counts to kg.
   * The official Frez app loads these per device before starting measurements.
   */
  calibrationPoints?: FrezDynoCalibrationPoint[]

  /**
   * Optional serial number to use when loading factory calibration.
   */
  deviceSerialNumber?: string

  /**
   * Loads factory calibration by device name/serial. Defaults to the Frez app's
   * public calibration RPC; pass null to disable automatic lookup.
   */
  calibrationLookup?: FrezDynoCalibrationLookup | null

  /**
   * Notification payload format. Defaults to "raw" because the official Frez
   * app receives ADC values and converts them with device calibration points.
   * Use "float" or "auto" only for compatibility experiments.
   */
  packetFormat?: FrezDynoPacketFormat

  /**
   * Require calibration before stream() starts. Defaults to true except when
   * packetFormat is explicitly "float".
   */
  requireCalibration?: boolean

  /**
   * Actual device sample rate used to scale Frez packet counters to time.
   * Defaults to the native app's 250 Hz fallback.
   */
  actualSampleRate?: number
}

/**
 * Interface representing the Frez Dyno device, extending the base Device interface.
 */
export interface IFrezDyno extends IDevice {
  /**
   * Sets calibration points used to convert Frez raw sensor counts to kilograms.
   * @param {FrezDynoCalibrationPoint[]} points - At least two unique raw/weight points.
   */
  setRawCalibration(points: FrezDynoCalibrationPoint[]): void

  /**
   * Clears Frez raw sensor calibration points.
   */
  clearRawCalibration(): void

  /**
   * Sets an explicit serial number for factory-calibration lookup.
   * This is needed on Web Bluetooth, which blocks the standard serial characteristic.
   * Changing the serial invalidates factory-loaded calibration while preserving manual calibration points.
   */
  setDeviceSerialNumber(serialNumber: string | undefined): void

  /**
   * Retrieves battery level from the standard Battery service.
   * @returns {Promise<string | undefined>} A Promise that resolves with the battery percentage.
   */
  battery(): Promise<string | undefined>

  /**
   * Compatibility alias for the standard Battery Level characteristic.
   * The Frez app does not send a battery-voltage command.
   */
  batteryVoltage(): Promise<string | undefined>

  /**
   * Retrieves firmware version from the standard Software Revision characteristic.
   * @returns {Promise<string | undefined>} A Promise that resolves with the firmware version.
   */
  firmware(): Promise<string | undefined>

  /**
   * Retrieves the serial number from the standard Device Information service.
   * @returns {Promise<string | undefined>} A Promise that resolves with the serial number.
   */
  serial(): Promise<string | undefined>

  /**
   * Retrieves software version from the standard Device Information service.
   * @returns {Promise<string | undefined>} A Promise that resolves with the software version.
   */
  software(): Promise<string | undefined>

  /**
   * Stops the data stream on the Frez Dyno.
   * @returns {Promise<void>} A promise that resolves when the stream is stopped.
   */
  stop(): Promise<void>

  /**
   * Starts streaming data from the Frez Dyno.
   * @param {number} [duration=0] - The duration of the stream in milliseconds. If set to 0, stream will continue indefinitely.
   * @returns {Promise<void>} A promise that resolves when the streaming operation is completed.
   */
  stream(duration?: number): Promise<void>

  /** False because the Frez app tares in software during an active measurement. */
  readonly usesHardwareTare: false
}
