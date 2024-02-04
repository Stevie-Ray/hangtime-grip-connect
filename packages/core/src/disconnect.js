import { isConnected } from "./is-connected";
/**
 * disconnect
 * @param board
 */
export const disconnect = (board) => {
    if (isConnected(board)) {
        board.device?.gatt?.disconnect();
    }
};
