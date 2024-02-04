import { isConnected } from "./is-connected";
import { write } from "./write";
import { stop } from "./stop";
import { Motherboard, Tindeq } from "./devices";
import { MotherboardCommands, TindeqCommands } from "./commands";
import { CALIBRATION } from "./data";
import { calibration } from "./calibration";
/**
 * stream output
 * @param board
 */
export const stream = async (board, duration = 0) => {
    if (isConnected(board)) {
        if (board.name === "Motherboard") {
            // read calibration (required before reading data)
            if (!CALIBRATION[0].length) {
                await calibration(Motherboard);
            }
            // start stream
            await write(Motherboard, "uart", "tx", String(MotherboardCommands.START_WEIGHT_MEAS), duration);
            // end stream if duration is set
            if (duration !== 0) {
                await stop(Motherboard);
            }
        }
        if (board.name === "Tindeq") {
            // start stream
            await write(Tindeq, "progressor", "tx", String(TindeqCommands.START_WEIGHT_MEAS), duration);
            // end stream if duration is set
            if (duration !== 0) {
                await stop(Tindeq);
            }
        }
    }
};
