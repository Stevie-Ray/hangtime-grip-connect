### Supported Devices

```ts
import { Entralpi, ForceBoard, Motherboard } from "./devices"
```

### Basic Usage

```ts
import { Motherboard } from "@hangtime/grip-connect"

const motherboard = new Motherboard()

motherboard.connect(async () => {
  /**
   * Retrieves manufacturer information from the device.
   * @returns {Promise<string>} A Promise that resolves with the manufacturer information,
   */
  const manufacturerInfo = await motherboard.manufacturer()
  console.log(manufacturerInfo)
})
```
