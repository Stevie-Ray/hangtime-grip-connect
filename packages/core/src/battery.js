import { write } from "./write";
import { read } from "./read";
import { isConnected } from "./is-connected";
import { Motherboard, Tindeq } from "./devices";
import { TindeqCommands } from "./commands";
/**
 * Get Battery / Voltage information
 * @param board
 */
export const battery = async (board) => {
    if (isConnected(board)) {
        if (board.name === "Motherboard") {
            await read(Motherboard, "battery", "level", 250);
        }
        if (board.name === "Tindeq") {
            await write(Tindeq, "progressor", "tx", String(TindeqCommands.GET_BATT_VLTG), 250);
        }
    }
};
