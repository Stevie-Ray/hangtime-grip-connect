import { notifyCallback } from "./notify";
import { getCharacteristic } from "./characteristic";
/**
 * read
 * @param characteristic
 */
export const read = (board, serviceId, characteristicId, duration = 0) => {
    return new Promise((resolve, reject) => {
        if (board.device?.gatt?.connected) {
            const characteristic = getCharacteristic(board, serviceId, characteristicId);
            if (characteristic) {
                characteristic
                    .readValue()
                    .then((value) => {
                    let decodedValue;
                    const decoder = new TextDecoder("utf-8");
                    switch (characteristicId) {
                        case "level":
                            decodedValue = value.getUint8(0);
                            break;
                        default:
                            decodedValue = decoder.decode(value);
                            break;
                    }
                    if (notifyCallback) {
                        notifyCallback({ uuid: characteristic.uuid, value: decodedValue });
                    }
                    setTimeout(() => {
                        resolve();
                    }, duration);
                })
                    .catch((error) => {
                    reject(error);
                });
            }
            else {
                reject(new Error("Characteristic is undefined"));
            }
        }
        else {
            reject(new Error("Device is not connected"));
        }
    });
};
