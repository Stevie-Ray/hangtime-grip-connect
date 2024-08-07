import type { Device } from "./types/devices"
import { write } from "./write"
import { isConnected } from "./is-connected"
import { Motherboard, Progressor } from "./devices"
import { MotherboardCommands, ProgressorCommands } from "./commands"

/**
 * Stops the data stream on the specified device.
 * @param {Device} board - The device to stop the stream on.
 * @returns {Promise<void>} A promise that resolves when the stream is stopped.
 */
export const stop = async (board: Device): Promise<void> => {
  if (isConnected(board)) {
    if (board.filters.some((filter) => filter.name === "Motherboard")) {
      // Stop stream on Motherboard
      await write(Motherboard, "uart", "tx", MotherboardCommands.STOP_WEIGHT_MEAS, 0)
    }
    if (board.filters.some((filter) => filter.namePrefix === "Progressor")) {
      // Stop stream on Progressor
      await write(Progressor, "progressor", "tx", ProgressorCommands.STOP_WEIGHT_MEAS, 0)
    }
  }
}
