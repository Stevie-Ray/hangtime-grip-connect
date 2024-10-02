### Supported Devices

```ts
import { KilterBoard, Motherboard, Progressor } from "@hangtime/grip-connect"
```

### Warning

Using other commands then `@hangtime/grip-connect/dist/commands` can seriously harm your device

### Basic Usage

```ts
import { write, Motherboard } from "@hangtime/grip-connect"

const motherboard = new Motherboard()

motherboard.connect(async () => {
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
   * @throws {Error} Throws an error if the characteristic is undefined.
   *
   * @example
   * // Example usage of the write function with a custom callback
   * await write(device, "serviceId", "characteristicId", "Hello World", 250, (data) => {
   *   console.log(`Custom response: ${data}`);
   * });
   */
  await write(motherboard, "led", "red", new Uint8Array([0x01]))
  await write(motherboard, "led", "green", new Uint8Array([0x00]), 2500)
})
```
