import type { Device } from "./types/devices"
import { write } from "./write"
import { isConnected } from "./is-connected"
import { MotherboardCommands } from "./commands"
import { isMotherboard } from "./is-device"

/**
 * Retrieves serial number from the device.
 * - For Motherboard devices, it reads the serial number.
 *
 * @param {Device} board - The device from which to retrieve serial number.
 * @returns {Promise<string>} A Promise that resolves with the serial number,
 *                            or rejects with an error if the device is not connected.
 * @throws {Error} Throws an error if the device is not connected.
 */
export const serial = async (board: Device): Promise<string | undefined> => {
  // Check if the device is connected
  if (isConnected(board)) {
    // If the device is connected and it is a Motherboard device
    if (isMotherboard(board)) {
      // Write serial number command to the Motherboard and read output
      let response: string | undefined = undefined
      await write(board, "uart", "tx", MotherboardCommands.GET_SERIAL, 250, (data) => {
        response = data
      })
      return response
    }
    // If device is not found, return undefined
    return
  }
  throw new Error("Not connected.")
}
