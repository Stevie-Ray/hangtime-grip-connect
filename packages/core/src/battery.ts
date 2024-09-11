import type { Device } from "./types/devices"
import { write } from "./write"
import { read } from "./read"
import { isConnected } from "./is-connected"
import { Motherboard, Progressor } from "./devices"
import { ProgressorCommands } from "./commands"

/**
 * Retrieves battery or voltage information from the device.
 * @param {Device} board - The device.
 * @returns {Promise<void>} A Promise that resolves when the information is successfully retrieved.
 */
export const battery = async (board: Device): Promise<void> => {
  // Check if the device is connected
  if (isConnected(board)) {
    // If the device is connected and it is a Motherboard device
    if (board.filters.some((filter) => filter.name === "Motherboard")) {
      // Read battery level information from the Motherboard
      console.log(await read(Motherboard, "battery", "level", 250))
    }
    // If the device is connected and its name starts with "Progressor"
    if (board.filters.some((filter) => filter.namePrefix === "Progressor")) {
      // Write command to get battery voltage information to the Progressor
      await write(Progressor, "progressor", "tx", ProgressorCommands.GET_BATT_VLTG, 250)
    }
  }
}
