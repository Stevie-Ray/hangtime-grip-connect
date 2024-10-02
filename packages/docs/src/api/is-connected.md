### Supported Devices

```ts
import { Entralpi, ForceBoard, KilterBoard, Motherboard, Progressor, WHC06 } from "./devices"
```

### Basic Usage

```ts
import { isConnected, Progressor } from "@hangtime/grip-connect"

const progressor = new Progressor()
/**
 * Checks if a Bluetooth device is connected.
 * @param {Device} board - The device to check for connection.
 * @returns {boolean} A boolean indicating whether the device is connected.
 */
progressor.isConnected()
```
