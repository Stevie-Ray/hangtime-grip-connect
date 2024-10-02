### Supported Devices

```ts
import { Motherboard, Progressor } from "@hangtime/grip-connect"
```

### Basic Usage

```ts
import { stop, Progressor } from "@hangtime/grip-connect"

const progressor = new Progressor()

progressor.connect(async () => {
  /**
   * Stops the data stream on the specified device.
   * @param {Device} board - The device to stop the stream on.
   * @returns {Promise<void>} A promise that resolves when the stream is stopped.
   */
  await stop(progressor)
})
```
