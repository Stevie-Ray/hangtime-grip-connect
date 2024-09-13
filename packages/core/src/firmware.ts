import type { Device } from "./types/devices"
import { write } from "./write"
import { read } from "./read"
import { isConnected } from "./is-connected"
import { Motherboard, Progressor } from "./devices"
import { ProgressorCommands } from "./commands"

/**
 * Retrieves firmware version from the device.
 * - For Motherboard devices, it reads the firmare version.
 * - For Progressor devices, it sends a command to retrieve firware version.
 *
 * @param {Device} board - The device from which to retrieve firmware version.
 * @returns {Promise<string>} A Promise that resolves with the firmware version,
 *                            or rejects with an error if the device is not connected.
 * @throws {Error} Throws an error if the device is not connected.
 */
export const firmware = async (board: Device): Promise<string | undefined> => {
  // Check if the device is connected
  if (isConnected(board)) {
    // If the device is connected and it is a Motherboard device
    if (board.filters.some((filter) => filter.name === "Motherboard")) {
      // Read firmware version from the Motherboard
      return await read(Motherboard, "device", "firmware", 250)
    }
    // If the device is connected and its name starts with "Progressor"
    if (board.filters.some((filter) => filter.namePrefix === "Progressor")) {
      // Write command to get firmware version information to the Progressor
      let response: string | undefined = undefined
      await write(Progressor, "progressor", "tx", ProgressorCommands.GET_FW_VERSION, 250, (data) => {
        response = data
      })
      return response
    }
    // If device is not found, return undefined
    return
  }
  throw new Error("Not connected.")
}
