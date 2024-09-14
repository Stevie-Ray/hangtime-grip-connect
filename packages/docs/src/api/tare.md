### Supported Devices

```ts
import { Entralpi, KilterBoard, Motherboard, Progressor, WHC06 } from "./devices"
```

### Basic Usage

```ts
import { connect, tare, Progressor } from "@hangtime/grip-connect"

connect(Progressor, async () => {
  /**
   * Initiates the tare calibration process.
   * @param {number} time - The duration time for tare calibration process.
   * @returns {void} A Promise that resolves when tare calibration is initiated.
   */
  await tare(5000)
})
```
