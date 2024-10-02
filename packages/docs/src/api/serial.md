### Supported Devices

```ts
import { Motherboard } from "./devices"
```

### Basic Usage

```ts
import { connect, serial, Motherboard } from "@hangtime/grip-connect"

const motherboard = new Motherboard()

motherboard.connect(async () => {
  /**
   * Retrieves serial number from the device.
   * @returns {Promise<string>} A Promise that resolves with the serial number,
   */
  const serialNumber = await motherboard.serial()
  console.log(serialNumber)
})
```
