import type { Device } from "./types/devices"
import { isConnected } from "./is-connected"
import { getCharacteristic } from "./characteristic"

/**
 * The last message written to the device.
 * @type {string | Uint8Array | null}
 */
export let lastWrite: string | Uint8Array | null = null

/**
 * Writes a message to the specified characteristic of the device.
 * @param {Device} board - The device board to write to.
 * @param {string} serviceId - The service ID where the characteristic belongs.
 * @param {string} characteristicId - The characteristic ID to write to.
 * @param {string | Uint8Array | undefined} message - The message to write.
 * @param {number} [duration=0] - The duration to wait before resolving the promise, in milliseconds.
 * @returns {Promise<void>} A promise that resolves when the write operation is completed.
 */
export const write = (
  board: Device,
  serviceId: string,
  characteristicId: string,
  message: string | Uint8Array | undefined,
  duration: number = 0,
): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (isConnected(board)) {
      // Check if message is provided
      if (message === undefined) {
        // If not provided, return without performing write operation
        return
      }
      // Get the characteristic from the device using serviceId and characteristicId
      const characteristic = getCharacteristic(board, serviceId, characteristicId)
      if (characteristic) {
        // Convert the message to Uint8Array if it's a string
        const valueToWrite: Uint8Array = typeof message === "string" ? new TextEncoder().encode(message) : message
        // Write the value to the characteristic
        characteristic
          .writeValue(valueToWrite)
          .then(() => {
            // Update the last written message
            lastWrite = message
            // If a duration is specified, resolve the promise after the duration
            if (duration > 0) {
              setTimeout(() => {
                resolve()
              }, duration)
            } else {
              // Otherwise, resolve the promise immediately
              resolve()
            }
          })
          .catch((error) => {
            reject(error)
          })
      } else {
        // Reject if characteristic is undefined
        reject(new Error("Characteristics is undefined"))
      }
    }
  })
}
