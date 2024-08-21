### Supported Devices

```ts
import { Entralpi, Motherboard, WHC06, Progressor } from "./devices"
```

### Basic Usage

```ts
import { connect, notify, Motherboard } from "@hangtime/grip-connect"
import type { massObject } from "@hangtime/grip-connect/dist/types/notify"

connect(Progressor, async () => {
    // Listen for stream notifications
    notify((data: massObject) => {
      // { massTotal: "0", massMax: "0", massAverage: "0", massLeft: "0", massCenter: "0", massRight: "0" }
      console.log(data)
    })
})
```