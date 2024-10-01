import type { Device } from "./models/device.model"
import { read } from "./read"
import { isEntralpi } from "./is-device"

/**
 * Retrieves software version from the device.
 * - For Entralpi devices, it reads the software version.
 *
 * @param {Device} board - The device from which to retrieve software version.
 * @returns {Promise<string>} A Promise that resolves with the software version,
 */
export const software = async (board: Device): Promise<string | undefined> => {
  // Check if the device is connected
  if (board.isConnected()) {
    // If the device is connected and it is a Entralpi device
    if (isEntralpi(board)) {
      // Read software version from the Entralpi
      return await read(board, "device", "software", 250)
    }
  }
  // If device is not found, return undefined
  return
}
