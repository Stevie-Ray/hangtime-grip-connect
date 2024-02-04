import { Device } from "./devices/types"
import { write } from "./write"
import { isConnected } from "./is-connected"
import { Motherboard, Tindeq } from "./devices"
import { MotherboardCommands, TindeqCommands } from "./commands"

/**
 * read calibration
 * @param board
 */
export const stop = async (board: Device): Promise<void> => {
  if (isConnected(board)) {
    if (board.name === "Motherboard") {
      await write(Motherboard, "uart", "tx", String(MotherboardCommands.STOP_WEIGHT_MEAS), 0)
    }
    if (board.name === "Tindeq") {
      await write(Tindeq, "progressor", "tx", String(TindeqCommands.STOP_WEIGHT_MEAS), 0)
    }
  }
}
