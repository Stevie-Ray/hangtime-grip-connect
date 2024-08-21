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
     * Reads the value of the specified characteristic from the device.
     * @param {Device} board - The device to read from.
     * @param {string} serviceId - The service ID where the characteristic belongs.
     * @param {string} characteristicId - The characteristic ID to read from.
     * @param {number} [duration=0] - The duration to wait before resolving the promise, in milliseconds.
     * @returns {Promise<void>} A promise that resolves when the read operation is completed.
     */
    await write(Motherboard, "led", "01", "0", 1000)
})
```