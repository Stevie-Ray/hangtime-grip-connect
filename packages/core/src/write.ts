import type { Device } from "./types/devices"
import { isConnected } from "./is-connected"
import { getCharacteristic } from "./characteristic"

/**
 * The last message written to the device.
 * @type {string | Uint8Array | null}
 */
export let lastWrite: string | Uint8Array | null = null

/** Define the type for the callback function */
type WriteCallback = (data: string) => void

/**
 * A default write callback that logs the response
 */
export let writeCallback: WriteCallback = (data: string) => {
  console.log(data)
}

/**
 * Writes a message to the specified characteristic of a Bluetooth device and optionally provides a callback to handle responses.
 *
 * @param {Device} board - The Bluetooth device to which the message will be written.
 * @param {string} serviceId - The service UUID of the Bluetooth device containing the target characteristic.
 * @param {string} characteristicId - The characteristic UUID where the message will be written.
 * @param {string | Uint8Array | undefined} message - The message to be written to the characteristic. It can be a string or a Uint8Array.
 * @param {number} [duration=0] - Optional. The time in milliseconds to wait before resolving the promise. Defaults to 0 for immediate resolution.
 * @param {WriteCallback} [callback=writeCallback] - Optional. A custom callback to handle the response after the write operation is successful.
 *
 * @returns {Promise<void>} A promise that resolves once the write operation is complete.
 *
 * @throws {Error} Throws an error if the characteristic is undefined or if the device is not connected.
 *
 * @example
 * // Example usage of the write function with a custom callback
 * await write(device, "serviceId", "characteristicId", "Hello World", 250, (data) => {
 *   console.log(`Custom response: ${data}`);
 * });
 */
export const write = async (
  board: Device,
  serviceId: string,
  characteristicId: string,
  message: string | Uint8Array | undefined,
  duration = 0,
  callback: WriteCallback = writeCallback,
): Promise<void> => {
  if (!isConnected(board)) {
    throw new Error("Device is not connected")
  }
  // Check if message is provided
  if (message === undefined) {
    // If not provided, return without performing write operation
    return
  }
  // Get the characteristic from the device using serviceId and characteristicId
  const characteristic = getCharacteristic(board, serviceId, characteristicId)
  if (!characteristic) {
    throw new Error("Characteristic is undefined")
  }
  // Convert the message to Uint8Array if it's a string
  const valueToWrite: Uint8Array = typeof message === "string" ? new TextEncoder().encode(message) : message
  // Write the value to the characteristic
  await characteristic.writeValue(valueToWrite)
  // Update the last written message
  lastWrite = message
  // Assign the provided callback to `writeCallback`

  writeCallback = callback
  // If a duration is specified, resolve the promise after the duration

  if (duration > 0) {
    await new Promise<void>((resolve) => setTimeout(resolve, duration))
  }
}
