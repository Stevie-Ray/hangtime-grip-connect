### Supported Devices

```ts
import { Motherboard } from "./devices"
```

### Basic Usage

```ts
import { connect, serial, Motherboard } from "@hangtime/grip-connect"

connect(Motherboard, async () => {
  /**
   * Retrieves serial number from the device.
   * - For Motherboard devices, it reads the serial number.
   *
   * @param {Device} board - The device from which to retrieve serial number.
   * @returns {Promise<string>} A Promise that resolves with the serial number,
   *                            or rejects with an error if the device is not connected.
   * @throws {Error} Throws an error if the device is not connected.
   */
  const serialNumber = await serial(Motherboard)
  console.log(serialNumber)
})
```
