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
   * @param {Device} board - The device.
   * @returns {Promise<void>} A Promise that resolves when the information is successfully retrieved.
   */
  await battery(Progressor)
})
```
