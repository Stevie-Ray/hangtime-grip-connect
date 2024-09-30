import type { IDevice } from "../device.interface"

export interface IMotherboard extends IDevice {
  /**
   * Applies calibration to a sample value.
   * @param sample - The sample value to calibrate.
   * @param calibration - The calibration data.
   * @returns The calibrated sample value.
   */
  applyCalibration(sample: number, calibration: number[][]): number
}
