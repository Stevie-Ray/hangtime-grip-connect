### Supported Devices

```ts
import { Entralpi, KilterBoard, Motherboard, WHC06, Progressor } from "./devices"
```

### Basic Usage

```ts
import { connect, disconnect, Progressor } from "@hangtime/grip-connect"

connect(Progressor, async () => {
    /**
     * Disconnects the device if it is connected.
     * @param {Device} board - The device to disconnect.
     */
    await disconnect(Progressor)
})
```