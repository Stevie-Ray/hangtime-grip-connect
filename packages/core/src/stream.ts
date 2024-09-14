import type { Device } from "./types/devices"
import { isConnected } from "./is-connected"
import { write } from "./write"
import { stop } from "./stop"
import { isMotherboard, isProgressor } from "./is-device"
import { MotherboardCommands, ProgressorCommands } from "./commands"
import { emptyDownloadPackets } from "./download"
import { CALIBRATION } from "./data/motherboard"
import { calibration } from "./calibration"

/**
 * Starts streaming data from the specified device.
 * @param {Device} board - The device to stream data from.
 * @param {number} [duration=0] - The duration of the stream in milliseconds. If set to 0, stream will continue indefinitely.
 * @returns {Promise<void>} A promise that resolves when the streaming operation is completed.
 */
export const stream = async (board: Device, duration = 0): Promise<void> => {
  if (isConnected(board)) {
    // Reset download packets
    emptyDownloadPackets()
    // Device specific logic
    if (isMotherboard(board)) {
      // Read calibration data if not already available
      if (!CALIBRATION[0].length) {
        await calibration(board)
      }
      // Start streaming data
      await write(board, "uart", "tx", MotherboardCommands.START_WEIGHT_MEAS, duration)
      // Stop streaming if duration is set
      if (duration !== 0) {
        await stop(board)
      }
    }
    if (isProgressor(board)) {
      // Start streaming data
      await write(board, "progressor", "tx", ProgressorCommands.START_WEIGHT_MEAS, duration)
      // Stop streaming if duration is set
      if (duration !== 0) {
        await stop(board)
      }
    }
  }
}
