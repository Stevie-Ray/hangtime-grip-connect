### Supported Devices

```ts
import { Motherboard, Progressor } from "./devices"
```

### Basic Usage

```ts
import { Progressor } from "@hangtime/grip-connect"

const progressor = new Progressor()

progressor.connect(async () => {
  /**
   * Starts streaming data from the specified device.
   * @param {number} [duration=0] - The duration of the stream in milliseconds. If set to 0, stream will continue indefinitely.
   * @returns {Promise<void>} A promise that resolves when the streaming operation is completed.
   */
  await progressor.stream(60000)
})
```
