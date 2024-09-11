### Supported Devices

```ts
import { Motherboard } from "./devices"
```

### Basic Usage

```ts
import { connect, read, Motherboard } from "@hangtime/grip-connect"

connect(Motherboard, async () => {
  /**
   * Reads the value of the specified characteristic from the device.
   * @param {Device} board - The device to read from.
   * @param {string} serviceId - The service ID where the characteristic belongs.
   * @param {string} characteristicId - The characteristic ID to read from.
   * @param {number} [duration=0] - The duration to wait before resolving the promise, in milliseconds.
   * @returns {Promise<void>} A promise that resolves when the read operation is completed.
   */
  await read(Motherboard, "battery", "level", 250)
})
```