import type { Device } from "./devices/types"

/**
 * Checks if a Bluetooth device is connected.
 * @param {Device} board - The device to check for connection.
 * @returns {boolean} A boolean indicating whether the device is connected.
 */
export const isConnected = (board?: Device): boolean => {
  // Check if the device is defined and available
  if (!board?.device) {
    return false
  }
  // Check if the device is connected using optional chaining
  return !!board.device.gatt?.connected
}
