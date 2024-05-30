import type { Device } from "./devices/types"
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
    if (board.name === "Motherboard") {
      // Read manufacturer information
      await read(Motherboard, "device", "manufacturer", 250)
      // Read hardware version
      await read(Motherboard, "device", "hardware", 250)
      // Read firmware version
      await read(Motherboard, "device", "firmware", 250)
      // Get text from Motherboard
      await write(Motherboard, "uart", "tx", MotherboardCommands.GET_TEXT, 250)
      // Get serial number from Motherboard
      await write(Motherboard, "uart", "tx", MotherboardCommands.GET_SERIAL, 250)
    }
    if (board.name && board.name.startsWith("Progressor")) {
      // Get firmware version from Progressor
      await write(Progressor, "progressor", "tx", ProgressorCommands.GET_FW_VERSION, 250)
    }
  }
}
