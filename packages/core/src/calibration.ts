import { Device } from "./devices/types"
import { isConnected } from "./is-connected"
import { write } from "./write"
import { Motherboard } from "./devices"
import { MotherboardCommands } from "./commands"

/**
 * write command to get calibration
 * @param board
 */
export const calibration = async (board: Device): Promise<void> => {
  if (isConnected(board)) {
    if (board.name === "Motherboard") {
      await write(Motherboard, "uart", "tx", String(MotherboardCommands.GET_CALIBRATION), 2500)
    }
  }
}
