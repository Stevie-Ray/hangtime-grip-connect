import { write } from "./write";
import { read } from "./read";
import { isConnected } from "./is-connected";
import { Motherboard, Tindeq } from "./devices";
import { MotherboardCommands, TindeqCommands } from "./commands";
/**
 * Get device information
 * @param board
 */
export const info = async (board) => {
    if (isConnected(board)) {
        if (board.name === "Motherboard") {
            await read(Motherboard, "device", "manufacturer", 250);
            await read(Motherboard, "device", "hardware", 250);
            await read(Motherboard, "device", "firmware", 250);
            await write(Motherboard, "uart", "tx", String(MotherboardCommands.GET_TEXT), 250);
            await write(Motherboard, "uart", "tx", String(MotherboardCommands.GET_SERIAL), 250);
        }
        if (board.name === "Tindeq") {
            await write(Tindeq, "progressor", "tx", String(TindeqCommands.GET_APP_VERSION), 250);
        }
    }
};
