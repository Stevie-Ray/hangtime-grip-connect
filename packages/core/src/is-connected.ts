import { Device } from "./devices/types"

/**
 * Checks if a Bluetooth device is connected
 * @param board
 * @return boolean
 */
export const isConnected = (board: Device): boolean => {
  if (!board.device) return false
  return !!board.device.gatt?.connected
}
