import type { Device } from "./models/device.model"
import { read } from "./read"
import { isEntralpi } from "./is-device"

/**
 * Retrieves model number from the device.
 * - For Entralpi devices, it reads the model number.
 *
 * @param {Device} board - The device from which to retrieve model number
 * @returns {Promise<string>} A Promise that resolves with the model number,
 */
export const model = async (board: Device): Promise<string | undefined> => {
  // Check if the device is connected
  if (board.isConnected()) {
    // If the device is connected and it is a Entralpi device
    if (isEntralpi(board)) {
      // Read model number from the Entralpi
      return await read(board, "device", "model", 250)
    }
  }
  // If device is not found, return undefined
  return
}
