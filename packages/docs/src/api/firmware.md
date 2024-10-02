### Supported Devices

```ts
import { Entralpi, Motherboard, Progressor } from "./devices"
```

### Basic Usage

```ts
import { Progressor } from "@hangtime/grip-connect"

const progressor = new Progressor()

progressor.connect(async () => {
  /**
   * Retrieves firmware version from the device.
   * @returns {Promise<string>} A Promise that resolves with the firmware version,
   */
  const firmwareVersion = await progressor.firmware()
  console.log(firmwareVersion)
})
```
