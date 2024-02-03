import { Motherboard, Tindeq } from "./devices";
import { MotherboardCommands, TindeqCommands } from "./commands";
import { write } from "./write";
import { stop } from "./stop";
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
            await write(Motherboard, "uart", "tx", String(MotherboardCommands.START_WEIGHT_MEAS), duration);
            // end stream
            if (duration !== 0) {
                await stop(Motherboard);
            }
        }
        if (board.name === "Tindeq") {
            // start stream
            await write(Tindeq, "progressor", "tx", String(TindeqCommands.START_WEIGHT_MEAS), duration);
            // end stream
            if (duration !== 0) {
                await stop(Tindeq);
            }
        }
    }
};
