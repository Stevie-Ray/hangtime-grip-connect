### Supported Devices

```ts
import { Motherboard } from "./devices"
```

### Basic Usage

```ts
import { connect, hardware, Motherboard } from "@hangtime/grip-connect"

connect(Motherboard, async () => {
  /**
   * Retrieves hardware version from the device.
   * - For Motherboard devices, it reads the hardware version.
   *
   * @param {Device} board - The device from which to retrieve hardware version.
   * @returns {Promise<string>} A Promise that resolves with the hardware version,
   *                            or rejects with an error if the device is not connected.
   * @throws {Error} Throws an error if the device is not connected.
   */
  const hardwareVersion = await hardware(Motherboard)
  console.log(hardwareVersion)
})
```
