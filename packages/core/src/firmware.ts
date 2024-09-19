import type { Device } from "./types/devices"
import { write } from "./write"
import { read } from "./read"
import { isConnected } from "./is-connected"
import { ProgressorCommands } from "./commands"
import { isForceBoard, isMotherboard, isProgressor } from "./is-device"

/**
 * Retrieves firmware version from the device.
 * - For Motherboard devices, it reads the firmare version.
 * - For Progressor devices, it sends a command to retrieve firware version.
 *
 * @param {Device} board - The device from which to retrieve firmware version.
 * @returns {Promise<string>} A Promise that resolves with the firmware version,
 */
export const firmware = async (board: Device): Promise<string | undefined> => {
  // Check if the device is connected
  if (isConnected(board)) {
    // If the device is connected and it is a Motherboard or Force Board device
    if (isMotherboard(board) || isForceBoard(board)) {
      // Read firmware version from the Motherboard
      return await read(board, "device", "firmware", 250)
    }
    // If the device is connected and its name starts with "Progressor"
    if (isProgressor(board)) {
      // Write command to get firmware version information to the Progressor
      let response: string | undefined = undefined
      await write(board, "progressor", "tx", ProgressorCommands.GET_FW_VERSION, 250, (data) => {
        response = data
      })
      return response
    }
  }
  // If device is not found, return undefined
  return undefined
}
