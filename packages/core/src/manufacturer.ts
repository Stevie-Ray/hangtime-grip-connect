import type { Device } from "./types/devices"
import { read } from "./read"
import { isConnected } from "./is-connected"
import { Motherboard } from "./devices"

/**
 * Retrieves manufacturer information from the device.
 * - For Motherboard devices, it reads the manufacturer information.
 *
 * @param {Device} board - The device from which to retrieve manufacturer information.
 * @returns {Promise<string>} A Promise that resolves with the manufacturer information,
 *                            or rejects with an error if the device is not connected.
 * @throws {Error} Throws an error if the device is not connected.
 */
export const manufacturer = async (board: Device): Promise<string | undefined> => {
  // Check if the device is connected
  if (isConnected(board)) {
    // If the device is connected and it is a Motherboard device
    if (board.filters.some((filter) => filter.name === "Motherboard")) {
      // Read manufacturer information from the Motherboard
      return await read(Motherboard, "device", "manufacturer", 250)
    }
    // If device is not found, return undefined
    return
  }
  throw new Error("Not connected.")
}
