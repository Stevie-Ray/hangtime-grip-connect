### Supported Devices

```ts
import { Entralpi, Motherboard, Progressor, WHC06 } from "./devices"
```

### Interface

```ts
interface massObject {
  /** The total mass. */
  massTotal: string
  /**  The total maximum mass. */
  massMax: string
  /** The total average mass. */
  massAverage: string
  /** The mass on the left side (optional: Motherboard). */
  massLeft?: string
  /** The mass at the center (optional: Motherboard). */
  massCenter?: string
  /** The mass on the right side (optional: Motherboard). */
  massRight?: string
}
```

### Basic Usage

```ts
import { connect, notify, Motherboard } from "@hangtime/grip-connect"
import type { massObject } from "@hangtime/grip-connect/dist/types/notify"

const progressor = new Progressor()

progressor.connect(async () => {
  /**
   * Sets the callback function to be called when notifications are received.
   * @param {NotifyCallback} callback - The callback function to be set.
   * @returns {void}
   */
  notify((data: massObject) => {
    // { massTotal: "0", massMax: "0", massAverage: "0", massLeft: "0", massCenter: "0", massRight: "0" }
    console.log(data)
  })
})
```
