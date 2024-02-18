import { Device } from "./devices/types"
import { isConnected } from "./is-connected"

/**
 * Disconnects the device if it is connected.
 * @param {Device} board - The device to disconnect.
 */
export const disconnect = (board: Device): void => {
  // Check if the device is connected
  if (isConnected(board)) {
    // Disconnect the device using optional chaining
    board.device?.gatt?.disconnect()
  }
}
