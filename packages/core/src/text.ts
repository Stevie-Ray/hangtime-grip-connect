import type { Device } from "./types/devices"
import { write } from "./write"
import { isConnected } from "./is-connected"
import { isMotherboard } from "./is-device"
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
 */
export const text = async (board: Device): Promise<string | undefined> => {
  // Check if the device is connected
  if (isConnected(board)) {
    // If the device is connected and it is a Motherboard device
    if (isMotherboard(board)) {
      // Write text information command to the Motherboard and read output
      let response: string | undefined = undefined
      await write(board, "uart", "tx", MotherboardCommands.GET_TEXT, 250, (data) => {
        response = data
      })
      return response
    }
  }
  // If device is not found, return undefined
  return undefined
}
