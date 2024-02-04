import { Device } from "./devices/types"
import { isConnected } from "./is-connected"
import { getCharacteristic } from "./characteristic"

/**
 * write
 * @param characteristic
 * @param message
 */
export const write = (
  board: Device,
  serviceId: string,
  characteristicId: string,
  message: string,
  duration: number = 0,
): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (isConnected(board)) {
      const encoder = new TextEncoder()

      const characteristic = getCharacteristic(board, serviceId, characteristicId)

      if (characteristic) {
        characteristic
          .writeValue(encoder.encode(message))
          .then(() => {
            if (duration !== 0) {
              setTimeout(() => {
                resolve()
              }, duration)
            }
          })
          .catch((error) => {
            reject(error)
          })
      } else {
        reject(new Error("Characteristics is undefined"))
      }
    } else {
      reject(new Error("Device is not connected"))
    }
  })
}
