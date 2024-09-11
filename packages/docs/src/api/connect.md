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
 * @param {Function} [onSuccess] - Optional callback function to execute on successful connection. Default logs success.
 * @param {Function} [onError] - Optional callback function to execute on error. Default logs the error.
 */
connect(
  Progressor,
  async () => {
    /* onSuccess */
  },
  (error: Error) => {
    /* onError */
    console.error(error)
  },
)
```