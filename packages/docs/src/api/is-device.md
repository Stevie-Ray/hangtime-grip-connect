### Supported Devices

```ts
import { Entralpi, Kilterboard, Motherboard, Progressor, WHC06 } from "./devices"
```

### Basic Usage

```ts
import { connect, Progressor, isProgressor } from "@hangtime/grip-connect"

connect(Progressor, async () => {
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
