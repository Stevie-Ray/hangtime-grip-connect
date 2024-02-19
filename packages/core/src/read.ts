import { Device } from "./devices/types"
import { getCharacteristic } from "./characteristic"
import { isConnected } from "./is-connected"

/**
 * Reads the value of the specified characteristic from the device.
 * @param {Device} board - The device to read from.
 * @param {string} serviceId - The service ID where the characteristic belongs.
 * @param {string} characteristicId - The characteristic ID to read from.
 * @param {number} [duration=0] - The duration to wait before resolving the promise, in milliseconds.
 * @returns {Promise<void>} A promise that resolves when the read operation is completed.
 */
export const read = (
  board: Device,
  serviceId: string,
  characteristicId: string,
  duration: number = 0,
): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (isConnected(board)) {
      const characteristic = getCharacteristic(board, serviceId, characteristicId)

      if (characteristic) {
        characteristic
          .readValue()
          .then((value) => {
            let decodedValue
            const decoder = new TextDecoder("utf-8")
            switch (characteristicId) {
              case "level":
                // TODO: This is Motherboard specific.
                decodedValue = value.getUint8(0)
                break
              default:
                decodedValue = decoder.decode(value)
                break
            }
            // TODO: Create Read callback
            console.log(decodedValue)
            // Resolve after specified duration
            setTimeout(() => {
              resolve()
            }, duration)
          })
          .catch((error) => {
            reject(error)
          })
      } else {
        reject(new Error("Characteristic is undefined"))
      }
    } else {
      reject(new Error("Device is not connected"))
    }
  })
}
