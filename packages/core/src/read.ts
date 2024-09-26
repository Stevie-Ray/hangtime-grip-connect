import type { Device } from "./models/device.model"
import { getCharacteristic } from "./characteristic"

/**
 * Reads the value of the specified characteristic from the device.
 * @param {Device} board - The device to read from.
 * @param {string} serviceId - The service ID where the characteristic belongs.
 * @param {string} characteristicId - The characteristic ID to read from.
 * @param {number} [duration=0] - The duration to wait before resolving the promise, in milliseconds.
 * @returns {Promise<string>} A promise that resolves when the read operation is completed.
 */
export const read = (board: Device, serviceId: string, characteristicId: string, duration = 0): Promise<string> => {
  return new Promise((resolve, reject) => {
    if (board.isConnected()) {
      const characteristic = getCharacteristic(board, serviceId, characteristicId)

      if (characteristic) {
        characteristic
          .readValue()
          .then((value) => {
            let decodedValue: string
            const decoder = new TextDecoder("utf-8")
            switch (characteristicId) {
              case "level":
                // TODO: This is Motherboard specific.
                decodedValue = value.getUint8(0).toString()
                break
              default:
                decodedValue = decoder.decode(value)
                break
            }
            // Resolve after specified duration
            setTimeout(() => {
              return resolve(decodedValue)
            }, duration)
          })
          .catch((error) => {
            reject(error)
          })
      } else {
        reject(new Error("Characteristic is undefined"))
      }
    }
  })
}
