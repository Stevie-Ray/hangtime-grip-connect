### Supported Devices

```ts
import { Motherboard, Progressor } from "./devices"
```

### Basic Usage

```ts
import { connect, stream, Progressor } from "@hangtime/grip-connect"

connect(Progressor, async () => {
  /**
   * Starts streaming data from the specified device.
   * @param {Device} board - The device to stream data from.
   * @param {number} [duration=0] - The duration of the stream in milliseconds. If set to 0, stream will continue indefinitely.
   * @returns {Promise<void>} A promise that resolves when the streaming operation is completed.
   */
  await stream(Progressor, 60000)
})
```
