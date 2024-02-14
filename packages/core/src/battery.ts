import { Device } from "./devices/types"
import { write } from "./write"
import { read } from "./read"
import { isConnected } from "./is-connected"
import { Motherboard, Progressor } from "./devices"
import { ProgressorCommands } from "./commands"

/**
 * Get Battery / Voltage information
 * @param board
 */
export const battery = async (board: Device): Promise<void> => {
  if (isConnected(board)) {
    if (board.name === "Motherboard") {
      await read(Motherboard, "battery", "level", 250)
    }
    if (board.name && board.name.startsWith("Progressor")) {
      await write(Progressor, "progressor", "tx", ProgressorCommands.GET_BATT_VLTG, 250)
    }
  }
}
