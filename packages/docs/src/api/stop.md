### Supported Devices

```ts
import { Motherboard, Progressor } from "./devices"
```

### Basic Usage

```ts
import { connect, stop, Progressor } from "@hangtime/grip-connect"

connect(Motherboard, async () => {
  /**
   * Stops the data stream on the specified device.
   * @param {Device} board - The device to stop the stream on.
   * @returns {Promise<void>} A promise that resolves when the stream is stopped.
   */
  await stop(Progressor)
})
```
