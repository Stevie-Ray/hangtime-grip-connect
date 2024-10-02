### Supported Devices

```ts
import { Motherboard, KilterBoard } from "./devices"
```

### Basic Usage

```ts
import { Motherboard } from "@hangtime/grip-connect"

const motherboard = new Motherboard()

motherboard.connect(async () => {
  /**
   * Sets the LEDs on the specified device.
   * @param {"green" | "red" | "orange"} [config] - Optional color or array of climb placements for the LEDs. Ignored if placements are provided.
   * @returns {Promise<number[] | undefined>} A promise that resolves with the payload array for the Kilter Board if LED settings were applied, or `undefined` if no action was taken or for the Motherboard.
   */
  await motherboard.led("red")
  await motherboard.led()
})
```
