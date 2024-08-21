### Supported Devices

```ts
import { Entralpi, KilterBoard, Motherboard, WHC06, Progressor } from "./devices"
```

### Basic Usage

```ts
import { connect } from "@hangtime/grip-connect"

/**
 * Connects to a Bluetooth device.
 * @param {Device} board - The device to connect to.
 * @param {Function} onSuccess - Callback function to execute on successful connection.
 */
connect(Progressor, async () => {
    /* onSuccess */
})
```