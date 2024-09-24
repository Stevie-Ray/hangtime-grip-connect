import type { Device } from "./types/devices"
import { read } from "./read"
import { isConnected } from "./is-connected"
import { isForceBoard } from "./is-device"


/**
 * Retrieves humidity level from the device.
 * - For Force Board devices, it reads the humidity level.
 *
 * @param {Device} board - The device from which to retrieve humidity level.
 * @returns {Promise<string>} A Promise that resolves with the humidity level,
 */
export const humidity = async (board: Device): Promise<string | undefined> => {
  // Check if the device is connected
  if (isConnected(board)) {
    // If the device is connected and it is a Force Board device
    if (isForceBoard(board)) {
      // Read firmware version from the Force Board
      return await read(board, "humidity", "level", 250)
    }
  }
  // If device is not found, return undefined
  return undefined
}
