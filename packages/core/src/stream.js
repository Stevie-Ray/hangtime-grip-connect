import { Motherboard, Tindeq } from "./devices";
import { write } from "./write";
/**
 * stream output
 * @param board
 */
export const stream = async (board, duration = 0) => {
    if (!board.device)
        return;
    if (board.device.gatt?.connected) {
        if (board.name === "Motherboard") {
            // TODO: add check if device is recalibrated
            // start stream
            await write(Motherboard, "uart", "tx", "S30", duration);
            // end stream
            await write(Motherboard, "uart", "tx", "", 0);
        }
        if (board.name === "Tindeq") {
            // start stream
            await write(Tindeq, "progressor", "tx", "e", duration);
            // end stream
            await write(Tindeq, "progressor", "tx", "f", 0);
        }
    }
};
