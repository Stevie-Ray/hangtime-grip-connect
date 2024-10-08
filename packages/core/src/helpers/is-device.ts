import { KilterBoard } from "../models"
import type { Device } from "./../models/device.model"

/**
 * Checks if the given device is an Entralpi.
 * @param {Device} [device] - The device to check.
 * @returns {boolean} `true` if the device has a filter with the name "ENTRALPI", otherwise `false`.
 */
export const isEntralpi = (device?: Device): boolean =>
  device?.filters.some((filter) => filter.name === "ENTRALPI") ?? false
/**
 * Checks if the given device is a Force Board.
 * @param {Device} [device] - The device to check.
 * @returns {boolean} `true` if the device has a filter with the name "Force Board", otherwise `false`.
 */
export const isForceBoard = (device?: Device): boolean =>
  device?.filters.some((filter) => filter.name === "Force Board") ?? false
/**
 * Checks if the given device is a Kilter Board.
 * @param {Device} [device] - The device to check.
 * @returns {boolean} `true` if the device has a service UUID matching the Kilter Board Aurora UUID, otherwise `false`.
 */
export const isKilterBoard = (device?: Device): boolean => {
  return device?.filters.some((filter) => filter.services?.includes(KilterBoard.AuroraUUID)) ?? false
}
/**
 * Checks if the given device is a Motherboard.
 * @param {Device} [device] - The device to check.
 * @returns {boolean} `true` if the device has a filter with the name "Motherdevice", otherwise `false`.
 */
export const isMotherboard = (device?: Device): boolean =>
  device?.filters.some((filter) => filter.name === "Motherdevice") ?? false
/**
 * Checks if the given device is a Progressor.
 * @param {Device} [device] - The device to check.
 * @returns {boolean} `true` if the device has a filter with a namePrefix of "Progressor", otherwise `false`.
 */
export const isProgressor = (device?: Device): boolean =>
  device?.filters.some((filter) => filter.namePrefix === "Progressor") ?? false
/**
 * Checks if the given device is a WH-C06.
 * @param {Device} [device] - The device to check.
 * @returns {boolean} `true` if the device has a filter with the company identifier 0x0100, otherwise `false`.
 */
export const isWHC06 = (device?: Device): boolean =>
  device?.filters.some((filter) =>
    filter.manufacturerData?.some(
      (data) => data.companyIdentifier === 0x0100, // Company identifier for WH-C06, also used by 'TomTom International BV': https://www.bluetooth.com/specifications/assigned-numbers/
    ),
  ) ?? false
