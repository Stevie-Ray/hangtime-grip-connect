import type { Device } from "./types/devices"
import { write } from "./write"
import { read } from "./read"
import { isConnected } from "./is-connected"
import { Motherboard, Progressor } from "./devices"
import { MotherboardCommands, ProgressorCommands } from "./commands"

/**
 * Retrieves device information.
 * @param {Device} board - The device to retrieve information from.
 * @returns {Promise<void>} A promise that resolves when the information retrieval is completed.
 */
export const info = async (board: Device): Promise<void> => {
  if (isConnected(board)) {
    if (board.filters.some((filter) => filter.name === "Motherboard")) {
      // Read manufacturer information
      console.log(await read(Motherboard, "device", "manufacturer", 250))
      // Read hardware version
      console.log(await read(Motherboard, "device", "hardware", 250))
      // Read firmware version
      console.log(await read(Motherboard, "device", "firmware", 250))
      // Get text from Motherboard
      await write(Motherboard, "uart", "tx", MotherboardCommands.GET_TEXT, 250)
      // Get serial number from Motherboard
      await write(Motherboard, "uart", "tx", MotherboardCommands.GET_SERIAL, 250)
    }
    if (board.filters.some((filter) => filter.namePrefix === "Progressor")) {
      // Get firmware version from Progressor
      await write(Progressor, "progressor", "tx", ProgressorCommands.GET_FW_VERSION, 250)
    }
  }
}
