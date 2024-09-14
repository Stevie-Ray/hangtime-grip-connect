import type { Device } from "./types/devices"
import { AuroraUUID } from "./devices/kilterboard"

/**
 * Checks if the given device is a Motherboard.
 * @param {Device} [board] - The device to check.
 * @returns {boolean} `true` if the device has a filter with the name "Motherboard", otherwise `false`.
 */
export const isMotherboard = (board?: Device): boolean =>
  board?.filters.some((filter) => filter.name === "Motherboard") ?? false

/**
 * Checks if the given device is a Progressor.
 * @param {Device} [board] - The device to check.
 * @returns {boolean} `true` if the device has a filter with a namePrefix of "Progressor", otherwise `false`.
 */
export const isProgressor = (board?: Device): boolean =>
  board?.filters.some((filter) => filter.namePrefix === "Progressor") ?? false

/**
 * Checks if the given device is an Entralpi device.
 * @param {Device} [board] - The device to check.
 * @returns {boolean} `true` if the device has a filter with the name "ENTRALPI", otherwise `false`.
 */
export const isEntralpi = (board?: Device): boolean =>
  board?.filters.some((filter) => filter.name === "ENTRALPI") ?? false

/**
 * Checks if the given device is a Kilterboard.
 * @param {Device} [board] - The device to check.
 * @returns {boolean} `true` if the device has a service UUID matching the Kilterboard Aurora UUID, otherwise `false`.
 */
export const isKilterboard = (board?: Device): boolean => {
  return board?.filters.some((filter) => filter.services?.includes(AuroraUUID)) ?? false
}
