### Supported Devices

```ts
import { Entralpi, ForceBoard, Kilterboard, Motherboard, Progressor, WHC06 } from "@hangtime/grip-connect"
```

### Basic Usage

```ts
import { Progressor, isProgressor } from "@hangtime/grip-connect"

const progressor = new Progressor()

progressor.connect(async () => {
  /**
   * Checks if the given device of a certain type.
   * @param {Device} [board] - The device to check.
   * @returns {boolean} - `true` if the device matches, otherwise `false`.
   */
  if (isProgressor(board)) {
    // Handle the Progressor device
  }
})
```
