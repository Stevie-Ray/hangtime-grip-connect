import { Device } from "./types"

/**
 * disconnect
 * @param board
 */
export const disconnect = (board: Device): void => {
  if (!board.device) return
  if (board.device.gatt?.connected) {
    board.device.gatt?.disconnect()
  }
}
