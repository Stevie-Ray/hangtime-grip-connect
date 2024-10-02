### Supported Devices

```ts
import { Entralpi, ForceBoard, Motherboard, Progressor } from "./devices"
```

### Basic Usage

```ts
import { Progressor } from "@hangtime/grip-connect"

const progressor = new Progressor()

progressor.connect(async () => {
  /**
   * Retrieves battery or voltage information from the device.
   * @returns {Promise<string | undefined>} A Promise that resolves with the battery or voltage information,
   */
  const batteryLevel = await progressor.battery()
  console.log(batteryLevel)
})
```
