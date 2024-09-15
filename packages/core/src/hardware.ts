import type { Device } from "./types/devices"
import { read } from "./read"
import { isConnected } from "./is-connected"
import { isMotherboard } from "./is-device"

/**
 * Retrieves hardware version from the device.
 * - For Motherboard devices, it reads the hardware version.
 *
 * @param {Device} board - The device from which to retrieve hardware version.
 * @returns {Promise<string>} A Promise that resolves with the hardware version,
 */
export const hardware = async (board: Device): Promise<string | undefined> => {
  // Check if the device is connected
  if (isConnected(board)) {
    // If the device is connected and it is a Motherboard device
    if (isMotherboard(board)) {
      // Read hardware version from the Motherboard
      return await read(board, "device", "hardware", 250)
    }
  }
  // If device is not found, return undefined
  return
}
