### Supported Devices

```ts
import { Motherboard, Progressor } from "./devices"
```

### Basic Usage

```ts
import { connect, battery, Progressor } from "@hangtime/grip-connect"

connect(Progressor, async () => {
  /**
   * Retrieves battery or voltage information from the device.
   * - For Motherboard devices, it reads the battery level.
   * - For Progressor devices, it sends a command to retrieve battery voltage information.
   *
   * @param {Device} board - The device from which to retrieve battery information.
   * @returns {Promise<string | undefined>} A Promise that resolves with the battery or voltage information,
   */
  const batteryLevel = await battery(Progressor)
  console.log(batteryLevel)
})
```
