import { Device } from "./devices/types"
import { write } from "./write"
import { isConnected } from "./is-connected"
import { Motherboard, Progressor } from "./devices"
import { MotherboardCommands, ProgressorCommands } from "./commands"

/**
 * read calibration
 * @param board
 */
export const stop = async (board: Device): Promise<void> => {
  if (isConnected(board)) {
    if (board.name === "Motherboard") {
      await write(Motherboard, "uart", "tx", MotherboardCommands.STOP_WEIGHT_MEAS, 0)
    }
    if (board.name && board.name.startsWith("Progressor")) {
      await write(Progressor, "progressor", "tx", ProgressorCommands.STOP_WEIGHT_MEAS, 0)
    }
  }
}
