### Supported Devices

```ts
import { Motherboard, Progressor } from "./devices"
```

### Basic Usage

```ts
import { connect, firmware, Progressor } from "@hangtime/grip-connect"

const progressor = new Progressor()

progressor.connect(async () => {
  /**
   * Retrieves firmware version from the device.
   * - For Motherboard devices, it reads the firmare version.
   * - For Progressor devices, it sends a command to retrieve firware version.
   *
   * @param {Device} board - The device from which to retrieve firmware version.
   * @returns {Promise<string>} A Promise that resolves with the firmware version,
   */
  const firmwareVersion = await firmware(Progressor)
  console.log(firmwareVersion)
})
```
