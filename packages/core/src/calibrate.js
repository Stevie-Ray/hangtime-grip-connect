import { Motherboard } from "./devices";
import { write } from "./write";
/**
 * read calibration
 * @param board
 */
export const calibrate = async (board) => {
    if (!board.device)
        return;
    if (board.device.gatt?.connected) {
        if (board.name === "Motherboard") {
            await write(Motherboard, "uart", "tx", "C", 2500);
        }
    }
};
