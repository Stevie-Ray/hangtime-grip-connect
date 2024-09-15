### Supported Devices

```ts
import { Entralpi, KilterBoard, Motherboard, Progressor, WHC06 } from "./devices"
```

### Basic Usage

```ts
import { connect, disconnect, Progressor } from "@hangtime/grip-connect"

connect(Progressor, async () => {
  /**
   * Disconnects the device if it is currently connected.
   * - Checks if the device is connected via its GATT server.
   * - If the device is connected, it attempts to gracefully disconnect.
   * @param {Device} board - The device to be disconnected. The device must have a `gatt` property accessible through `board.device`.
   */
  await disconnect(Progressor)
})
```
