import type { IDevice } from "../device.interface.js"

export interface FrezDynoCoefficientLookupParams {
  /** Bluetooth device name used by Web Bluetooth clients. */
  deviceName?: string

  /** Public serial read from 0x2A25 by native clients. */
  deviceSerialNumber?: string
}

export type FrezDynoCoefficientLookup = (params: FrezDynoCoefficientLookupParams) => Promise<number>

export interface FrezDynoOptions {
  /**
   * Frez Developer Program access key. Keep it in FREZ_ACCESS_KEY or another
   * secure runtime configuration source instead of committing it.
   */
  accessKey?: string

  /** Device-specific coefficient returned by the Frez coefficient API. */
  coefficient?: number

  /**
   * Custom coefficient lookup, for example a server-side proxy used by a web
   * application. When omitted, the official Frez API is called directly.
   */
  coefficientLookup?: FrezDynoCoefficientLookup | null

  /** Optional serial override for native coefficient lookup. */
  deviceSerialNumber?: string
}

/**
 * Interface representing the Frez Dyno device, extending the base Device interface.
 */
export interface IFrezDyno extends IDevice {
  /**
   * Sets a device-specific coefficient manually.
   * @param coefficient - The linear coefficient `a` returned by Frez.
   */
  setCoefficient(coefficient: number): void

  /** Clears the configured or API-loaded coefficient. */
  clearCoefficient(): void

  /**
   * Sets an explicit serial number for native coefficient lookup.
   * Web Bluetooth uses the allowlisted Bluetooth name instead.
   */
  setDeviceSerialNumber(serialNumber: string | undefined): void

  /**
   * Retrieves battery level from the standard Battery service.
   * @returns A Promise that resolves with the battery percentage.
   */
  battery(): Promise<string | undefined>

  /** Compatibility alias for the standard Battery Level characteristic. */
  batteryVoltage(): Promise<string | undefined>

  /**
   * Retrieves firmware version from the standard Software Revision characteristic.
   * @returns A Promise that resolves with the firmware version.
   */
  firmware(): Promise<string | undefined>

  /**
   * Retrieves the serial number from the standard Device Information service.
   * @returns A Promise that resolves with the serial number.
   */
  serial(): Promise<string | undefined>

  /**
   * Retrieves software version from the standard Device Information service.
   * @returns A Promise that resolves with the software version.
   */
  software(): Promise<string | undefined>

  /**
   * Restarts the required sample-count tare while a measurement is active.
   * The duration argument is ignored because Frez protocol v1 uses exactly 100 samples.
   */
  tare(duration?: number): boolean

  /** Stops the current measurement session. */
  stop(): Promise<void>

  /**
   * Starts a new measurement session and establishes tare from the first 100
   * unloaded samples.
   */
  stream(duration?: number): Promise<void>

  /** False because tare is performed from raw samples in the client. */
  readonly usesHardwareTare: false
}
