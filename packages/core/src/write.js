import { getCharacteristic } from "./characteristic";
/**
 * write
 * @param characteristic
 * @param message
 */
export const write = (board, serviceId, characteristicId, message, duration = 0) => {
    return new Promise((resolve, reject) => {
        if (board.device?.gatt?.connected) {
            const encoder = new TextEncoder();
            const characteristic = getCharacteristic(board, serviceId, characteristicId);
            if (characteristic) {
                characteristic
                    .writeValue(encoder.encode(message))
                    .then(() => {
                    setTimeout(() => {
                        resolve();
                    }, duration);
                })
                    .catch((error) => {
                    reject(error);
                });
            }
            else {
                reject(new Error("Characteristics is undefined"));
            }
        }
        else {
            reject(new Error("Device is not connected"));
        }
    });
};
