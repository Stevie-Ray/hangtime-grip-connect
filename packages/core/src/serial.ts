import type { Device } from "./types/devices"
import { write } from "./write"
import { isConnected } from "./is-connected"
import { MotherboardCommands } from "./commands"
import { isForceBoard, isMotherboard } from "./is-device"
import { read } from "./read"

/**
 * Retrieves serial number from the device.
 * - For Motherboard devices, it reads the serial number.
 *
 * @param {Device} board - The device from which to retrieve serial number.
 * @returns {Promise<string>} A Promise that resolves with the serial number,
 */
export const serial = async (board: Device): Promise<string | undefined> => {
  // Check if the device is connected
  if (isConnected(board)) {
    // If the device is connected and it is a Force Board device
    if (isForceBoard(board)) {
      // Read firmware version from the Motherboard
      return await read(board, "device", "serial", 250)
    }
    // If the device is connected and it is a Motherboard device
    if (isMotherboard(board)) {
      // Write serial number command to the Motherboard and read output
      let response: string | undefined = undefined
      await write(board, "uart", "tx", MotherboardCommands.GET_SERIAL, 250, (data) => {
        response = data
      })
      return response
    }
  }
  // If device is not found, return undefined
  return undefined
}
