import type { Device } from "./types/devices"
import { write } from "./write"
import { isConnected } from "./is-connected"
import { Motherboard } from "./devices"
import { MotherboardCommands } from "./commands"

/**
 * Retrieves the entire 320 bytes of non-volatile memory from the device.
 *
 * The memory consists of 10 segments, each 32 bytes long. If any segment was previously written,
 * the corresponding data will appear in the response. Unused portions of the memory are
 * padded with whitespace.
 *
 * @param {Device} board - The device from which to retrieve text information.
 * @returns {Promise<string>} A Promise that resolves with the 320-byte memory content as a string,
 *                            which includes both the written data and any unused, whitespace-padded segments.
 * @throws {Error} Throws an error if the device is not connected.
 */
export const text = async (board: Device): Promise<string | undefined> => {
  // Check if the device is connected
  if (isConnected(board)) {
    // If the device is connected and it is a Motherboard device
    if (board.filters.some((filter) => filter.name === "Motherboard")) {
      // Write text information command to the Motherboard and read output
      let response: string | undefined = undefined
      await write(Motherboard, "uart", "tx", MotherboardCommands.GET_TEXT, 250, (data) => {
        response = data
      })
      return response
    }
    // If device is not found, return undefined
    return
  }
  throw new Error("Not connected.")
}
