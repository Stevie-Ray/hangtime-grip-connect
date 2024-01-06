/**
 * disconnect
 * @param board
 */
export const disconnect = (board) => {
    if (!board.device)
        return;
    if (board.device.gatt?.connected) {
        board.device.gatt?.disconnect();
    }
};
