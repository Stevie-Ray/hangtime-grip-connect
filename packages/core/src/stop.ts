import { Device } from "./devices/types"
import { Motherboard, Tindeq } from "./devices"
import { MotherboardCommands, TindeqCommands } from "./commands"
import { write } from "./write"

/**
 * read calibration
 * @param board
 */
export const stop = async (board: Device): Promise<void> => {
  if (!board.device) return
  if (board.device.gatt?.connected) {
    if (board.name === "Motherboard") {
      await write(Motherboard, "uart", "tx", String(MotherboardCommands.STOP_WEIGHT_MEAS), 0)
    }
    if (board.name === "Tindeq") {
      await write(Tindeq, "progressor", "tx", String(TindeqCommands.STOP_WEIGHT_MEAS), 0)
    }
  }
}
