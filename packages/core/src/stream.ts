import { Device } from "./devices/types"
import { isConnected } from "./is-connected"
import { write } from "./write"
import { stop } from "./stop"
import { Motherboard, Progressor } from "./devices"
import { MotherboardCommands, ProgressorCommands } from "./commands"
import { CALIBRATION } from "./data"
import { calibration } from "./calibration"

/**
 * stream output
 * @param board
 */
export const stream = async (board: Device, duration: number = 0): Promise<void> => {
  if (isConnected(board)) {
    if (board.name === "Motherboard") {
      // read calibration (required before reading data)
      if (!CALIBRATION[0].length) {
        await calibration(Motherboard)
      }
      // start stream
      await write(Motherboard, "uart", "tx", MotherboardCommands.START_WEIGHT_MEAS, duration)
      // end stream if duration is set
      if (duration !== 0) {
        await stop(Motherboard)
      }
    }
    if (board.name && board.name.startsWith("Progressor")) {
      // start stream
      await write(Progressor, "progressor", "tx", ProgressorCommands.START_WEIGHT_MEAS, duration)
      // end stream if duration is set
      if (duration !== 0) {
        await stop(Progressor)
      }
    }
  }
}
