### Supported Devices

```ts
import { Motherboard, Progressor } from "./devices"
```

### Warning

Using other commands then `@hangtime/grip-connect/dist/commands` can seriously harm your device

### Basic Usage

```ts
import { connect, write, Motherboard } from "@hangtime/grip-connect"

connect(Motherboard, async () => {
  /**
   * Writes a message to the specified characteristic of the device.
   * @param {Device} board - The device board to write to.
   * @param {string} serviceId - The service ID where the characteristic belongs.
   * @param {string} characteristicId - The characteristic ID to write to.
   * @param {string | Uint8Array | undefined} message - The message to write.
   * @param {number} [duration=0] - The duration to wait before resolving the promise, in milliseconds.
   * @returns {Promise<void>} A promise that resolves when the write operation is completed.
   */
  await write(Motherboard, "led", "01", "0", 1000)
})
```
