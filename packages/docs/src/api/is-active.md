### Supported Devices

```ts
import { Entralpi, Motherboard, WHC06, Progressor } from "./devices"
```

### Basic Usage

```ts
import { active, isActive, connect, notify } from "@hangtime/grip-connect"

connect(Progressor, async () => {
  // Listen for stream notifications
  notify((data) => {
    // data: { massTotal: "0", massMax: "0", massAverage: "0", massLeft: "0", massCenter: "0", massRight: "0" }

    // Manually whether the device is currently active.
    console.log(isActive)
  })

  /**
   * Callback function that is triggered when the activity status changes.
   *
   * @param {boolean} value - The new activity status (true if active, false if not).
   */
  active((value: boolean) => {
    console.log(value)
  })
})
```
