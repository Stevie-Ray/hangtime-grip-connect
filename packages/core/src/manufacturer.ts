import type { Device } from "./models/device.model"
import { read } from "./read"
import { isForceBoard, isMotherboard } from "./is-device"

/**
 * Retrieves manufacturer information from the device.
 * - For Motherboard and Froce Board devices, it reads the manufacturer information.
 *
 * @param {Device} board - The device from which to retrieve manufacturer information.
 * @returns {Promise<string>} A Promise that resolves with the manufacturer information,
 */
export const manufacturer = async (board: Device): Promise<string | undefined> => {
  // Check if the device is connected
  if (board.isConnected()) {
    // If the device is connected and it is a Motherboard or Force Board device
    if (isMotherboard(board) || isForceBoard(board)) {
      // Read manufacturer information from the Motherboard
      return await read(board, "device", "manufacturer", 250)
    }
  }
  // If device is not found, return undefined
  return undefined
}
