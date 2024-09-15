import type { Device } from "./types/devices"
import { isConnected } from "./is-connected"

/**
 * Disconnects the device if it is currently connected.
 * - Checks if the device is connected via its GATT server.
 * - If the device is connected, it attempts to gracefully disconnect.
 * @param {Device} board - The device to be disconnected. The device must have a `gatt` property accessible through `board.device`.
 */
export const disconnect = (board: Device): void => {
  // Verify that the device is connected using the provided helper function
  if (isConnected(board)) {
    // Safely attempt to disconnect the device's GATT server, if available
    board.device?.gatt?.disconnect()
  }
}
