import { Device } from "./devices/types"
import { isConnected } from "./is-connected"
import { getCharacteristic } from "./characteristic"

export let lastWrite: string | null = null
/**
 * write
 * @param characteristic
 * @param message
 */
export const write = (
  board: Device,
  serviceId: string,
  characteristicId: string,
  message: string | undefined,
  duration: number = 0,
): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (isConnected(board)) {
      if (!message) return
      const characteristic = getCharacteristic(board, serviceId, characteristicId)
      if (characteristic) {
        const encoder = new TextEncoder()
        characteristic
          .writeValue(encoder.encode(message))
          .then(() => {
            // update last written message
            lastWrite = message
            // handle timeout
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
