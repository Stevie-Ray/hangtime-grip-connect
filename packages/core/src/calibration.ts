import { Device } from "./devices/types"
import { isConnected } from "./is-connected"
import { write } from "./write"
import { Motherboard } from "./devices"
import { MotherboardCommands } from "./commands"

/**
 * Writes a command to get calibration data from the device.
 * @param {Device} board - The device.
 * @returns {Promise<void>} A Promise that resolves when the command is successfully sent.
 */
export const calibration = async (board: Device): Promise<void> => {
  // Check if the device is connected
  if (isConnected(board)) {
    // If the device is connected, and it is a Motherboard device
    if (board.name === "Motherboard") {
      // Write the command to get calibration data to the device
      await write(Motherboard, "uart", "tx", MotherboardCommands.GET_CALIBRATION, 2500)
    }
  }
}
