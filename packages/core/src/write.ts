import { Device } from "./devices/types"
import { isConnected } from "./is-connected"
import { getCharacteristic } from "./characteristic"

/**
 * The last message written to the device.
 * @type {string | null}
 */
export let lastWrite: string | null = null

/**
 * Writes a message to the specified characteristic of the device.
 * @param {Device} board - The device board to write to.
 * @param {string} serviceId - The service ID where the characteristic belongs.
 * @param {string} characteristicId - The characteristic ID to write to.
 * @param {string | undefined} message - The message to write.
 * @param {number} [duration=0] - The duration to wait before resolving the promise, in milliseconds.
 * @returns {Promise<void>} A promise that resolves when the write operation is completed.
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
      // Check if message is provided
      if (!message) {
        // If not provided, return without performing write operation
        return
      }
      // Get the characteristic
      const characteristic = getCharacteristic(board, serviceId, characteristicId)
      if (characteristic) {
        // Encode the message
        const encoder = new TextEncoder()
        characteristic
          .writeValue(encoder.encode(message))
          .then(() => {
            // Update the last written message
            lastWrite = message
            // Handle timeout
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
        // Reject if characteristic is undefined
        reject(new Error("Characteristics is undefined"))
      }
    } else {
      // Reject if device is not connected
      reject(new Error("Device is not connected"))
    }
  })
}
