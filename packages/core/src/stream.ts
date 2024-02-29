import { Device } from "./devices/types"
import { isConnected } from "./is-connected"
import { write } from "./write"
import { stop } from "./stop"
import { Motherboard, Progressor } from "./devices"
import { MotherboardCommands, ProgressorCommands } from "./commands"
import { emptyDownloadPackets } from "./download"
import { CALIBRATION } from "./data"
import { calibration } from "./calibration"

/**
 * Starts streaming data from the specified device.
 * @param {Device} board - The device to stream data from.
 * @param {number} [duration=0] - The duration of the stream in milliseconds. If set to 0, stream will continue indefinitely.
 * @returns {Promise<void>} A promise that resolves when the streaming operation is completed.
 */
export const stream = async (board: Device, duration: number = 0): Promise<void> => {
  if (isConnected(board)) {
    // Reset download packets
    emptyDownloadPackets()
    // Device specific logic
    if (board.name === "Motherboard") {
      // Read calibration data if not already available
      if (!CALIBRATION[0].length) {
        await calibration(Motherboard)
      }
      // Start streaming data
      await write(Motherboard, "uart", "tx", MotherboardCommands.START_WEIGHT_MEAS, duration)
      // Stop streaming if duration is set
      if (duration !== 0) {
        await stop(Motherboard)
      }
    }
    if (board.name && board.name.startsWith("Progressor")) {
      // Start streaming data
      await write(Progressor, "progressor", "tx", ProgressorCommands.START_WEIGHT_MEAS, duration)
      // Stop streaming if duration is set
      if (duration !== 0) {
        await stop(Progressor)
      }
    }
  }
}
