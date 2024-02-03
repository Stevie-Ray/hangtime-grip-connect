import { Motherboard } from "./devices";
import { MotherboardCommands } from "./commands";
import { write } from "./write";
/**
 * write command to get calibration
 * @param board
 */
export const calibration = async (board) => {
    if (!board.device)
        return;
    if (board.device.gatt?.connected) {
        if (board.name === "Motherboard") {
            await write(Motherboard, "uart", "tx", String(MotherboardCommands.GET_CALIBRATION), 2500);
        }
    }
};
