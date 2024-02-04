import { Device } from "./devices/types"
import { isConnected } from "./is-connected"

/**
 * disconnect
 * @param board
 */
export const disconnect = (board: Device): void => {
  if (isConnected(board)) {
    board.device?.gatt?.disconnect()
  }
}
