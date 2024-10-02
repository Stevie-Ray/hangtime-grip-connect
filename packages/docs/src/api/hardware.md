### Supported Devices

```ts
import { Entralpi, Motherboard } from "./devices"
```

### Basic Usage

```ts
import { Motherboard } from "@hangtime/grip-connect"

const motherboard = new Motherboard()

motherboard.connect(async () => {
  /**
   * Retrieves hardware version from the device.
   * @returns {Promise<string>} A Promise that resolves with the hardware version,
   */
  const hardwareVersion = await hardware(Motherboard)
  console.log(hardwareVersion)
})
```
