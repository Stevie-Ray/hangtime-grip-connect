import { Device } from "./devices/types"
import { write } from "./write"
import { read } from "./read"
import { isConnected } from "./is-connected"
import { Motherboard, Progressor } from "./devices"
import { MotherboardCommands, ProgressorCommands } from "./commands"

/**
 * Get device information
 * @param board
 */
export const info = async (board: Device): Promise<void> => {
  if (isConnected(board)) {
    if (board.name === "Motherboard") {
      await read(Motherboard, "device", "manufacturer", 250)
      await read(Motherboard, "device", "hardware", 250)
      await read(Motherboard, "device", "firmware", 250)
      await write(Motherboard, "uart", "tx", MotherboardCommands.GET_TEXT, 250)
      await write(Motherboard, "uart", "tx", MotherboardCommands.GET_SERIAL, 250)
    }
    if (board.name && board.name.startsWith("Progressor")) {
      await write(Progressor, "progressor", "tx", ProgressorCommands.GET_FW_VERSION, 250)
    }
  }
}
