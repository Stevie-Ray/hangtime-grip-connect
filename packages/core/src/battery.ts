import type { Device } from "./types/devices"
import { write } from "./write"
import { read } from "./read"
import { isConnected } from "./is-connected"
import { isForceBoard, isMotherboard, isProgressor } from "./is-device"
import { ProgressorCommands } from "./commands"

/**
 * Retrieves battery or voltage information from the device.
 * - For Motherboard devices, it reads the battery level.
 * - For Progressor devices, it sends a command to retrieve battery voltage information.
 *
 * @param {Device} board - The device from which to retrieve battery information.
 * @returns {Promise<string | undefined>} A Promise that resolves with the battery or voltage information,
 */
export const battery = async (board: Device): Promise<string | undefined> => {
  // Check if the device is connected
  if (isConnected(board)) {
    // If the device is connected and it is a Motherboard or Force Board device
    if (isMotherboard(board) || isForceBoard(board)) {
      // Read battery level information from the Motherboard
      return await read(board, "battery", "level", 250)
    }
    // If the device is connected and its name starts with "Progressor"
    if (isProgressor(board)) {
      // Write command to get battery voltage information to the Progressor
      let response: string | undefined = undefined
      await write(board, "progressor", "tx", ProgressorCommands.GET_BATT_VLTG, 250, (data) => {
        response = data
      })
      return response
    }
  }
  // If device is not found, return undefined
  return undefined
}
